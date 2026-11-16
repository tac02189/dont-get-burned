/* ============================================================
   Security-rules test suite for pocus-live, run against the DEPLOYED
   ruleset via the Firebase Security Rules test API.

   The two things that actually matter in a live conference poll:
     (a) an attendee must not be able to drive the presenter's deck
     (b) one device must not be able to stuff the ballot
   Everything below exists to prove those, plus the ordinary shape checks.

   Since 2026-11-15, (a) has one exception, chosen by the presenter: R R
   takes the session from any browser, but only by emptying it (a new run,
   phones parked on "waiting", no question). The R R section below proves
   it opens for exactly that write and for nothing else.
   ============================================================ */
import { readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJ = "mizzou-pocus-live";
const DB   = "/databases/(default)/documents";
const NOW  = new Date().toISOString();
const STALE = new Date(Date.now() - 31*60*1000).toISOString();   // past the 30-minute claim window
const RECENT = new Date(Date.now() -  2*60*1000).toISOString();  // a deck that is presenting right now

const cfg = JSON.parse(readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"));
const TOKEN = cfg.tokens.access_token;
const RULES = readFileSync(join(root, "live", "firestore.rules"), "utf8");

const OWNER = "presenter-uid-1";
const VOTER = "attendee-uid-2";
const OTHER = "attendee-uid-3";

const sessionDoc = (ownerUid = OWNER) => ({
  ownerUid, title: "Don't Get Burned", currentPoll: 1, state: "open",
  q: { stem: "What now?", options: ["A","B","C"] }, createdAt: NOW
});

/* A session another deck is presenting right now, and the R R takeover of it. */
const LIVE = { ...sessionDoc(OWNER), heartbeat: RECENT, run: "r20261115t2255-bkxg" };
const RR = (over = {}) => ({ ...LIVE, ownerUid: OTHER, heartbeat: NOW,
  run: "r20261116t0100-ab12", currentPoll: 0, state: "idle", q: {}, ...over });

/* req(method, path, auth, incomingData) */
const req = (method, path, uid, data) => ({
  auth: uid ? { uid, token: { firebase: { sign_in_provider: "anonymous" } } } : null,
  path: DB + path,
  method,
  time: NOW,
  ...(data ? { resource: { data } } : {})
});

const CASES = [
  // ---- session lifecycle ----
  { n:"presenter creates a session owned by themselves", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, sessionDoc(OWNER)) },

  { n:"attacker creates a session claiming someone else owns it", e:"DENY",
    r: req("create", "/sessions/BURN-7K4Q", OTHER, sessionDoc(OWNER)) },

  { n:"session create with an unexpected extra field", e:"DENY",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(), backdoor:true }) },

  { n:"session create with a bogus state value", e:"DENY",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(), state:"whatever" }) },

  { n:"owner advances to the next poll", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(), currentPoll:2 }),
    existing: sessionDoc() },

  // THE one that matters: an attendee must not be able to drive the talk
  { n:"ATTENDEE tries to drive the presenter's deck", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, { ...sessionDoc(), currentPoll:6 }),
    existing: sessionDoc() },

  { n:"owner tries to hand ownership to someone else mid-session", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OWNER, sessionDoc(OTHER)),
    existing: sessionDoc() },

  { n:"signed-in phone reads the session to learn which poll is open", e:"ALLOW",
    r: req("get", "/sessions/BURN-7K4Q", VOTER), existing: sessionDoc() },

  { n:"unauthenticated stranger reads the session", e:"DENY",
    r: req("get", "/sessions/BURN-7K4Q", null), existing: sessionDoc() },

  { n:"attendee deletes the session", e:"DENY",
    r: req("delete", "/sessions/BURN-7K4Q", OTHER), existing: sessionDoc() },

  // ---- stale-session takeover (added 2026-09-14) ----
  // A stale ownerUid locked the presenter out of his own talk, silently.
  // These prove the escape hatch opens for him and not for the room.
  { n:"ATTENDEE claims a session the presenter is actively driving, without starting a new run", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER,
           { ...sessionDoc(OTHER), heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  { n:"presenter's new browser claims a session abandoned 31 minutes ago", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OTHER,
           { ...sessionDoc(OTHER), heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: STALE } },

  { n:"claiming a stale session but naming somebody else as owner", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER,
           { ...sessionDoc(VOTER), heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: STALE } },

  { n:"claiming a stale session without stamping a heartbeat", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, sessionDoc(OTHER)),
    existing: { ...sessionDoc(OWNER), heartbeat: STALE } },

  { n:"claiming a stale session with a back-dated heartbeat", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER,
           { ...sessionDoc(OTHER), heartbeat: STALE }),
    existing: { ...sessionDoc(OWNER), heartbeat: STALE } },

  { n:"owner drives a session that already carries a heartbeat", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OWNER,
           { ...sessionDoc(OWNER), currentPoll:3, heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  { n:"heartbeat written as something other than a timestamp", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OWNER,
           { ...sessionDoc(OWNER), heartbeat: "not-a-time" }),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  { n:"session created with a heartbeat", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(OWNER), heartbeat: NOW }) },

  // claim() writes the run id at create time — the deck cannot start without this
  { n:"session created with a run id", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER,
           { ...sessionDoc(OWNER), heartbeat: NOW, run:"r20260914t2210-4ab2" }) },

  // ---- voting ----
  { n:"attendee casts their own vote", e:"ALLOW",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:2, at:NOW }) },

  { n:"attendee changes their own vote", e:"ALLOW",
    r: req("update", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:0, at:NOW }),
    existing: { choice:2, at:NOW } },

  // THE other one that matters: ballot stuffing
  { n:"BALLOT STUFFING — writing a vote under another device's id", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${OTHER}`, VOTER, { choice:1, at:NOW }) },

  { n:"unauthenticated vote", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, null, { choice:1, at:NOW }) },

  { n:"vote with an out-of-range choice", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:99, at:NOW }) },

  { n:"vote with a negative choice", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:-1, at:NOW }) },

  { n:"vote carrying a smuggled extra field", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:1, at:NOW, note:"hi" }) },

  { n:"vote with choice as a string rather than an int", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER, { choice:"1", at:NOW }) },

  { n:"presenter reads the votes to build the tally", e:"ALLOW",
    r: req("get", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, OWNER), existing:{ choice:1, at:NOW } },

  { n:"anyone erases a cast vote", e:"DENY",
    r: req("delete", `/sessions/BURN-7K4Q/polls/1/votes/${VOTER}`, VOTER), existing:{ choice:1, at:NOW } },

  // ---- per-run vote paths (added 2026-09-14) ----
  // Votes moved to polls/<run>-<n>/votes so each lecture starts empty. The
  // poll segment is a wildcard, so the rules should bind exactly as before —
  // these prove it, rather than assuming it.
  { n:"attendee votes on a run-namespaced poll", e:"ALLOW",
    r: req("create", `/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/${VOTER}`, VOTER, { choice:1, at:NOW }) },

  { n:"BALLOT STUFFING on a run-namespaced poll", e:"DENY",
    r: req("create", `/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/${OTHER}`, VOTER, { choice:1, at:NOW }) },

  { n:"erasing a vote on a run-namespaced poll", e:"DENY",
    r: req("delete", `/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/${VOTER}`, VOTER),
    existing: { choice:1, at:NOW } },

  { n:"session update carrying the run field", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(OWNER), run:"r20260914t2210-4ab2", heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  // ---- R R takes the session from any browser (added 2026-11-15) ----
  // The presenter's decision: R R wins from any browser, by emptying the
  // session. LIVE is a session another deck is presenting right now; RR() is
  // exactly what the deck's takeover sends for a new run.
  { n:"R R: another browser takes a session being presented, starting a new, empty run", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR()), existing: LIVE },

  { n:"R R on a session that has no run yet (sessions from before runs)", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR()),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  { n:"R R takeover that keeps the old run (a takeover with no reset)", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ run: LIVE.run })), existing: LIVE },

  { n:"a heartbeat-only claim of a session being presented (what a locked deck's heartbeat sends)", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, { ...LIVE, ownerUid: OTHER, heartbeat: NOW }), existing: LIVE },

  { n:"R R takeover that opens voting in the same write", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ state: "open" })), existing: LIVE },

  { n:"R R takeover that jumps to a poll in the same write", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ currentPoll: 3 })), existing: LIVE },

  { n:"R R takeover that sends a question in the same write", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ q: { stem: "Hijacked", options: ["A","B","C"] } })), existing: LIVE },

  { n:"R R takeover that also renames the session", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ title: "Something else" })), existing: LIVE },

  { n:"R R takeover that drops a field", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, (({ createdAt, ...rest }) => rest)(RR())), existing: LIVE },

  { n:"R R takeover naming somebody else as owner", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ ownerUid: VOTER })), existing: LIVE },

  { n:"R R takeover with a back-dated heartbeat", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ heartbeat: RECENT })), existing: LIVE },

  { n:"R R takeover with a run that is not a string", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", OTHER, RR({ run: 42 })), existing: LIVE },

  { n:"R R takeover by an unauthenticated stranger", e:"DENY",
    r: req("update", "/sessions/BURN-7K4Q", null, RR()), existing: LIVE },

  // ---- everything else is closed ----
  { n:"write to an unrelated collection", e:"DENY",
    r: req("create", "/somethingElse/x", OWNER, { a:1 }) },

  { n:"read an unrelated collection", e:"DENY",
    r: req("get", "/somethingElse/x", OWNER) }
];

const body = {
  source: { files: [{ name: "firestore.rules", content: RULES }] },
  testSuite: {
    testCases: CASES.map(c => ({
      expectation: c.e,
      request: c.r,
      ...(c.existing ? { resource: { data: c.existing } } : {}),
      pathEncoding: "PLAIN",
      expressionReportLevel: "NONE"
    }))
  }
};

const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJ}:test`, {
  method: "POST",
  headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
const out = await res.json();

if (out.error) { console.error("API error:", out.error.message); process.exit(1); }
if (out.issues?.length) {
  console.error("RULES DID NOT COMPILE:");
  out.issues.forEach(i => console.error("  " + i.severity + " line " + (i.sourcePosition?.line) + ": " + i.description));
  process.exit(1);
}

const results = out.testResults || [];
let pass = 0, fail = 0;
results.forEach((r, i) => {
  const ok = r.state === "SUCCESS";
  ok ? pass++ : fail++;
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  [${CASES[i].e.padEnd(5)}] ${CASES[i].n}`);
  if (!ok && r.debugMessages) r.debugMessages.slice(0,2).forEach(m => console.log("        " + m.split("\n")[0]));
});
console.log(`\n${pass}/${results.length} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
