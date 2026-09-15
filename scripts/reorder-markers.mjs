import { readFileSync, writeFileSync } from "node:fs";

/* Move each question marker to sit immediately before its examples slide,
   with no poll between them. The markers' "Coming up" text already
   described the examples rather than the polls, so this placement is the
   one the copy was written for.

   Rebuilt by emitting blocks in an explicit order rather than splicing,
   so the section comments end up in the right places instead of
   travelling with whichever block they happened to precede. */

const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
const src = readFileSync(sp, "utf8");

const OPEN = "export const SLIDES = [";
const iOpen = src.indexOf(OPEN);
if (iOpen < 0) { console.error("SLIDES open not found"); process.exit(1); }
const header = src.slice(0, iOpen + OPEN.length);

/* blocks are top-level objects that start at column 0 with { id:" and end at \n}, */
const blocks = {};
/* trailing comma is optional: the final block has none */
const re = /^\{ id:"([^"]+)"[\s\S]*?\n\},?$/gm;
let m, count = 0;
while ((m = re.exec(src)) !== null) {
  blocks[m[1]] = m[0].replace(/,$/, "");   // normalise; commas re-added on emit
  count++;
}
console.log("parsed " + count + " slide block(s)");

const ORDER = [
  ["/* ---------- TITLE ---------- */", ["title"]],
  ["/* ---------- JOIN ---------- */", ["join"]],
  ["/* ---------- THE SPINE ---------- */", ["spine"]],
  ["/* ========== \u00a71 \u00b7 ADEQUATE EXAMINATION ========== */", ["p1", "r1", "spine1", "t1"]],
  ["/* ========== \u00a72 \u00b7 WHAT AM I SEEING ========== */", ["p2", "r2", "p3", "r3", "spine2", "t2"]],
  ["/* ========== \u00a73 \u00b7 WHAT DOES IT ESTABLISH ========== */", ["p4", "r4", "p4b", "r4b", "spine3", "t3"]],
  ["/* ========== \u00a74 \u00b7 WHAT REMAINS UNANSWERED ========== */", ["p5", "r5", "p5b", "r5b", "spine4", "t4"]],
  ["/* ---------- CLOSING POLL ---------- */", ["p6", "r6"]],
  ["/* ---------- TAKE-HOME ---------- */", ["home"]],
  ["/* ---------- REFERENCES ---------- */", ["refs"]]
];

const wanted = ORDER.flatMap(([, ids]) => ids);
const missing = wanted.filter(id => !blocks[id]);
const extra = Object.keys(blocks).filter(id => !wanted.includes(id));
if (missing.length) { console.error("missing block(s): " + missing.join(", ")); process.exit(1); }
if (extra.length) { console.error("unlisted block(s): " + extra.join(", ")); process.exit(1); }

let body = "\n";
for (const [comment, ids] of ORDER) {
  body += "\n" + comment + "\n\n";
  for (const id of ids) body += blocks[id] + ",\n\n";
}
let out = header + body.replace(/\n+$/, "\n") + "\n];\n";

/* the marker notes described a preview beat; they now follow the polls */
out = out.replace(
  /"Orientation beat, not a teaching slide\. 15 seconds — point at the lit card and move\.",/g,
  '"A beat to place what just happened on the map. 15 seconds — point at the lit card and move.",');

writeFileSync(sp, out);
console.log("reordered: markers now sit immediately before their examples slide");
