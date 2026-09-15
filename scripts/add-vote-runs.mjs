/* Votes get a per-lecture namespace instead of being deleted.
   Nobody may delete a vote (allow delete: if false), so a fresh tally has to
   come from a fresh path. The deck stamps a run id on the session; deck and
   phone both read/write polls/<run>-<n>/votes/<device>. */
import { readFileSync, writeFileSync } from "node:fs";
const must = (c, m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

/* ================= live.js ================= */
let s = readFileSync("deck/live.js", "utf8");

must(s.includes("let hbTimer = null;"), "live: state anchor");
s = s.replace("let hbTimer = null;", `let hbTimer = null;
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
const votePath = (poll) => run ? run + "-" + poll : String(poll);`);

/* claim() stamps a run */
must(s.includes('    state: "idle", q: {}, createdAt: fs.serverTimestamp(),'), "live: claim anchor");
s = s.replace(`async function claim(fs){
  await fs.setDoc(sessionRef, {
    ownerUid: uid, title: "Don't Get Burned", currentPoll: 0,
    state: "idle", q: {}, createdAt: fs.serverTimestamp(),
    heartbeat: fs.serverTimestamp()
  });`,
`async function claim(fs){
  run = newRunId();
  await fs.setDoc(sessionRef, {
    ownerUid: uid, title: "Don't Get Burned", currentPoll: 0,
    state: "idle", q: {}, createdAt: fs.serverTimestamp(),
    heartbeat: fs.serverTimestamp(), run: run
  });`);

/* adopt or start a run once ownership is settled */
must(s.includes(`    }else{
      localStorage.setItem(OWNER_KEY, uid);
      status("live", "owner");
    }`), "live: ownership branch anchor");
s = s.replace(`    }else{
      localStorage.setItem(OWNER_KEY, uid);
      status("live", "owner");
    }
`,
`    }else{
      localStorage.setItem(OWNER_KEY, uid);
      status("live", "owner");
    }

    if(snap.exists()) await adoptRun(fs, snap.data());
`);

must(s.includes("/* Claim a session that is not ours."), "live: takeover anchor");
s = s.replace("/* Claim a session that is not ours.",
`/* Is this the same lecture we were in, or a new one? Only the heartbeat can
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

/* Claim a session that is not ours.`);

/* votes read from the run's path */
must(s.includes('const col = fs.collection(db, "sessions", CODE, "polls", String(poll), "votes");'), "live: subscribe anchor");
s = s.replace('const col = fs.collection(db, "sessions", CODE, "polls", String(poll), "votes");',
              'const col = fs.collection(db, "sessions", CODE, "polls", votePath(poll), "votes");');
writeFileSync("deck/live.js", s);

/* ================= join.html (the phone) ================= */
let j = readFileSync("deck/join.html", "utf8");

must(j.includes('let voted = {};   // pollNum -> choice, so returning to a poll shows your answer'), "join: voted anchor");
j = j.replace('let voted = {};   // pollNum -> choice, so returning to a poll shows your answer',
`    // keyed by run+poll: a new lecture must not show you last time's answer
    let voted = {};`);

must(j.includes('      const poll = d.currentPoll || 0;'), "join: poll anchor");
j = j.replace('      const poll = d.currentPoll || 0;',
`      const poll = d.currentPoll || 0;
      const run  = d.run || "";               // vote namespace for this lecture
      const key  = run + ":" + poll;`);

must(j.includes('voted[poll]===i?" sel":""'), "join: selected anchor");
j = j.replace('voted[poll]===i?" sel":""', 'voted[key]===i?" sel":""');

must(j.includes('          voted[poll] = i;'), "join: vote write anchor");
j = j.replace('          voted[poll] = i;', '          voted[key] = i;');

must(j.includes('fs.doc(db,"sessions",code,"polls",String(poll),"votes",uid),'), "join: path anchor");
j = j.replace('fs.doc(db,"sessions",code,"polls",String(poll),"votes",uid),',
              'fs.doc(db,"sessions",code,"polls",run ? run + "-" + poll : String(poll),"votes",uid),');
writeFileSync("deck/join.html", j);

console.log("live.js + join.html: votes are now per-run");
