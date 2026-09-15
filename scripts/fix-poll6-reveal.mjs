import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

/* Poll 6's reveal showed efast_anterior_lung_sliding_normal.mp4 - a NORMAL
   lung with intact sliding - captioned "the window nobody got to". The whole
   lesson is that stopping early cost you something, and the image said
   nothing was there. Replaced with a hemothorax: a positive finding, in a
   different window, and different pathology from the pneumothorax teaching
   in section 3 so there is no redundancy. */

const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");

const OLD = `  orient:["FAST","Anterior chest","Same patient"],
  media:{ src:M+"efast_anterior_lung_sliding_normal.mp4", kind:"video", tag:"Same patient \u00b7 the window nobody got to" },`;
const NEW = `  orient:["FAST","Thoracic window","Same patient"],
  media:{ src:M+"efast_hemothorax.mp4", kind:"video", tag:"Same patient \u00b7 the window nobody got to" },`;
if (!s.includes(OLD)) { console.error("r5 media anchor missing"); process.exit(1); }
s = s.replace(OLD, NEW);

const OLD_T = `    p:"A positive finding is the most reliable way to end a search early. <b>Satisfaction of search</b> is not a knowledge failure \u2014 it is what finding something does to attention.",`;
const NEW_T = `    p:"There was blood in the chest as well. A positive finding is the most reliable way to end a search early \u2014 <b>satisfaction of search</b> is not a knowledge failure, it is what finding something does to attention.",`;
if (!s.includes(OLD_T)) { console.error("r5 takeaway anchor missing"); process.exit(1); }
s = s.replace(OLD_T, NEW_T);

const OLD_N = `    "Say plainly: this is not about knowing less. The people who stop early are the ones who found something, which is to say the ones doing it right.",`;
const NEW_N = `    "Name it out loud: free fluid in Morison's AND a haemothorax. One was found, one was never looked for.",
    "Say plainly: this is not about knowing less. The people who stop early are the ones who found something, which is to say the ones doing it right.",`;
if (!s.includes(OLD_N)) { console.error("r5 notes anchor missing"); process.exit(1); }
s = s.replace(OLD_N, NEW_N);

/* this slide had no verify list; give it one */
const OLD_END = `    "COMPOSITE \u2014 say so."
  ]
},

{ id:"p5b", type:"poll", label:"Poll 7 \u2014 standstill",`;
const NEW_END = `    "COMPOSITE \u2014 say so."
  ],
  verify:[
    "Which eFAST window you want to credit the haemothorax to, and how you describe finding it (cephalad off the RUQ vs a dedicated thoracic view).",
    "Whether you want to name a volume threshold for a clinically significant haemothorax - if so, source it."
  ]
},

{ id:"p5b", type:"poll", label:"Poll 7 2014 standstill",`;
if (!s.includes(OLD_END)) { console.error("r5 tail anchor missing"); process.exit(1); }
s = s.replace(OLD_END, NEW_END);

writeFileSync(sp, s);
console.log("slides.js  : poll 6 reveal now shows a haemothorax, not a normal lung");

/* tidy: drop the scratch inspect page and the clip we did not choose */
for (const f of [
  "C:/Users/tac02/pocus_pitfalls_build/deck/inspect.html",
  "C:/Users/tac02/pocus_pitfalls_build/deck/media/efast_pleural_and_peritoneal_fluid.mp4"
]) { try { unlinkSync(f); console.log("removed     : " + f.split("/").pop()); } catch {} }
