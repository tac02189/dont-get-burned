import { readFileSync, writeFileSync } from "node:fs";

/* 1. MEETING block ------------------------------------------------------ */
const sp = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(sp, "utf8");

const OLD_MEETING = `export const MEETING = {
  org:      "Mizzou Emergency Medicine",
  event:    "EM/PA Conference",          // TODO: real conference name
  date:     "",                           // TODO
  presenter:"",                           // TODO: credit line
  joinCode: "BURN-7K4Q",
  joinUrl:  "pocus-live.web.app"
};`;

const NEW_MEETING = `export const MEETING = {
  org:      "Mizzou Emergency Medicine",
  event:    "EM Conference",
  date:     "",                                  // intentionally blank - not shown
  presenter:"Thiago DeSouza, M.D.",
  joinCode: "BURN-7K4Q",
  joinUrl:  "mizzou-pocus-live.web.app"          // must match the real host, see note below
};`;

if (!s.includes(OLD_MEETING)) { console.error("MEETING block not found"); process.exit(1); }
s = s.replace(OLD_MEETING, NEW_MEETING);
writeFileSync(sp, s);
console.log("slides.js  : MEETING updated");

/* 2. title slide must actually render the presenter --------------------- */
const dp = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(dp, "utf8");

const OLD_META = `    <div><b>Duration</b>35 minutes \u00b7 6 live polls</div>
    <div><b>Audience</b>Students \u2192 attendings</div>
    <div><b>Join</b>\${MEETING.joinUrl} \u00b7 <span style="color:var(--bone)">\${MEETING.joinCode}</span></div>`;

const NEW_META = `    <div><b>Presented by</b>\${MEETING.presenter}</div>
    <div><b>Duration</b>35 minutes \u00b7 6 live polls</div>
    <div><b>Join</b>\${MEETING.joinUrl} \u00b7 <span style="color:var(--bone)">\${MEETING.joinCode}</span></div>`;

if (!d.includes(OLD_META)) { console.error("title-meta block not found"); process.exit(1); }
d = d.replace(OLD_META, NEW_META);
writeFileSync(dp, d);
console.log("deck.js    : title slide now renders the presenter");

/* 3. same for the pptx companion ---------------------------------------- */
const pp = "C:/Users/tac02/pocus_pitfalls_build/scripts/build-pptx.mjs";
let p = readFileSync(pp, "utf8");

const OLD_PPT = `    s.addText(\`Join: \${MEETING.joinUrl}  \\u00b7  \${MEETING.joinCode}\`,
      { x:MX, y:6.7, w:7, h:0.3, fontFace:BODY, fontSize:10, color:C.faint });`;

const NEW_PPT = `    s.addText(MEETING.presenter,
      { x:MX, y:6.35, w:7, h:0.3, fontFace:BODY, fontSize:12, color:C.dim });
    s.addText(\`Join: \${MEETING.joinUrl}  \\u00b7  \${MEETING.joinCode}\`,
      { x:MX, y:6.72, w:7, h:0.3, fontFace:BODY, fontSize:10, color:C.faint });`;

if (!p.includes(OLD_PPT)) { console.error("pptx title join line not found"); process.exit(1); }
p = p.replace(OLD_PPT, NEW_PPT);
writeFileSync(pp, p);
console.log("build-pptx : title slide now renders the presenter");
