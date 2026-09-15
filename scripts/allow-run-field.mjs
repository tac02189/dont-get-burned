import { readFileSync, writeFileSync } from "node:fs";
const must = (c, m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

let r = readFileSync("live/firestore.rules", "utf8");
must(r.includes("['ownerUid','title','currentPoll','state','q','createdAt','heartbeat'])"), "rules: hasOnly anchor");
r = r.replace("['ownerUid','title','currentPoll','state','q','createdAt','heartbeat'])",
              "['ownerUid','title','currentPoll','state','q','createdAt','heartbeat','run'])");
writeFileSync("live/firestore.rules", r);

let t = readFileSync("scripts/test-rules.mjs", "utf8");
must(t.includes(`  { n:"session created with a heartbeat", e:"ALLOW",`), "test: create anchor");
t = t.replace(`  { n:"session created with a heartbeat", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(OWNER), heartbeat: NOW }) },`,
`  { n:"session created with a heartbeat", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER, { ...sessionDoc(OWNER), heartbeat: NOW }) },

  // claim() writes the run id at create time — the deck cannot start without this
  { n:"session created with a run id", e:"ALLOW",
    r: req("create", "/sessions/BURN-7K4Q", OWNER,
           { ...sessionDoc(OWNER), heartbeat: NOW, run:"r20260914t2210-4ab2" }) },`);
writeFileSync("scripts/test-rules.mjs", t);
console.log("rules: run allowed at create; test added");
