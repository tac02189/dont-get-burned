import { readFileSync, writeFileSync } from "node:fs";
const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");

const FIX = [
  // 1. a sed ate the \u escape and left a literal "2014" in the label
  [`label:"Poll 7 2014 standstill"`, `label:"Poll 7 \u2014 standstill"`],

  // 2. British spelling slipped back in, one edit after normalising to US
  [`free fluid in Morison's AND a haemothorax`, `free fluid in Morison's AND a hemothorax`],
  [`credit the haemothorax to`, `credit the hemothorax to`],
  [`clinically significant haemothorax`, `clinically significant hemothorax`],

  // 3. drop the CPR duration from poll 7 - it was anchoring the answer
  [`stem:"58M, witnessed arrest, 22 minutes of CPR, PEA on the monitor. You scan during the rhythm-check pause and see this.",`,
   `stem:"58M, witnessed arrest, PEA on the monitor. You scan during the rhythm-check pause and see this.",`],
  [`stem:"58M, 22 minutes down. Composite case.",`,
   `stem:"58M, witnessed arrest. Composite case.",`]
];

let n = 0;
for (const [a, b] of FIX) {
  if (!s.includes(a)) { console.error("anchor missing: " + a.slice(0, 64)); process.exit(1); }
  s = s.replace(a, b); n++;
}
writeFileSync(sp, s);
console.log("applied " + n + " fix(es)");
