/* clear-session.mjs and add-voters.mjs have to follow votes into their run path. */
import { readFileSync, writeFileSync } from "node:fs";
const must = (c, m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

/* ---- clear-session.mjs: enumerate poll buckets instead of guessing 1..12 ---- */
let c = readFileSync("scripts/clear-session.mjs", "utf8");
must(c.includes("for (let poll = 1; poll <= 12; poll++) {"), "clear: loop anchor");
c = c.replace(`let removed = 0;
for (let poll = 1; poll <= 12; poll++) {
  const r = await call("GET", \`\${BASE}/sessions/\${CODE}/polls/\${poll}/votes?pageSize=300\`);
  for (const d of (r.body.documents || [])) {
    const rel = d.name.split("/documents/")[1];
    const dr = await call("DELETE", \`\${BASE}/\${rel}\`);
    if (dr.status === 200) removed++;
  }
}`,
`/* Votes live under polls/<run>-<n>/votes since 2026-09-14, and the parent
   poll documents are implicit (never written), so they only show up with
   showMissing. Listing beats guessing: a run id cannot be enumerated. */
const buckets = [];
const listed = await call("GET", \`\${BASE}/sessions/\${CODE}/polls?showMissing=true&pageSize=300\`);
for (const d of (listed.body.documents || [])) buckets.push(d.name.split("/polls/")[1]);
for (let poll = 1; poll <= 12; poll++) if (!buckets.includes(String(poll))) buckets.push(String(poll));

let removed = 0;
for (const bucket of buckets) {
  const r = await call("GET", \`\${BASE}/sessions/\${CODE}/polls/\${encodeURIComponent(bucket)}/votes?pageSize=300\`);
  for (const d of (r.body.documents || [])) {
    const rel = d.name.split("/documents/")[1];
    const dr = await call("DELETE", \`\${BASE}/\${rel}\`);
    if (dr.status === 200) removed++;
  }
}`);
writeFileSync("scripts/clear-session.mjs", c);

/* ---- add-voters.mjs: vote into the session's current run ---- */
let a = readFileSync("scripts/add-voters.mjs", "utf8");
must(a.includes("let ok = 0;"), "voters: anchor");
a = a.replace("let ok = 0;",
`/* Vote where the deck is actually listening: the session's current run. */
let RUN = "";
{
  const probe = await fetch(\`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\${KEY}\`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }) });
  const pu = await probe.json();
  const sr = await fetch(\`\${BASE}/sessions/\${CODE}\`, { headers: { Authorization: "Bearer " + pu.idToken } });
  if (sr.ok) RUN = (await sr.json()).fields?.run?.stringValue || "";
  console.log(RUN ? \`voting into run \${RUN}\` : "no run on this session — using the legacy flat path");
}
const BUCKET = RUN ? \`\${RUN}-\${POLL}\` : String(POLL);

let ok = 0;`);
must(a.includes("`${BASE}/sessions/${CODE}/polls/${POLL}/votes/${u.localId}`"), "voters: path anchor");
a = a.replace("`${BASE}/sessions/${CODE}/polls/${POLL}/votes/${u.localId}`",
              "`${BASE}/sessions/${CODE}/polls/${BUCKET}/votes/${u.localId}`");
writeFileSync("scripts/add-voters.mjs", a);

/* ---- test-rules.mjs: prove the vote rules still bind on a run path ---- */
let t = readFileSync("scripts/test-rules.mjs", "utf8");
must(t.includes("  // ---- everything else is closed ----"), "rules test: anchor");
t = t.replace("  // ---- everything else is closed ----",
`  // ---- per-run vote paths (added 2026-09-14) ----
  // Votes moved to polls/<run>-<n>/votes so each lecture starts empty. The
  // poll segment is a wildcard, so the rules should bind exactly as before —
  // these prove it, rather than assuming it.
  { n:"attendee votes on a run-namespaced poll", e:"ALLOW",
    r: req("create", \`/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/\${VOTER}\`, VOTER, { choice:1, at:NOW }) },

  { n:"BALLOT STUFFING on a run-namespaced poll", e:"DENY",
    r: req("create", \`/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/\${OTHER}\`, VOTER, { choice:1, at:NOW }) },

  { n:"erasing a vote on a run-namespaced poll", e:"DENY",
    r: req("delete", \`/sessions/BURN-7K4Q/polls/r20260914t2210-4ab2-3/votes/\${VOTER}\`, VOTER),
    existing: { choice:1, at:NOW } },

  { n:"session update carrying the run field", e:"ALLOW",
    r: req("update", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(OWNER), run:"r20260914t2210-4ab2", heartbeat: NOW }),
    existing: { ...sessionDoc(OWNER), heartbeat: RECENT } },

  // ---- everything else is closed ----`);
writeFileSync("scripts/test-rules.mjs", t);
console.log("helpers + rules tests updated for runs");
