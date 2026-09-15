import { readFileSync, writeFileSync } from "node:fs";

/* Anchor on slide IDs, never on label text: the file contains a mix of real
   em-dashes and literal \u2014 escape sequences (an artifact of an earlier
   generator), so text matching is fragile. IDs are stable. */

const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");
if (s.includes('id:"p4b"')) { console.error("already added"); process.exit(1); }

/* ---- 1. renumber the tail by id ---- */
const RENUM = { p5: 6, r5: 6, p6: 8, r6: 8 };
let renumbered = 0;
s = s.split("\n").map(line => {
  const m = line.match(/^\{ id:"(p\d+|r\d+)",/);
  if (!m || !(m[1] in RENUM)) return line;
  const n = RENUM[m[1]];
  const out = line
    .replace(/poll:\d+,/, `poll:${n},`)
    .replace(/label:"(Poll|Reveal) \d+/, (x, w) => `label:"${w} ${n}`);
  if (out !== line) renumbered++;
  return out;
}).join("\n");
if (renumbered !== 4) { console.error(`expected 4 renumbers, got ${renumbered}`); process.exit(1); }

/* ---- 2. new pairs. Real em-dashes, to stop the mixed-encoding drift. ---- */
const P4B = `{ id:"p4b", type:"poll", label:"Poll 5 — B-lines", poll:5,
  orient:["Lung","Anterior zone",""],
  media:{ src:M+"thoracic_blines_diffuse.mp4", kind:"video", tag:"Live clip · anterior lung" },
  stem:"71F, breathless since midnight, crackles to the mid-zones, BP 152/94. You find this pattern on both sides.",
  ask:"Give furosemide?",
  options:[
    "Yes — that is pulmonary oedema, treat it",
    "Look at the pleural line and the distribution first",
    "No — B-lines are too non-specific to act on"
  ],
  correct:1, trapped:[0,2],
  results:[46,33,21],
  notes:[
    "Everyone here has seen B-lines, and most have treated them as a synonym for failure.",
    "A is the over-read, C is the nihilist under-read. Both skip the same step.",
    "Do not let this turn into a discussion about diuretic dosing — the point is what the finding does and does not tell you."
  ]
},

{ id:"r4b", type:"reveal", label:"Reveal 5 — a pattern, not a diagnosis", poll:5,
  orient:["Lung","Right middle zone","Different patient"],
  media:{ src:M+"thoracic_blines_focal.mp4", kind:"video",
          tag:"Different patient · focal, right middle zone" },
  stem:"71F, breathless, crackles to mid-zones. Composite case.",
  options:[
    "Pulmonary oedema — treat it",
    "Check the pleural line and distribution",
    "Too non-specific to act on"
  ],
  correct:1, trapped:[0,2], results:[46,33,21],
  takeaway:{
    lab:"Bounded takeaway",
    p:"B-lines tell you there is <b>interstitial fluid</b>. They do not tell you why it is there. This clip is focal and confined to one zone — a different problem from the one A assumed.",
    scope:"Scope: distribution and pleural-line appearance help separate cardiogenic from pneumonic or inflammatory causes. They are a discriminator, not a treatment rule — and a patient can have both at once."
  },
  notes:[
    "The discriminator worth naming: diffuse, bilateral and gravity-dependent leans cardiogenic; focal or patchy with an irregular, thickened pleural line leans pneumonia or ARDS.",
    "Say the uncomfortable part out loud — a breathless elderly patient can be in failure AND have a pneumonia, and the scan will not adjudicate that for you.",
    "COMPOSITE — say so."
  ],
  verify:[
    "The distribution / pleural-line discriminator between cardiogenic and non-cardiogenic B-lines — confirm the wording against a current lung-ultrasound source.",
    "Lung zone nomenclature, if you name zones out loud.",
    "The poll clip carries no machine zone label, so I labelled it 'anterior zone' conservatively. The reveal clip IS machine-annotated RIGHT MIDDLE. Correct the poll label if you recognise the window."
  ]
},

`;

const P5B = `{ id:"p5b", type:"poll", label:"Poll 7 — standstill", poll:7,
  orient:["Cardiac","Rhythm-check pause",""],
  media:{ src:M+"heart_cardiac_standstill.mp4", kind:"video", tag:"Live clip · during the pause" },
  stem:"58M, witnessed arrest, 22 minutes of CPR, PEA on the monitor. You scan during the rhythm-check pause and see this.",
  ask:"Does this end the resuscitation?",
  options:[
    "Yes — standstill. Call it",
    "It informs the decision. It does not make it",
    "No — imaging should not influence this at all"
  ],
  correct:1, trapped:[0,2],
  results:[39,44,17],
  notes:[
    "The heaviest slide in the deck. Slow down and let the room sit with it.",
    "A lets one loop carry a decision it cannot carry. C is the opposite refusal to use information you already have.",
    "Worth saying plainly: the people who reach for A are not careless — they are looking for permission, and an image feels like permission."
  ]
},

{ id:"r5b", type:"reveal", label:"Reveal 7 — prognostic, not dispositive", poll:7,
  orient:["Cardiac","Parasternal long axis","Different patient"],
  media:{ src:M+"heart_reduced_lv_function.mp4", kind:"video",
          tag:"Different patient · severely reduced, but not standstill" },
  stem:"58M, 22 minutes down. Composite case.",
  options:[
    "Standstill — call it",
    "It informs the decision, it does not make it",
    "Imaging should not influence this"
  ],
  correct:1, trapped:[0,2], results:[39,44,17],
  takeaway:{
    lab:"All four questions, under pressure",
    p:"Sonographic standstill is strongly associated with non-survival — but it is <b>prognostic, not dispositive</b>. Severely reduced function, like this clip, can read as standstill on a brief, off-axis or low-frame-rate look.",
    scope:"Scope: this is about how much weight one clip carries inside a resuscitation decision. It is not a termination-of-efforts rule, and scanning lengthens the pause — which carries its own cost."
  },
  notes:[
    "Q1 adequate? A few seconds, one window, during a pause, on a moving patient. The least adequate scan in the whole talk.",
    "Q2 what am I seeing? Absent motion — or motion too subtle for this frame rate and this window.",
    "Q3 what does it establish? A poor prognosis. Not a decision.",
    "Q4 what remains unanswered? Every reversible cause not yet excluded, and what the pause itself cost.",
    "Close cleanly and move on — do not let this become a debate about termination policy.",
    "COMPOSITE — say so."
  ],
  verify:[
    "The association between sonographic standstill and survival — decide whether to cite a figure or keep it qualitative, and source it either way.",
    "The claim that ultrasound during arrest lengthens pause duration — well described, but confirm your phrasing.",
    "Whether your institution has a termination-of-resuscitation protocol you should reference rather than leaving this open."
  ]
},

`;

for (const [anchor, block] of [
  [`{ id:"t3", type:"cmp3", label:"Non-specific findings",`, P4B],
  [`{ id:"t4", type:"cmp2", label:"The scan that reassures",`, P5B]
]) {
  if (!s.includes(anchor)) { console.error("insert anchor missing: " + anchor); process.exit(1); }
  s = s.replace(anchor, block + anchor);
}

s = s.replace("Six polls today.", "Eight polls today.");
s = s.replace(/35 min . EM Conference . 6 live polls/, "35 min \u00b7 EM Conference \u00b7 8 live polls");
writeFileSync(sp, s);
console.log("slides.js  : +2 poll/reveal pairs; p5/r5 -> 6, p6/r6 -> 8");

/* ---- 3. deck.js: drop Duration, derive the poll counter ---- */
const dp = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(dp, "utf8");
const durLine = d.split("\n").find(l => l.includes("<b>Duration</b>"));
if (!durLine) { console.error("duration line not found"); process.exit(1); }
d = d.replace(durLine + "\n", "");
console.log("deck.js    : duration removed from title slide");

if (!d.includes("Poll ${pollNum} of 6")) { console.error("poll counter not found"); process.exit(1); }
d = d.replace("Poll ${pollNum} of 6", "Poll ${pollNum} of ${TOTAL_POLLS}");
d = d.replace(`const esc = s => String(s == null ? "" : s);`,
  `const esc = s => String(s == null ? "" : s);\n` +
  `// derived, never hardcoded - adding a poll must not leave "of 6" behind\n` +
  `const TOTAL_POLLS = new Set(SLIDES.filter(x => x.poll).map(x => x.poll)).size;`);
writeFileSync(dp, d);
console.log("deck.js    : poll counter derived from SLIDES");

/* ---- 4. pptx: same counter ---- */
const pp = "C:/Users/tac02/pocus_pitfalls_build/scripts/build-pptx.mjs";
let p = readFileSync(pp, "utf8");
if (!p.includes("OF 6`")) { console.error("pptx counter not found"); process.exit(1); }
p = p.replace("`POLL ${sl.poll} OF 6`", "`POLL ${sl.poll} OF ${TOTAL_POLLS}`");
p = p.replace(`const pptx = new PptxGenJS();`,
  `const TOTAL_POLLS = new Set(SLIDES.filter(x => x.poll).map(x => x.poll)).size;\n\nconst pptx = new PptxGenJS();`);
writeFileSync(pp, p);
console.log("build-pptx : poll counter derived from SLIDES");

/* ---- 5. clear-session: sweep enough polls ---- */
const cp = "C:/Users/tac02/pocus_pitfalls_build/scripts/clear-session.mjs";
let c = readFileSync(cp, "utf8");
c = c.replace("poll <= 6", "poll <= 12");
writeFileSync(cp, c);
console.log("clear-sess : sweeps polls 1-12");
