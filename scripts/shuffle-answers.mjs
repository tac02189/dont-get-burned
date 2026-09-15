import { readFileSync, writeFileSync } from "node:fs";

const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let src = readFileSync(sp, "utf8");

/* ------------------------------------------------------------------
   STEP 1 - make every reference to an option content-based.
   Ten places named options by letter. Those go wrong the instant the
   order changes, which is why the deck could not be reshuffled safely
   before. Anchors below deliberately avoid dashes: the file contains a
   mix of real em-dashes and literal \u2014 escape text.
   ------------------------------------------------------------------ */
const TEXT = [
  [`The trap is A, and in most rooms A wins.`,
   `The trap is the "negative study" answer, and in most rooms it wins.`],

  [`Do not shame A. Say: 'A is what the chart template invites you to write.'`,
   `Do not shame it. Say: 'that is what the chart template invites you to write.'`],

  [`Note option C is also a trap but a quieter one`,
   `The "7 mm is normal" answer is a quieter trap`],

  [`A is the over-read, C is the nihilist under-read.`,
   `One answer over-reads the finding, the other dismisses it entirely.`],

  [`a different problem from the one A assumed.`,
   `a different problem from the one the treat-it-as-oedema answer assumed.`],

  [`A lets one loop carry a decision it cannot carry. C is the opposite refusal to use information you already have.`,
   `One answer lets a single loop carry a decision it cannot carry. The other refuses to use information you already have.`],

  [`the people who reach for A are not careless`,
   `the people who reach for "call it" are not careless`],

  [`In most rooms A and C both draw votes`,
   `In most rooms both confident answers draw votes`],

  [`<b>A and C are both wrong, in opposite directions.</b>`,
   `<b>Both confident answers are wrong, in opposite directions.</b>`],

  [`A is the eager error, C is the complacent one`,
   `one error is eager, the other complacent`]
];
let textFixed = 0;
for (const [a, b] of TEXT) {
  if (!src.includes(a)) { console.error("TEXT anchor missing: " + a.slice(0, 70)); process.exit(1); }
  src = src.replace(a, b); textFixed++;
}
console.log("rewrote " + textFixed + " letter-dependent reference(s) to be content-based");

/* ------------------------------------------------------------------
   STEP 2 - poll 5 stem + orientation, per Thiago's zone identification
   ------------------------------------------------------------------ */
const STEM = [
  [`You find this pattern on both sides.`,
   `You find this pattern on the right anterior apical lung.`],

  [`orient:["Lung","Anterior zone",""],`,
   `orient:["Lung","Right anterior apical",""],`],

  [`The poll clip carries no machine zone label, so I labelled it 'anterior zone' conservatively. The reveal clip IS machine-annotated RIGHT MIDDLE. Correct the poll label if you recognise the window.`,
   `Zone on the poll clip is per your own identification (right anterior apical); the reveal clip is machine-annotated RIGHT MIDDLE. Both are now stated on the slides.`]
];
for (const [a, b] of STEM) {
  if (!src.includes(a)) { console.error("STEM anchor missing: " + a.slice(0, 70)); process.exit(1); }
  src = src.replace(a, b);
}
console.log("poll 5 stem + orientation updated to right anterior apical");

/* ------------------------------------------------------------------
   STEP 3 - the shuffle.
   perm[newIndex] = oldIndex. Applied to options, correct, trapped and
   results together so they cannot drift apart.
   Target spread A C B C A B C A  ->  A:3 B:2 C:3, no adjacent repeats
   and no simple repeating cycle for the room to spot.
   ------------------------------------------------------------------ */
const PERM = {
  p1:[1,0,2],  r1:[1,0,2],     // poll 1 -> A
  p2:[0,2,1],  r2:[0,2,1],     // poll 2 -> C
                               // poll 3 stays B, poll 4 stays C
  p4b:[1,0,2], r4b:[1,0,2],    // poll 5 -> A
                               // poll 6 stays B
  p5b:[0,2,1], r5b:[0,2,1],    // poll 7 -> C
  p6:[1,0,2],  r6:[1,0,2]      // poll 8 -> A
};

/* extract a bracketed literal, respecting strings */
function readArray(text, from) {
  const start = text.indexOf("[", from);
  let d = 0, i = start, inStr = false, q = "";
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") { i++; continue; }
      if (c === q) inStr = false;
    } else if (c === '"' || c === "'") { inStr = true; q = c; }
    else if (c === "[") d++;
    else if (c === "]") { d--; if (d === 0) { i++; break; } }
  }
  return { start, end: i, literal: text.slice(start, i) };
}

const blocks = src.split(/\n(?=\{ id:")/);
let shuffled = 0;
const summary = [];

for (let b = 0; b < blocks.length; b++) {
  const m = blocks[b].match(/^\{ id:"([^"]+)"/);
  if (!m || !PERM[m[1]]) continue;
  const id = m[1], perm = PERM[id];
  let blk = blocks[b];

  const oPos = blk.indexOf("options:");
  if (oPos < 0) { console.error(id + ": no options array"); process.exit(1); }
  const oArr = readArray(blk, oPos);
  const opts = new Function("return " + oArr.literal)();
  if (opts.length !== perm.length) { console.error(id + ": option count mismatch"); process.exit(1); }
  const newOpts = perm.map(i => opts[i]);
  const rendered = "[\n    " + newOpts.map(o => JSON.stringify(o)).join(",\n    ") + "\n  ]";
  blk = blk.slice(0, oArr.start) + rendered + blk.slice(oArr.end);

  const oldCorrect = +blk.match(/correct:(\d+)/)[1];
  const newCorrect = perm.indexOf(oldCorrect);
  blk = blk.replace(/correct:\d+/, "correct:" + newCorrect);

  const tm = blk.match(/trapped:(\[[^\]]*\]|\d+)/);
  if (tm) {
    const oldT = new Function("return " + tm[1])();
    const arr = Array.isArray(oldT) ? oldT : [oldT];
    const newT = arr.map(i => perm.indexOf(i)).sort((x, y) => x - y);
    blk = blk.replace(/trapped:(\[[^\]]*\]|\d+)/,
      "trapped:" + (Array.isArray(oldT) ? "[" + newT.join(",") + "]" : String(newT[0])));
  }

  const rm = blk.match(/results:\[([^\]]*)\]/);
  if (rm) {
    const old = rm[1].split(",").map(x => +x.trim());
    blk = blk.replace(/results:\[[^\]]*\]/, "results:[" + perm.map(i => old[i]).join(",") + "]");
  }

  blocks[b] = blk;
  shuffled++;
  if (!id.startsWith("r")) summary.push({ id, correct: "ABC"[newCorrect], opts: newOpts });
}

if (shuffled !== Object.keys(PERM).length) {
  console.error("expected " + Object.keys(PERM).length + " blocks, transformed " + shuffled);
  process.exit(1);
}
writeFileSync(sp, blocks.join("\n"));
console.log("shuffled " + shuffled + " slide block(s)\n");
for (const s of summary) {
  console.log("  " + s.id.padEnd(4) + " correct is now " + s.correct);
  s.opts.forEach((o, i) => console.log("       " + "ABC"[i] + "  " + o));
  console.log("");
}
