import { readFileSync, writeFileSync } from "node:fs";

/* ============================================================
   FIX 1 - the poll slide was leaking the answer.
   `withResults` gated the percentages and the tick/cross glyph, but the
   correct/trapped CSS CLASSES were applied unconditionally, and those set
   the option's border colour. Cyan on the right answer, ember on the traps,
   visible before a single vote. Exactly the failure Codex predicted
   ("a familiar cyan mark can identify the preferred option before the
   audience reasons") - and it made it into the build anyway.

   The flag now has to say explicitly whether this is a reveal.

   FIX 2 - rings and calipers were positioned by eye against clips I could
   not measure, and they land in the wrong place. Removing the data. The
   rendering machinery stays so correctly-placed annotations can be added
   later, but nothing references it now.
   ============================================================ */

/* ---------- deck.js ---------- */
const dp = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(dp, "utf8");

const OLD_SIG = `function optionRows(s, withResults){`;
const NEW_SIG = `function optionRows(s, opts){
  // reveal:false means NOTHING may hint at the answer - no colour, no glyph.
  const reveal      = !!(opts && opts.reveal);
  const withResults = !!(opts && opts.withResults);`;
if (!d.includes(OLD_SIG)) { console.error("optionRows signature not found"); process.exit(1); }
d = d.replace(OLD_SIG, NEW_SIG);

const OLD_CLS = `    const cls = i === s.correct ? "correct" : (traps.includes(i) ? "trapped" : "");
    const mk  = i === s.correct ? "\u2713" : (traps.includes(i) ? "\u2715" : "");`;
const NEW_CLS = `    const cls = reveal ? (i === s.correct ? "correct" : (traps.includes(i) ? "trapped" : "")) : "";
    const mk  = reveal ? (i === s.correct ? "\u2713" : (traps.includes(i) ? "\u2715" : "")) : "";`;
if (!d.includes(OLD_CLS)) { console.error("class assignment not found"); process.exit(1); }
d = d.replace(OLD_CLS, NEW_CLS);

if (!d.includes("${optionRows(s,false)}")) { console.error("poll call not found"); process.exit(1); }
d = d.replace("${optionRows(s,false)}", "${optionRows(s, { reveal:false })}");
if (!d.includes("${optionRows(s, show)}")) { console.error("reveal call not found"); process.exit(1); }
d = d.replace("${optionRows(s, show)}", "${optionRows(s, { reveal:true, withResults: show })}");

writeFileSync(dp, d);
console.log("deck.js    : poll options are now neutral until the reveal");

/* ---------- build-pptx.mjs ---------- */
const pp = "C:/Users/tac02/pocus_pitfalls_build/scripts/build-pptx.mjs";
let p = readFileSync(pp, "utf8");

const OLD_P = `function optionRows(s, sl, x, y, w){`;
const NEW_P = `function optionRows(s, sl, x, y, w, reveal){`;
if (!p.includes(OLD_P)) { console.error("pptx optionRows not found"); process.exit(1); }
p = p.replace(OLD_P, NEW_P);

const OLD_PC = `    const isC = i===sl.correct, isT = traps.includes(i);`;
const NEW_PC = `    const isC = reveal && i===sl.correct, isT = reveal && traps.includes(i);`;
if (!p.includes(OLD_PC)) { console.error("pptx flags not found"); process.exit(1); }
p = p.replace(OLD_PC, NEW_PC);

p = p.replace("optionRows(s, sl, rx, 2.75, rw);", "optionRows(s, sl, rx, 2.75, rw, false);");
p = p.replace("optionRows(s, sl, rx, 1.28, rw);", "optionRows(s, sl, rx, 1.28, rw, true);");
writeFileSync(pp, p);
console.log("build-pptx : same fix applied");

/* ---------- slides.js : strip rings + calipers ---------- */
const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let lines = readFileSync(sp, "utf8").split("\n");
const out = [];
let removed = 0, skipping = false;
for (const line of lines) {
  if (skipping) {
    removed++;
    if (/^\s*\],?\s*$/.test(line)) skipping = false;
    continue;
  }
  if (/^\s*(rings|calipers):\s*\[/.test(line)) {
    removed++;
    // single-line form ends with "],"; multi-line keeps swallowing
    if (!/\],\s*$/.test(line)) skipping = true;
    continue;
  }
  out.push(line);
}
writeFileSync(sp, out.join("\n"));
console.log(`slides.js  : removed ${removed} line(s) of ring/caliper data`);
