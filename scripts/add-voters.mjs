/* Adds N extra anonymous voters to a live poll, so a solo rehearsal
   produces a realistic-looking tally. Each is a genuine anonymous
   identity writing its own vote doc through the real rules.
   Usage: node scripts/add-voters.mjs [code] [poll] [choice,choice,...] */
const KEY  = "AIzaSyBTBKa8xzwVP6scDtnyzXem1RJ7AYajMSM";
const PROJ = "mizzou-pocus-live";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;

const CODE   = process.argv[2] || "BURN-7K4Q";
const POLL   = process.argv[3] || "4";
const PICKS  = (process.argv[4] || "0,0,0,0,0,1,1,2,2").split(",").map(Number);

/* Vote where the deck is actually listening: the session's current run. */
let RUN = "";
{
  const probe = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }) });
  const pu = await probe.json();
  const sr = await fetch(`${BASE}/sessions/${CODE}`, { headers: { Authorization: "Bearer " + pu.idToken } });
  if (sr.ok) RUN = (await sr.json()).fields?.run?.stringValue || "";
  console.log(RUN ? `voting into run ${RUN}` : "no run on this session — using the legacy flat path");
}
const BUCKET = RUN ? `${RUN}-${POLL}` : String(POLL);

let ok = 0;
for (const choice of PICKS) {
  const s = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const u = await s.json();
  if (u.error) { console.error("sign-in failed:", u.error.message); break; }
  const r = await fetch(`${BASE}/sessions/${CODE}/polls/${BUCKET}/votes/${u.localId}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + u.idToken, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: {
      choice: { integerValue: String(choice) },
      at: { timestampValue: new Date().toISOString() }
    }})
  });
  if (r.ok) ok++; else console.error("  vote rejected:", r.status, (await r.text()).slice(0,120));
}
console.log(`${ok}/${PICKS.length} extra voters added to ${CODE} poll ${POLL}`);
