import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

/* Q4's second cell was a flat IVC. That is really a Question 3 argument
   (a positive finding being non-specific) sitting in a Question 4 slide,
   whose subject is scans that close an inquiry prematurely. Replaced with
   a normal aorta, which is a true reassuring negative: it answers "is
   there an aneurysm", not "is this a dissection".

   Clip is the PROXIMAL long axis with celiac/SMA, chosen over the
   "long axis with IVC" version - the branch anatomy makes it unmistakably
   aorta, where the IVC version leaves the viewer unsure which vessel is
   the subject. It is also about as high as the abdominal window reaches,
   which is the point. */

const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");

const OLD_CELL = `src:M+"heart_ivc_flat.mp4", tone:"trap", mk:"\u2715",
      t:"A flat IVC", d:"Fits hypovolaemia. Also fits a patient straining, on positive pressure, or simply thin. A single number from a single view is a data point, not a volume status." }`;
const NEW_CELL = `src:M+"aorta_proximal_long_axis_celiac_sma_normal.mp4", tone:"trap", mk:"\u2715",
      t:"A normal aorta", d:"Answers one question: is there an aneurysm at this level. A dissection can sit entirely above the diaphragm, where this window never reaches. You screened for the wrong thing and got a reassuring answer to it." }`;
if (!s.includes(OLD_CELL)) { console.error("t4 IVC cell anchor missing"); process.exit(1); }
s = s.replace(OLD_CELL, NEW_CELL);

const OLD_NOTES = `    "Bring it back to Q4: before you put the probe down, say out loud what you still do not know."`;
const NEW_NOTES = `    "On the aorta: point out that the proximal view is about as high as this window reaches. Everything above it was never examined, and the chart rarely says so.",
    "Bring it back to Q4: before you put the probe down, say out loud what you still do not know."`;
if (!s.includes(OLD_NOTES)) { console.error("t4 notes anchor missing"); process.exit(1); }
s = s.replace(OLD_NOTES, NEW_NOTES);

const OLD_V = `  verify:["Negative FAST test characteristics if you quote them; the IVC/volume-status literature is contested \u2014 keep the claim qualitative."]`;
const NEW_V = `  verify:[
    "Negative FAST test characteristics, if you quote them.",
    "How you want to state the limits of abdominal aortic POCUS for dissection \u2014 the sensitivity of a bedside abdominal view for a dissection flap is low and worth wording carefully rather than quoting a figure.",
    "Whether to mention the suprasternal or parasternal views as partial answers to the thoracic question, or leave that out to save time."
  ]`;
if (!s.includes(OLD_V)) { console.error("t4 verify anchor missing"); process.exit(1); }
s = s.replace(OLD_V, NEW_V);

writeFileSync(sp, s);
console.log('slides.js  : Q4 cell 2 is now "A normal aorta"');

for (const f of [
  "C:/Users/tac02/pocus_pitfalls_build/deck/inspect.html",
  "C:/Users/tac02/pocus_pitfalls_build/deck/media/aorta_long_axis_with_ivc_normal.mp4"
]) { try { unlinkSync(f); console.log("removed     : " + f.split("/").pop()); } catch {} }
