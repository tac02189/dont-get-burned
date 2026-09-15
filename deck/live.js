/* ============================================================
   pocus-live — the deck's side of the live poll.

   DESIGN RULE: this module may never block, delay, or break the deck.
   Every failure path is silent to the AUDIENCE and leaves the deck in
   show-of-hands mode. A conference network is assumed hostile: captive
   portals, blocked WebSockets, dead cellular. The talk must work anyway.

   It must NOT be silent to the PRESENTER. Every failure is reported to
   the deck through window.__deckLiveStatus so the vote pill stops
   claiming "Voting open" when no phone can hear us. That gap is what
   broke the room on 2026-09-14: the session doc was owned by another
   browser, every update was rejected, and the deck said nothing.

   Real-time logic (includeMetadataChanges + the not-exists-from-cache
   guard) is ported from World Cup Bracket src/lib/hooks.js, where it
   was written to stop a listener hanging forever on a document that
   does not exist yet — exactly the case here before the first vote.
   ============================================================ */

import { CONFIG, SESSION_CODE } from "./firebase-config.js";

/* ?s=<code> drives a scratch session instead of the real one. Rehearsal and
   automated QA MUST use it: whichever browser creates a session owns it for
   good, so testing against the live code silently locks the presenter out of
   their own talk. That is exactly how this went wrong the first time. */
const CODE = new URLSearchParams(location.search).get("s") || SESSION_CODE;

const OWNER_KEY = "pocus-live:owner:" + CODE;
let db = null, uid = null, sessionRef = null, unsubVotes = null;
let curPoll = null;   // what the phones have actually been told to show
let subPoll = null;   // which poll's votes we are listening to
let canDrive = false; // are our writes landing?
let queue = Promise.resolve();   // one write at a time
let seq = 0;                     // newest slide change wins
let lastIntent = null;           // replayed after a takeover
let hbTimer = null;
let run = null;                  // vote namespace for THIS lecture

/* A lecture gets its own vote namespace rather than wiping the last one.
   Votes are immutable by rule -- nobody may delete one -- so an empty tally
   has to come from an empty path: polls/<run>-<n>/votes/<device>. Nothing is
   destroyed, no delete storm can race a room that is already voting, and last
   month's answers are still there if they are ever wanted.

   A session untouched for this long is a different lecture. A reload five
   minutes into a talk is not, and must keep the tallies already collected --
   which is why this hangs off the heartbeat and not off page load. */
const RUN_GAP_MS = 2 * 60 * 60 * 1000;

function newRunId(){
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return "r" + d.getUTCFullYear() + p(d.getUTCMonth()+1) + p(d.getUTCDate())
       + "t" + p(d.getUTCHours()) + p(d.getUTCMinutes())
       + "-" + Math.random().toString(36).slice(2, 6);
}
/* Sessions written before runs existed keep the flat path they used. */
const votePath = (poll) => run ? run + "-" + poll : String(poll);

const quiet = (label) => (e) => {
  // Never throw into the deck. Log once for post-mortem, then carry on.
  console.warn("[pocus-live] " + label + ":", e && e.message ? e.message : e);
};

/* The deck decides what to show the room; it is told the truth here. */
function status(state, detail){
  canDrive = (state === "live");
  if(typeof window.__deckLiveStatus === "function") window.__deckLiveStatus(state, detail || "");
}

export async function start(){
  if(!CONFIG || !CONFIG.apiKey || CONFIG.apiKey.startsWith("REPLACE")){
    console.info("[pocus-live] not configured — deck stays in show-of-hands mode.");
    status("off", "not configured");
    return null;
  }
  try{
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);
    const app = initializeApp(CONFIG);
    const a = auth.getAuth(app);
    db = fs.getFirestore(app);

    // Hard timeout: if sign-in has not completed in 6 seconds we are on a
    // captive portal or a blocked network. Give up rather than hang the deck.
    const cred = await Promise.race([
      auth.signInAnonymously(a),
      new Promise((_, rej) => setTimeout(() => rej(new Error("auth timeout")), 6000))
    ]);
    uid = cred.user.uid;
    sessionRef = fs.doc(db, "sessions", CODE);

    const snap = await fs.getDoc(sessionRef);
    if(!snap.exists()){
      await claim(fs);
    }else if(snap.data().ownerUid !== uid){
      // Someone else owns this session code — a different browser, a different
      // machine, or a QA run that claimed it first. Ownership is an anonymous
      // uid living in one browser profile, so a stale one would lock the
      // presenter out of their own talk. Ask for it: the rules hand over a
      // session that has been quiet for 30 minutes, and refuse one that is
      // being presented right now.
      const took = await takeover(fs);
      if(!took) status("readonly", "session " + CODE + " is owned by another browser (" +
        String(snap.data().ownerUid).slice(0, 6) + "…) and was driven within the last 30 minutes");
    }else{
      localStorage.setItem(OWNER_KEY, uid);
      status("live", "owner");
    }

    if(snap.exists()) await adoptRun(fs, snap.data());

    startHeartbeat(fs);
    window.__deckLiveReady({ fs, ok:true });
    return { fs };
  }catch(e){ quiet("start")(e); status("offline", (e && e.message) || "start failed"); return null; }
}

/* Create the session and take ownership of it. */
async function claim(fs){
  run = newRunId();
  await fs.setDoc(sessionRef, {
    ownerUid: uid, title: "Don't Get Burned", currentPoll: 0,
    state: "idle", q: {}, createdAt: fs.serverTimestamp(),
    heartbeat: fs.serverTimestamp(), run: run
  });
  localStorage.setItem(OWNER_KEY, uid);
  status("live", "created session " + CODE);
}

/* Is this the same lecture we were in, or a new one? Only the heartbeat can
   say: a reload mid-talk finds a session that was driven moments ago and keeps
   its run, while a deck opened the next morning starts a clean tally. */
async function adoptRun(fs, d){
  const hb = d.heartbeat && typeof d.heartbeat.toMillis === "function" ? d.heartbeat.toMillis() : 0;
  const sameLecture = d.run && hb && (Date.now() - hb) < RUN_GAP_MS;
  if(sameLecture){ run = d.run; return false; }
  if(!canDrive){ run = d.run || null; return false; }   // read-only: follow along, change nothing
  return await startRun(fs);
}

/* Begin a fresh run and park the phones on "waiting" until the next poll. */
async function startRun(fs){
  const id = newRunId();
  const ok = await publish(fs, { run: id, currentPoll: 0, state: "idle", q: {} });
  if(ok){
    run = id; curPoll = null; subPoll = null;
    if(unsubVotes){ unsubVotes(); unsubVotes = null; }
    console.info("[pocus-live] new vote run " + id + " — tallies start empty");
  }
  return ok;
}

/* Presenter pressed R twice: start a new lecture on the same session code. */
export async function newRun(fsMod){
  if(!db || !fsMod || !sessionRef) return null;
  return (await startRun(fsMod)) ? run : null;
}

/* Claim a session that is not ours. The rules allow this only when nobody has
   driven it for 30 minutes, so this can rescue an abandoned session and can
   never steal a live one. `extra` is published in the same write. */
async function takeover(fs, extra){
  try{
    await fs.updateDoc(sessionRef, Object.assign({}, extra || {}, {
      ownerUid: uid, heartbeat: fs.serverTimestamp() }));
    localStorage.setItem(OWNER_KEY, uid);
    status("live", "claimed a session that had been left idle");
    return true;
  }catch(e){ quiet("takeover")(e); return false; }
}

/* Proof of life. It is what stops anyone claiming the session mid-talk, and
   — when we are the one locked out — the retry that gets it back. */
function startHeartbeat(fs){
  if(hbTimer) return;
  hbTimer = setInterval(async () => {
    try{
      if(canDrive){
        await fs.updateDoc(sessionRef, { heartbeat: fs.serverTimestamp() });
      }else if(await takeover(fs)){
        curPoll = null;                       // republish stem and options
        if(lastIntent) onSlide(fs, lastIntent);
      }
    }catch(e){
      if(e && e.code === "permission-denied")
        status("readonly", "another browser has taken this session");
      quiet("heartbeat")(e);
    }
  }, 5 * 60 * 1000);
}

/* One write to the session doc, with the recoveries that matter:
   a cleared session is recreated, and a recovered network is noticed. */
async function publish(fs, fields, retry){
  try{
    await fs.updateDoc(sessionRef, Object.assign({}, fields,
      { heartbeat: fs.serverTimestamp() }));
    if(!canDrive) status("live", "writes are landing again");
    return true;
  }catch(e){
    if(e && e.code === "not-found" && retry !== false){
      // clear-session.mjs was run, or the doc was deleted mid-talk.
      // Recreate it (which claims it) and republish this slide.
      try{ await claim(fs); return await publish(fs, fields, false); }
      catch(e2){ quiet("reclaim")(e2); }
    }
    if(e && e.code === "permission-denied" && retry !== false){
      // Another browser owns it. If they have gone quiet the rules give it
      // back; if they are presenting right now, they keep it and we say so.
      if(await takeover(fs, fields)) return true;
    }
    status(e && e.code === "permission-denied" ? "readonly" : "offline",
           (e && e.code) || (e && e.message) || "write failed");
    quiet("publish")(e);
    return false;
  }
}

/* Called by the deck whenever the active slide changes. `intent` is
   { poll, open, ask, options }, built by the deck from the POLL slide. */
export function onSlide(fsMod, intent){
  if(!db || !fsMod || !sessionRef || !intent || !intent.poll) return;
  const fs = fsMod;
  lastIntent = intent;
  const mine = ++seq;
  // Serialized, and superseded writes are dropped. Two slide changes in one
  // tick used to race; whichever landed last won, which is how a reveal could
  // leave the phones voting on a question the room had already been shown.
  queue = queue.then(async () => {
    if(mine !== seq) return;
    const poll = intent.poll;
    // The deck must send a built intent, not a raw slide. It sent a slide from
    // one call site for a while, and `open` came back undefined — which reads
    // as false, so booting straight onto a poll slide published it CLOSED and
    // every phone refused the vote. Derive it rather than close a live poll,
    // and say so loudly.
    if(typeof intent.open !== "boolean")
      console.warn("[pocus-live] onSlide got no open flag — call site is passing a raw slide");
    const open = typeof intent.open === "boolean" ? intent.open : intent.type === "poll";

    if(poll !== curPoll){
      // Publish what the phones should show. Options are short labels only —
      // the stem stays on the big screen so eyes stay up.
      const ok = await publish(fs, {
        currentPoll: poll,
        state: open ? "open" : "closed",
        q: { stem: (intent.ask || "Choose one"), options: intent.options || [] }
      });
      // curPoll only moves when the phones have actually been told to move.
      // If the write failed the room is still on the previous question, and
      // the next slide change retries instead of assuming it got through.
      if(ok) curPoll = poll;
    }else{
      // Same question, different slide: open on the poll, closed on the
      // reveal — including when the presenter walks BACK to re-run a poll,
      // which used to leave every phone locked out.
      await publish(fs, { state: open ? "open" : "closed" });
    }

    if(poll !== subPoll){ subscribeVotes(fs, poll); subPoll = poll; }
  }).catch(quiet("onSlide"));
}

function subscribeVotes(fs, poll){
  if(unsubVotes){ unsubVotes(); unsubVotes = null; }
  try{
    const col = fs.collection(db, "sessions", CODE, "polls", votePath(poll), "votes");
    unsubVotes = fs.onSnapshot(col, { includeMetadataChanges: true }, (snap) => {
      // An empty result served from cache just means we are offline with no
      // local copy — not "nobody voted". Suppress it so the deck does not
      // flash a 0/0/0 bar chart at the room.
      if(snap.empty && snap.metadata.fromCache) return;
      const counts = [0,0,0,0,0,0];
      snap.forEach(d => { const c = d.data().choice; if(c>=0 && c<6) counts[c]++; });
      window.__deckLive(poll, counts.slice(0,3));
    }, quiet("votes"));
  }catch(e){ quiet("subscribe")(e); }
}
