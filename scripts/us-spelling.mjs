import { readFileSync, writeFileSync } from "node:fs";

/* Normalise to US spelling. Thiago asked for "edema"; the same file also
   carried colour / behaviour / calibre / haematuria / visualised /
   labelled / recognise, and a deck that mixes them reads worse than one
   that picks a side. Case of the first letter is preserved. */

const MAP = [
  ["oedema",        "edema"],
  ["colour",        "color"],
  ["behaviour",     "behavior"],
  ["calibre",       "caliber"],
  ["haematuria",    "hematuria"],
  ["visualisation", "visualization"],
  ["visualised",    "visualized"],
  ["labelled",      "labeled"],
  ["recognise",     "recognize"],
  ["generalising",  "generalizing"],
  ["generalise",    "generalize"],
  ["haemorrhage",   "hemorrhage"],
  ["haemodynamic",  "hemodynamic"],
  ["anaemia",       "anemia"],
  ["oesophag",      "esophag"],
  ["paediatric",    "pediatric"]
];

const FILES = [
  "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js",
  "C:/Users/tac02/pocus_pitfalls_build/README.md"
];

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

for (const f of FILES) {
  let s;
  try { s = readFileSync(f, "utf8"); } catch { console.log("skip (missing): " + f); continue; }
  const before = s;
  const hits = [];
  for (const [uk, us] of MAP) {
    const lower = new RegExp(uk, "g");
    const upper = new RegExp(cap(uk), "g");
    const nL = (s.match(lower) || []).length;
    const nU = (s.match(upper) || []).length;
    if (nL) s = s.replace(lower, us);
    if (nU) s = s.replace(upper, cap(us));
    if (nL + nU) hits.push(`${uk}->${us} (${nL + nU})`);
  }
  if (s !== before) {
    writeFileSync(f, s);
    console.log(f.split("/").pop() + ": " + hits.join(", "));
  } else {
    console.log(f.split("/").pop() + ": nothing to change");
  }
}
