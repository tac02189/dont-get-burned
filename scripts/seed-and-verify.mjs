/* Seeds a realistic session + votes via the Firestore REST API (admin
   credential, bypasses rules), then reads them back the way the deck's
   listener would and computes the same tally. Verifies the data model
   and the percentage maths without needing anonymous auth. */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const P = "mizzou-pocus-live";
const BASE = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`;
const cfg = JSON.parse(readFileSync(join(homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"));
const H = { Authorization: "Bearer " + cfg.tokens.access_token, "Content-Type": "application/json" };

const call = async (m, u, b) => {
  const r = await fetch(u, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};

const now = () => new Date().toISOString();

let r = await call("PATCH", `${BASE}/sessions/BURN-7K4Q`, {
  fields: {
    ownerUid:    { stringValue: "seed-presenter" },
    title:       { stringValue: "Dont Get Burned" },
    currentPoll: { integerValue: "4" },
    state:       { stringValue: "open" },
    q: { mapValue: { fields: {
      stem: { stringValue: "What do you do next?" },
      options: { arrayValue: { values: [
        { stringValue: "Not an aneurysm" },
        { stringValue: "Activate now" },
        { stringValue: "Re-measure first" }
      ]}}
    }}},
    createdAt: { timestampValue: now() }
  }
});
console.log("session write ->", r.status, r.body.error ? r.body.error.message : "ok");

// 17 devices voting on poll 4
const picks = [0,0,0,0,0,0,0,1,1,1,2,2,2,2,2,2,2];
let ok = 0;
for (let i = 0; i < picks.length; i++) {
  const rr = await call("PATCH", `${BASE}/sessions/BURN-7K4Q/polls/4/votes/seed-device-${i}`, {
    fields: { choice: { integerValue: String(picks[i]) }, at: { timestampValue: now() } }
  });
  if (rr.status === 200) ok++; else if (i === 0) console.log("  vote error:", JSON.stringify(rr.body).slice(0, 200));
}
console.log(`votes written -> ${ok}/${picks.length}`);

// read back exactly as live.js does, and tally the same way
r = await call("GET", `${BASE}/sessions/BURN-7K4Q/polls/4/votes?pageSize=100`);
const docs = r.body.documents || [];
const counts = [0, 0, 0];
docs.forEach(d => { const c = +d.fields.choice.integerValue; if (c >= 0 && c < 3) counts[c]++; });
const total = counts.reduce((a, b) => a + b, 0);
console.log("tally read back ->", JSON.stringify(counts), "total", total,
  "| pct", total ? counts.map(c => Math.round(c / total * 100) + "%").join(" / ") : "n/a");

// confirm the session doc round-trips the shape the phone client reads
r = await call("GET", `${BASE}/sessions/BURN-7K4Q`);
const f = r.body.fields || {};
console.log("session round-trip ->", JSON.stringify({
  currentPoll: f.currentPoll?.integerValue,
  state: f.state?.stringValue,
  optionCount: f.q?.mapValue?.fields?.options?.arrayValue?.values?.length
}));
