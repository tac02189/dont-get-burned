import { readFileSync, writeFileSync } from "node:fs";

/* Card description text now appears only on the highlighted card.
   - opener  (no highlight)  -> four bare questions, clean overview
   - markers (one highlight) -> that card's description only
   - take-home              -> exempt via cardText:"all", because there the
                                descriptions ARE the content, not commentary
   $ is built by concatenation so the search strings are not interpolated. */
const D = String.fromCharCode(36);

/* ---- deck.js ---- */
const dp = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(dp, "utf8");
const OLD = '<div class="qd">' + D + '{c.d}</div>';
const NEW = D + '{(s.highlight===i || s.cardText==="all") ? `<div class="qd">' + D + '{c.d}</div>` : ""}';
if (!d.includes(OLD)) { console.error("deck.js .qd anchor missing"); process.exit(1); }
d = d.replace(OLD, NEW);
writeFileSync(dp, d);
console.log("deck.js    : card text gated on highlight");

/* ---- build-pptx.mjs ---- */
const pp = "C:/Users/tac02/pocus_pitfalls_build/scripts/build-pptx.mjs";
let p = readFileSync(pp, "utf8");
const OLD_P = `      s.addText(c.d, { x:x+0.2, y:3.42, w:cw-0.4, h:0.9, fontFace:BODY, fontSize:9.5, color:C.dim });`;
const NEW_P = `      if (sl.highlight === i || sl.cardText === "all")
        s.addText(c.d, { x:x+0.2, y:3.42, w:cw-0.4, h:0.9, fontFace:BODY, fontSize:9.5, color:C.dim });`;
if (!p.includes(OLD_P)) { console.error("pptx card-text anchor missing"); process.exit(1); }
p = p.replace(OLD_P, NEW_P);
writeFileSync(pp, p);
console.log("build-pptx : same gate");

/* ---- slides.js: exempt the take-home ---- */
const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");
const OLD_H = `{ id:"home", type:"spine", label:"Take-home",`;
const NEW_H = `{ id:"home", type:"spine", label:"Take-home", cardText:"all",`;
if (!s.includes(OLD_H)) { console.error("take-home anchor missing"); process.exit(1); }
s = s.replace(OLD_H, NEW_H);
writeFileSync(sp, s);
console.log('slides.js  : take-home exempted with cardText:"all"');
