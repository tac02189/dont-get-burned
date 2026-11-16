/* ============================================================
   pocus-live — the deck's side of the live poll.

   pocus-live-lectures/engine/live.js is a copy of this file. Reviews of that
   copy on 2026-11-12 found bugs that were also here, and four fixes were
   ported back the same day, each commented and dated: publish() gives its
   writes an 8-second deadline, so a dropped network turns the pill to "Show
   of hands" instead of leaving it on "Voting open"; claim() drops the old
   run's vote listener; the deck signs in through a named Firebase app, so the
   phone page (/j, same origin) cannot replace the deck's identity; and a deck
   served from localhost drives LOCAL-<code>, never the live session.

   A Codex review of that port then found that the deadline needs more care,
   because a write past its deadline is not lost: it lands when the network
   returns. Fixed here the same day, and not yet in the copy: startRun() waits
   for its write's real outcome, onSlide() forgets curPoll after a missed
   deadline, only the newest write may report "live", newRun() goes through
   the slide queue, and closeVoting() lets O close the phones from any slide.
   A bug fixed in one copy belongs in both.

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
/* A deck served from this machine (the preview pane, a local rehearsal) never
   drives the live code unless told to with ?s=: it drives LOCAL-<code>.
   Opening a local preview used to claim the real session for the preview
   browser — the exact lockout the comment above describes. (2026-11-12) */
const LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const CODE = new URLSearchParams(location.search).get("s") || (LOCAL ? "LOCAL-" + SESSION_CODE : SESSION_CODE);
/* The session this deck is actually driving, so the speaker notes can name
   it in the clear-session command instead of assuming the live code. */
export const ACTIVE_CODE = CODE;

const OWNER_KEY = "pocus-live:owner:" + CODE;
let db = null, uid = null, sessionRef = null, unsubVotes = null;
let curPoll = null;   // what the phones have actually been told to show
let subPoll = null;   // which poll's votes we are listening to
let canDrive = false; // are our writes landing?
let queue = Promise.resolve();   // one write at a time
let seq = 0;                     // newest slide change wins
let lastIntent = null;           // replayed after a takeover
/* lastIntent when the last thing asked of the phones was "close what you hold"
   (O on a slide with no poll, before this page sent any poll), so that it is
   replayed too (Codex review of the O fix, 2026-11-13). */
const CLOSE_HELD = Object.freeze({ closeHeld: true });
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
    const [{ initializeApp, getApps }, auth, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);
    // A NAMED app keeps the deck's anonymous identity apart from the phone
    // page's. Both are served from the same origin, and Firebase Auth persists
    // one user per (apiKey, app name) and syncs it across tabs: with the
    // default app, opening /j in this browser while the deck was starting
    // signed the deck in as the phone's user, its claim write never resolved,
    // and the deck sat in "off" — then "readonly" after a reload, because the
    // session belonged to the user it had lost. Found on the deployed
    // pocus-live-lectures site, 2026-11-12. The deck's own identity still
    // survives a reload.
    const app = getApps().find(x => x.name === "pocus-deck") || initializeApp(CONFIG, "pocus-deck");
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
      // being presented right now. R R can still take that one (newRun).
      const took = await takeover(fs);
      if(!took) status("readonly", "session " + CODE + " is owned by another browser (" +
        String(snap.data().ownerUid).slice(0, 6) + "…) and was driven within the last 30 minutes");
    }else{
      localStorage.setItem(OWNER_KEY, uid);
      status("live", "owner");
    }

    if(snap.exists()) await adoptRun(fs, snap.data());

    watchOwner(fs);
    startHeartbeat(fs);
    window.__deckLiveReady({ fs, ok:true });
    return { fs };
  }catch(e){ quiet("start")(e); status("offline", (e && e.message) || "start failed"); return null; }
}

/* Notice at once when another browser takes the session with R R. Without
   this a deck learned it only at its next write, which on a parked slide is
   the five-minute heartbeat, and went on saying "Voting open" while the phones
   followed the other deck (Codex review, 2026-11-15). Only a server snapshot
   counts: a cached one may be stale, and one carrying this deck's own pending
   write says nothing about the server. Losing ownership is all this reports;
   the deck takes the session back only when R is pressed twice. */
function watchOwner(fs){
  try{
    fs.onSnapshot(sessionRef, { includeMetadataChanges: true }, (snap) => {
      if(!snap.exists() || snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
      const owner = snap.data().ownerUid;
      if(canDrive && owner && owner !== uid)
        status("readonly", "another browser took this session (R R there)");
    }, quiet("owner watch"));
  }catch(e){ quiet("owner watch")(e); }
}

/* Create the session and take ownership of it. */
async function claim(fs){
  // Keep the run we were counting if this page already had one. Measured
  // 2026-11-12: when a session is deleted mid-talk, the rules answer the next
  // update with permission-denied (resource is null), not not-found, so the
  // not-found -> claim() recovery in publish() does not actually run, and the
  // deck reports read-only. The fix is a reload, which comes back through
  // start() -> claim() with no run, so a new one starts. This line only
  // matters if that recovery is ever reached.
  run = run || newRunId();
  // A new run is a new vote path: drop the old listener so the next slide change
  // subscribes to this run. Without this, re-creating a deleted session left the
  // deck counting the old run while the phones voted into the new one.
  // (2026-11-12)
  curPoll = null; subPoll = null;
  if(unsubVotes){ unsubVotes(); unsubVotes = null; }
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
  return await startRun(fs, false);
}

/* Begin a fresh run and park the phones on "waiting" until the next poll.
   rr: the presenter pressed R twice. Only then may a refused write fall back
   to a takeover, because the rules let a takeover that starts a new run take
   even a session being presented. Without this, a deck starting a run at boot
   whose write was refused (another browser had just pressed R R) took the
   session straight back with no keypress (Codex review, 2026-11-15). */
async function startRun(fs, rr){
  const id = newRunId();
  // wait: a run change must never be half-applied. With the write deadline,
  // a reset sent while offline used to return false while the SDK kept the
  // write: it landed later, the phones moved to the new run, and the deck went
  // on counting the old one (Codex review of this port, 2026-11-12). So the
  // pill still turns to "Show of hands" after the deadline, but this waits for
  // the write's real outcome before the deck switches its own run.
  const ok = await publish(fs, { run: id, currentPoll: 0, state: "idle", q: {} }, rr ? undefined : false, { wait: true });
  if(ok){
    run = id; curPoll = null; subPoll = null;
    if(unsubVotes){ unsubVotes(); unsubVotes = null; }
    // The phones are parked on "waiting" now. Forget the last poll, so a
    // takeover replay or O cannot send a question from before the reset into
    // the new run. The deck sends the current slide's intent next.
    lastIntent = null;
    console.info("[pocus-live] new vote run " + id + " — tallies start empty");
  }
  return ok;
}

/* Presenter pressed R twice: start a new lecture on the same session code.
   The reset goes through the slide queue, not beside it: a reset that overtook
   a slide write still waiting there let that older poll go out after it and
   reopen voting on the new run (Codex re-review, 2026-11-12; older than the
   port). It waits behind at most two slide writes; and since startRun()
   waits for the network, slide writes made while a reset is pending wait
   behind it, then the newest of them goes out after it. The deck refuses
   R R while it already knows it is offline.

   Since 2026-11-15 (the presenter's decision) R R also takes the session from
   another browser. On a deck that does not own it, startRun()'s write is
   refused; publish() retries it through takeover(), which names this deck as
   owner in the same write, and the rules allow exactly that write — a new,
   empty run — even on a session being presented (firestore.rules,
   newRunTakeover). Nothing else a locked deck sends can take the session. */
export async function newRun(fsMod){
  if(!db || !fsMod || !sessionRef) return null;
  let ok = false;
  const p = queue = queue.then(async () => { ok = await startRun(fsMod, true); }).catch(quiet("newRun"));
  await p;
  return ok ? run : null;
}

/* Claim a session that is not ours. The rules allow this when nobody has
   driven it for 30 minutes, which rescues an abandoned session, and for R R's
   new, empty run, which may take even a live one (newRun). `extra` is
   published in the same write. */
async function takeover(fs, extra){
  try{
    await fs.updateDoc(sessionRef, Object.assign({}, extra || {}, {
      ownerUid: uid, heartbeat: fs.serverTimestamp() }));
    localStorage.setItem(OWNER_KEY, uid);
    status("live", extra && extra.run ? "took the session for a new run (R R)"
                                      : "claimed a session that had been left idle");
    return true;
  }catch(e){ quiet("takeover")(e); return false; }
}

/* Proof of life. It is what stops anyone claiming the session mid-talk under
   the 30-minute rule (R R is the exception: newRun), and — when we are the one
   locked out — the retry that gets it back. */
function startHeartbeat(fs){
  if(hbTimer) return;
  hbTimer = setInterval(async () => {
    try{
      if(canDrive){
        await fs.updateDoc(sessionRef, { heartbeat: fs.serverTimestamp() });
      }else if(await takeover(fs)){
        curPoll = null;                       // republish stem and options
        if(lastIntent === CLOSE_HELD) closeVoting(fs);
        else if(lastIntent) onSlide(fs, lastIntent);
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
/* An offline write never rejects: the SDK queues it and the promise simply waits.
   Without a deadline the deck went on saying "Voting open" while no phone could
   hear it. Past the deadline, say "offline" now, and "live" again the moment the
   queued write lands. (2026-11-12) */
const WRITE_DEADLINE_MS = 8000;
/* Only the NEWEST write may report "live". Writes land in the order they were
   sent, so the newest one landing means every earlier one has too; an older
   one landing says nothing about the slide on screen now, and used to put
   "Voting open" back while the current question was still queued (Codex
   review of this port, 2026-11-12). */
let writeSeq = 0;
/* opts.wait: past the deadline, still report "offline", but go on waiting for
   the write's real outcome instead of returning false. startRun() needs that. */
async function publish(fs, fields, retry, opts){
  try{
    const w = fs.updateDoc(sessionRef, Object.assign({}, fields,
      { heartbeat: fs.serverTimestamp() }));
    const mine = ++writeSeq;
    const landed = await Promise.race([
      w.then(() => true),
      new Promise(r => setTimeout(() => r(false), WRITE_DEADLINE_MS))
    ]);
    if(!landed){
      status("offline", "a write has not been acknowledged in " + (WRITE_DEADLINE_MS / 1000) + " s");
      if(!(opts && opts.wait)){
        // The queued write can still FAIL later. Don't swallow that: a late
        // permission-denied means another browser owns the session now. The next
        // slide change retries through publish()'s normal recovery either way.
        w.then(() => { if(mine === writeSeq && !canDrive) status("live", "queued writes landed"); })
         .catch(e => {
           quiet("late write")(e);
           if(e && e.code === "permission-denied")
             status("readonly", "a delayed write was rejected — another browser owns this session");
         });
        return false;
      }
      await w;   // a rejection here goes to the recovery below, like any other
    }
    if(mine === writeSeq && !canDrive) status("live", "writes are landing again");
    return true;
  }catch(e){
    if(e && e.code === "not-found" && retry !== false){
      // clear-session.mjs was run, or the doc was deleted mid-talk.
      // Recreate it (which claims it) and republish this slide.
      try{ await claim(fs); return await publish(fs, fields, false, opts); }
      catch(e2){ quiet("reclaim")(e2); }
    }
    if(e && e.code === "permission-denied" && retry !== false){
      // Another browser owns it. If they have gone quiet the rules give it
      // back; if they are presenting right now, they keep it and we say so,
      // unless this write is R R's reset, whose takeover the rules allow even
      // then (newRun). Say read-only before asking: a takeover sent as the
      // network goes down has no deadline and waits for it to return, and the
      // pill must not go on saying "Voting open" meanwhile (Codex review,
      // 2026-11-15).
      if(canDrive) status("readonly", "this deck no longer owns the session");
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
      // A write that missed its deadline may still land later, so after one
      // the deck no longer knows which question the phones will end up on:
      // forget, and send the whole question again next time. Keeping the old
      // value left phones on poll 2 while the deck showed poll 1 "Voting open"
      // (Codex review of this port, 2026-11-12).
      curPoll = ok ? poll : null;
    }else{
      // Same question, different slide: open on the poll, closed on the
      // reveal — including when the presenter walks BACK to re-run a poll,
      // which used to leave every phone locked out.
      const ok = await publish(fs, { state: open ? "open" : "closed" });
      if(!ok) curPoll = null;
    }

    if(poll !== subPoll){ subscribeVotes(fs, poll); subPoll = poll; }
  }).catch(quiet("onSlide"));
}

/* Hands mode (O) pressed on a slide with no poll — a content slide, or after
   leaving a poll through the grid or Home: close the question the phones were
   last given. On poll and reveal slides the deck already sends open:false.
   (Codex review of this port, 2026-11-12) */
export function closeVoting(fsMod){
  if(!db || !fsMod || !sessionRef) return;
  if(lastIntent && lastIntent !== CLOSE_HELD){
    if(lastIntent.open !== false) onSlide(fsMod, Object.assign({}, lastIntent, { open: false }));
    return;
  }
  // Nothing sent from this page yet: a reload onto a slide with no poll while
  // a poll was still open, or O right after a reset. Close whatever the phones
  // hold, where it stands. (Codex re-review, 2026-11-12)
  // Remember it as the intent to replay. A deck that came up read-only is
  // refused here, and the heartbeat that later takes the session back replays
  // only lastIntent, so the phones stayed open (Codex review of the O fix,
  // 2026-11-13). A poll slide or R R replaces it, as with any other intent.
  lastIntent = CLOSE_HELD;
  const mine = ++seq;
  queue = queue.then(async () => {
    if(mine !== seq) return;
    if(!(await publish(fsMod, { state: "closed" }))) curPoll = null;
  }).catch(quiet("closeVoting"));
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
