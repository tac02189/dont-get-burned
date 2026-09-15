import { readFileSync, writeFileSync } from "node:fs";

/* ------------------------------------------------------------------
   The spine slide becomes a recurring section marker.

   - First appearance (id "spine"): no highlight at all. Pure overview.
   - Before each of the four sections: the same grid with that
     question's card lit in ember.

   Highlight is now driven by an explicit `highlight` index instead of
   the old `i===0 && s.id==="spine"` special case, so the take-home
   slide (same layout, no highlight field) stays neutral too.
   ------------------------------------------------------------------ */

/* ---- 1. deck.js ---- */
const dp = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(dp, "utf8");
const OLD_D = '<div class="qcard'+String.fromCharCode(36)+'{i===0&&s.id==="spine"?" on":""}">';
const NEW_D = '<div class="qcard'+String.fromCharCode(36)+'{s.highlight===i?" on":""}">';
if (!d.includes(OLD_D)) { console.error("deck.js qcard anchor missing"); process.exit(1); }
d = d.replace(OLD_D, NEW_D);
writeFileSync(dp, d);
console.log("deck.js    : highlight is now explicit, not positional");

/* ---- 2. build-pptx.mjs ---- */
const pp = "C:/Users/tac02/pocus_pitfalls_build/scripts/build-pptx.mjs";
let p = readFileSync(pp, "utf8");
const pBefore = p;
p = p.replaceAll(`(i===0&&sl.id==="spine")`, `(sl.highlight===i)`);
if (p === pBefore) { console.error("pptx spine anchors missing"); process.exit(1); }
writeFileSync(pp, p);
console.log("build-pptx : same change");

/* ---- 3. slides.js ---- */
const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");
if (s.includes('id:"spine1"')) { console.error("already added"); process.exit(1); }

const CARDS = `  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],`;

const marker = (id, n, label, h2, foot, highlight) => `{ id:"${id}", type:"spine", label:"${label}", highlight:${highlight},
  eyebrow:"Question ${n} of 4",
  h2:${h2},
${CARDS}
  foot:${foot},
  notes:[
    "Orientation beat, not a teaching slide. 15 seconds — point at the lit card and move.",
    "If you are running behind, skip straight past this one; nothing downstream depends on it."
  ]
},

`;

const MARKERS = [
  ["spine1", "01", "Question 01 marker",
   `["Did I obtain an ", "adequate examination", "?"]`,
   `{ lab:"Coming up", p:"Three studies that get charted as negative — and the chart entry that turns missing data into reassuring data." }`,
   0, `{ id:"p1", type:"poll",`],

  ["spine2", "02", "Question 02 marker",
   `["What am I ", "actually seeing", "?"]`,
   `{ lab:"Coming up", p:"Normal anatomy wearing the costume of disease — and the cheapest check that separates them." }`,
   1, `{ id:"p2", type:"poll",`],

  ["spine3", "03", "Question 03 marker",
   `["What does this finding ", "establish", "?"]`,
   `{ lab:"Coming up", p:"Findings that raise your suspicion, and what it costs to treat them as confirmation." }`,
   2, `{ id:"p4", type:"poll",`],

  ["spine4", "04", "Question 04 marker",
   `["What remains ", "unanswered", "?"]`,
   `{ lab:"Coming up", p:"The scan that reassures you — and the question you never got round to asking." }`,
   3, `{ id:"p5", type:"poll",`]
];

for (const [id, n, label, h2, foot, hl, anchor] of MARKERS) {
  if (!s.includes(anchor)) { console.error("anchor missing: " + anchor); process.exit(1); }
  s = s.replace(anchor, marker(id, n, label, h2, foot, hl) + anchor);
}

writeFileSync(sp, s);
console.log("slides.js  : 4 section markers inserted");
