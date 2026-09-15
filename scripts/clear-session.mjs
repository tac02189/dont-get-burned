/* Wipes a session and all its votes. Run before presenting so a rehearsal
   or a test never leaves stale votes in the room's tally.
   Usage: node scripts/clear-session.mjs [CODE]   (default BURN-7K4Q) */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CODE = process.argv[2] || "BURN-7K4Q";
const P = "mizzou-pocus-live";
const BASE = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`;
const cfg = JSON.parse(readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"));
const H = { Authorization: "Bearer " + cfg.tokens.access_token, "Content-Type": "application/json" };

const call = async (m, u) => {
  const r = await fetch(u, { method: m, headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};

/* Votes live under polls/<run>-<n>/votes since 2026-09-14, and the parent
   poll documents are implicit (never written), so they only show up with
   showMissing. Listing beats guessing: a run id cannot be enumerated. */
const buckets = [];
const listed = await call("GET", `${BASE}/sessions/${CODE}/polls?showMissing=true&pageSize=300`);
for (const d of (listed.body.documents || [])) buckets.push(d.name.split("/polls/")[1]);
for (let poll = 1; poll <= 12; poll++) if (!buckets.includes(String(poll))) buckets.push(String(poll));

let removed = 0;
for (const bucket of buckets) {
  const r = await call("GET", `${BASE}/sessions/${CODE}/polls/${encodeURIComponent(bucket)}/votes?pageSize=300`);
  for (const d of (r.body.documents || [])) {
    const rel = d.name.split("/documents/")[1];
    const dr = await call("DELETE", `${BASE}/${rel}`);
    if (dr.status === 200) removed++;
  }
}
const s = await call("DELETE", `${BASE}/sessions/${CODE}`);
console.log(`cleared ${CODE}: ${removed} vote(s) deleted, session doc -> ${s.status === 200 ? "deleted" : s.status}`);
