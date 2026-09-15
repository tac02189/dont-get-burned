/* ============================================================
   End-to-end poll test with REAL anonymous tokens.

   The rules simulator proved the logic; this proves the deployed system.
   Two genuinely separate anonymous identities — a presenter and an
   attendee — exercising the paths that matter, including the two abuse
   cases, against live Firestore over HTTPS.
   ============================================================ */
const KEY  = "AIzaSyBTBKa8xzwVP6scDtnyzXem1RJ7AYajMSM";
const PROJ = "mizzou-pocus-live";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;
const CODE = "E2E-TEST";

const signInAnon = async (label) => {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const j = await r.json();
  if (j.error) throw new Error(label + " sign-in failed: " + j.error.message);
  console.log(`  ${label} signed in as ${j.localId}`);
  return { uid: j.localId, token: j.idToken };
};

const fsCall = async (method, path, who, body) => {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: "Bearer " + who.token, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = want === "ok" ? (got >= 200 && got < 300) : (got === 403 || got === 401);
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (HTTP ${got}, wanted ${want === "ok" ? "2xx" : "denied"})`);
};

console.log("\n--- two independent anonymous identities ---");
const presenter = await signInAnon("presenter");
const attendee  = await signInAnon("attendee ");

console.log("\n--- presenter drives the session ---");
let r = await fsCall("PATCH", `/sessions/${CODE}`, presenter, {
  fields: {
    ownerUid:    { stringValue: presenter.uid },
    title:       { stringValue: "E2E" },
    currentPoll: { integerValue: "4" },
    state:       { stringValue: "open" },
    q: { mapValue: { fields: {
      stem: { stringValue: "What do you do next?" },
      options: { arrayValue: { values: [
        { stringValue: "Not an aneurysm" }, { stringValue: "Activate now" }, { stringValue: "Re-measure first" }
      ]}}
    }}},
    createdAt: { timestampValue: new Date().toISOString() }
  }
});
check("presenter creates the session", r.status, "ok");

console.log("\n--- attendee joins and votes ---");
r = await fsCall("GET", `/sessions/${CODE}`, attendee);
check("attendee reads which poll is open", r.status, "ok");
if (r.status === 200) {
  const f = r.body.fields;
  console.log(`        sees poll ${f.currentPoll.integerValue}, state "${f.state.stringValue}", ` +
              `${f.q.mapValue.fields.options.arrayValue.values.length} options`);
}

r = await fsCall("PATCH", `/sessions/${CODE}/polls/4/votes/${attendee.uid}`, attendee,
  { fields: { choice: { integerValue: "2" }, at: { timestampValue: new Date().toISOString() } } });
check("attendee casts their own vote", r.status, "ok");

r = await fsCall("PATCH", `/sessions/${CODE}/polls/4/votes/${attendee.uid}`, attendee,
  { fields: { choice: { integerValue: "0" }, at: { timestampValue: new Date().toISOString() } } });
check("attendee changes their own vote", r.status, "ok");

console.log("\n--- the two abuse cases, against the real deployment ---");
r = await fsCall("PATCH", `/sessions/${CODE}/polls/4/votes/${presenter.uid}`, attendee,
  { fields: { choice: { integerValue: "1" }, at: { timestampValue: new Date().toISOString() } } });
check("BALLOT STUFFING under another device's id", r.status, "denied");

r = await fsCall("PATCH", `/sessions/${CODE}?updateMask.fieldPaths=currentPoll`, attendee,
  { fields: { currentPoll: { integerValue: "6" } } });
check("ATTENDEE tries to drive the presenter's deck", r.status, "denied");

r = await fetch(`${BASE}/sessions/${CODE}`);   // no Authorization header at all
check("unauthenticated stranger reads the session", r.status, "denied");

console.log("\n--- presenter tallies ---");
// a couple more voters so the tally is not trivial
for (let i = 0; i < 4; i++) {
  const v = await signInAnon(`voter-${i}  `);
  await fsCall("PATCH", `/sessions/${CODE}/polls/4/votes/${v.uid}`, v,
    { fields: { choice: { integerValue: String(i % 3) }, at: { timestampValue: new Date().toISOString() } } });
}
r = await fsCall("GET", `/sessions/${CODE}/polls/4/votes?pageSize=100`, presenter);
check("presenter reads the votes", r.status, "ok");
const counts = [0, 0, 0];
(r.body.documents || []).forEach(d => { const c = +d.fields.choice.integerValue; if (c >= 0 && c < 3) counts[c]++; });
const total = counts.reduce((a, b) => a + b, 0);
console.log(`        tally ${JSON.stringify(counts)} of ${total} ->`,
  total ? counts.map(c => Math.round(c / total * 100) + "%").join(" / ") : "n/a");

console.log("\n--- cleanup ---");
for (const d of (r.body.documents || [])) {
  const rel = d.name.split("/documents/")[1];
  await fsCall("DELETE", `/${rel}`, presenter);
}
const del = await fsCall("DELETE", `/sessions/${CODE}`, presenter);
console.log(`  test session removed (HTTP ${del.status})`);

console.log(`\n${pass}/${pass + fail} checks passed${fail ? `, ${fail} FAILED` : ""}`);
