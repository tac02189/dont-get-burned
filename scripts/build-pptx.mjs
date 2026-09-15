/* ============================================================
   .pptx companion for "Don't Get Burned: When Ultrasound Lies"

   This is the BACKUP artifact — the HTML deck is what gets presented.
   Two consequences for the design:

   1. Fonts are Georgia + Calibri, not Fraunces + Archivo. A backup that
      renders wrong on a stranger's conference laptop is not a backup.
      Georgia/Calibri are present on every Windows machine and are the
      house-style faces anyway, so it degrades to something familiar.

   2. Clips are embedded as native MP4 via addMedia({type:'video'}).
      PowerPoint plays H.264 directly, so the mp4 -> GIF conversion the
      older pipeline needed is gone, and with it the ffmpeg dependency.

   Poll slides show options with NO percentages. Live tallies exist only
   in the HTML deck; a static file must never imply a distribution.
   ============================================================ */
import PptxGenJS from "pptxgenjs";
import { SLIDES, MEETING } from "../deck/slides.js";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = join(root, "deck", "media");

const C = {
  ground:"0E0E11", lift:"17171C", hair:"32323C", bone:"EDE7DF",
  dim:"9A958E", faint:"7A756F", ember:"E2571E", cyan:"5FD4CA"
};
const DISP = "Georgia", BODY = "Calibri";
const W = 13.333, H = 7.5, MX = 0.6;

const TOTAL_POLLS = new Set(SLIDES.filter(x => x.poll).map(x => x.poll)).size;

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Mizzou Emergency Medicine";
pptx.title  = "Don't Get Burned: When Ultrasound Lies";

const mediaPath = (src) => {
  const p = join(MEDIA, basename(src));
  return existsSync(p) ? p : null;
};

/* strip the light inline HTML used in slides.js */
const plain = (s) => String(s||"").replace(/<[^>]+>/g, "");

function dark(s){ s.background = { color: C.ground }; }

function eyebrow(s, txt){
  s.addText(plain(txt).toUpperCase(), { x:MX, y:0.34, w:W-2*MX, h:0.3,
    fontFace:BODY, fontSize:11, bold:true, color:C.ember, charSpacing:3 });
}
function head(s, parts, size=26){
  // parts: [before, emphasis, after] — emphasis renders ember italic
  const rt = [];
  if(parts[0]) rt.push({ text:plain(parts[0]), options:{ color:C.bone } });
  if(parts[1]) rt.push({ text:plain(parts[1]), options:{ color:C.ember, italic:true } });
  if(parts[2]) rt.push({ text:plain(parts[2]), options:{ color:C.bone } });
  s.addText(rt, { x:MX, y:0.68, w:W-2*MX, h:0.85,
    fontFace:DISP, fontSize:size, bold:true, valign:"top" });
}
function clip(s, src, x, y, w, h, tag){
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill:{color:"000000"},
    line:{ color:C.hair, width:0.75 } });
  const p = mediaPath(src);
  if(p) s.addMedia({ type:"video", path:p, x:x+0.05, y:y+0.05, w:w-0.1, h:h-0.1 });
  else  s.addText("[media missing]", { x, y:y+h/2, w, h:0.4, align:"center",
          fontFace:BODY, fontSize:11, color:C.faint });
  if(tag) s.addText(plain(tag).toUpperCase(), { x, y:y+h-0.32, w:w*0.75, h:0.28,
    fontFace:BODY, fontSize:8, color:C.faint, charSpacing:2, fill:{color:C.ground} });
}
function optionRows(s, sl, x, y, w, reveal){
  const rowH = 0.52, gap = 0.12;
  const traps = Array.isArray(sl.trapped) ? sl.trapped
              : (sl.trapped === undefined || sl.trapped === null ? [] : [sl.trapped]);
  sl.options.forEach((t,i) => {
    const yy = y + i*(rowH+gap);
    const isC = reveal && i===sl.correct, isT = reveal && traps.includes(i);
    s.addShape(pptx.ShapeType.rect, { x, y:yy, w, h:rowH, fill:{color:C.lift},
      line:{ color: isC?C.cyan : isT?C.ember : C.hair, width: (isC||isT)?1.25:0.75 } });
    s.addText("ABC"[i], { x:x+0.12, y:yy, w:0.3, h:rowH, fontFace:DISP, fontSize:13,
      bold:true, color: isC?C.cyan : isT?C.ember : C.dim, valign:"middle" });
    s.addText(plain(t), { x:x+0.46, y:yy, w:w-0.9, h:rowH, fontFace:BODY, fontSize:10.5,
      color:C.bone, valign:"middle" });
    // the marker, not the colour, is what carries trap/correct
    if(isC || isT) s.addText(isC?"✓":"✕", { x:x+w-0.36, y:yy, w:0.28, h:rowH,
      fontFace:BODY, fontSize:12, bold:true, color:isC?C.cyan:C.ember, valign:"middle", align:"center" });
  });
  return y + sl.options.length*(rowH+gap);
}
function takeaway(s, tk, x, y, w){
  const h = tk.scope ? 1.65 : 1.05;
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill:{color:C.lift}, line:{color:C.hair,width:0.5} });
  s.addShape(pptx.ShapeType.rect, { x, y, w:0.04, h, fill:{color:C.cyan} });
  s.addText(plain(tk.lab).toUpperCase(), { x:x+0.16, y:y+0.06, w:w-0.3, h:0.22,
    fontFace:BODY, fontSize:8.5, bold:true, color:C.cyan, charSpacing:2 });
  s.addText(plain(tk.p), { x:x+0.16, y:y+0.28, w:w-0.3, h:0.6,
    fontFace:BODY, fontSize:10.5, color:C.bone });
  if(tk.scope) s.addText(plain(tk.scope), { x:x+0.16, y:y+0.9, w:w-0.3, h:0.68,
    fontFace:BODY, fontSize:9, italic:true, color:C.dim });
}

/* ---------------- per-type builders ---------------- */
const BUILD = {
  title(s, sl){
    s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:W, h:H, fill:{color:C.ground} });
    s.addText(`${MEETING.org} · ${MEETING.event}`.toUpperCase(),
      { x:MX, y:0.7, w:7.5, h:0.3, fontFace:BODY, fontSize:11, bold:true, color:C.ember, charSpacing:3 });
    s.addShape(pptx.ShapeType.rect, { x:MX, y:1.16, w:0.75, h:0.035, fill:{color:C.ember} });
    s.addText(sl.h1[0], { x:MX, y:1.45, w:8.2, h:0.85, fontFace:DISP, fontSize:42, bold:true, color:C.bone });
    s.addText(sl.h1[1], { x:MX, y:2.28, w:8.2, h:0.85, fontFace:DISP, fontSize:42, bold:true, italic:true, color:C.ember });
    s.addText(sl.sub, { x:MX, y:3.3, w:6.4, h:0.5, fontFace:BODY, fontSize:14, color:C.dim });
    s.addShape(pptx.ShapeType.rect, { x:9.15, y:0.7, w:0.008, h:5.9, fill:{color:C.hair} });
    sl.spine.forEach((p,i) => {
      s.addText(`0${i+1}`, { x:9.45, y:1.5+i*1.15, w:0.6, h:0.25, fontFace:DISP, fontSize:11, bold:true, color:C.ember });
      s.addText(p, { x:9.45, y:1.76+i*1.15, w:3.3, h:0.65, fontFace:BODY, fontSize:11, color:C.dim });
    });
    s.addText(MEETING.presenter,
      { x:MX, y:6.32, w:7, h:0.3, fontFace:BODY, fontSize:12, color:C.dim });
    s.addText(`Join: ${MEETING.joinUrl}  ·  ${MEETING.joinCode}`,
      { x:MX, y:6.72, w:7, h:0.3, fontFace:BODY, fontSize:10, color:C.faint });
  },

  join(s, sl){
    eyebrow(s, "Before we start");
    const qr = join(MEDIA, "qr.png");
    if(existsSync(qr)) s.addImage({ path:qr, x:2.1, y:1.6, w:3.4, h:3.4 });
    s.addText("SCAN TO JOIN · NO APP, NO SIGN-IN", { x:6.2, y:2.0, w:6, h:0.3,
      fontFace:BODY, fontSize:10, bold:true, color:C.cyan, charSpacing:2 });
    s.addText(MEETING.joinCode, { x:6.2, y:2.35, w:6, h:0.9, fontFace:DISP, fontSize:40, bold:true, color:C.bone });
    s.addText(MEETING.joinUrl, { x:6.2, y:3.3, w:6, h:0.4, fontFace:BODY, fontSize:14, color:C.dim });
    s.addText(plain(sl.note), { x:6.2, y:3.9, w:5.4, h:1.0, fontFace:BODY, fontSize:11, color:C.faint });
  },

  spine(s, sl){
    eyebrow(s, sl.eyebrow);
    head(s, sl.h2, 24);
    const cw = (W-2*MX-3*0.24)/4;
    sl.cards.forEach((c,i) => {
      const x = MX + i*(cw+0.24);
      s.addShape(pptx.ShapeType.rect, { x, y:1.95, w:cw, h:2.5, fill:{color:C.lift},
        line:{ color:(sl.highlight===i)?C.ember:C.hair, width:(sl.highlight===i)?1.25:0.75 } });
      s.addText(c.n, { x:x+0.2, y:2.1, w:1, h:0.4, fontFace:DISP, fontSize:19, bold:true,
        color:(sl.highlight===i)?C.ember:C.hair });
      s.addText(c.t, { x:x+0.2, y:2.6, w:cw-0.4, h:0.8, fontFace:DISP, fontSize:13, bold:true, color:C.bone });
      if (sl.highlight === i || sl.cardText === "all")
        s.addText(c.d, { x:x+0.2, y:3.42, w:cw-0.4, h:0.9, fontFace:BODY, fontSize:9.5, color:C.dim });
    });
    if(sl.foot) takeaway(s, { lab:sl.foot.lab, p:sl.foot.p }, MX, 4.75, W-2*MX);
  },

  poll(s, sl){
    s.addText((sl.orient||[]).filter(Boolean).join("   ·   ").toUpperCase(),
      { x:MX, y:0.34, w:8, h:0.3, fontFace:BODY, fontSize:9.5, bold:true, color:C.faint, charSpacing:2 });
    s.addText(`POLL ${sl.poll} OF ${TOTAL_POLLS}`, { x:W-MX-2, y:0.34, w:2, h:0.3, align:"right",
      fontFace:BODY, fontSize:9.5, bold:true, color:C.cyan, charSpacing:2 });
    clip(s, sl.media.src, MX, 0.85, 7.7, 5.85, sl.media.tag);
    const rx = 8.55, rw = W-MX-rx;
    s.addText(plain(sl.stem), { x:rx, y:0.85, w:rw, h:1.5, fontFace:BODY, fontSize:13, bold:true, color:C.bone });
    if(sl.ask) s.addText(plain(sl.ask), { x:rx, y:2.35, w:rw, h:0.3, fontFace:BODY, fontSize:11, color:C.dim });
    optionRows(s, sl, rx, 2.75, rw, false);
    s.addText("Live voting is in the web deck. In this file, take a show of hands.",
      { x:rx, y:6.25, w:rw, h:0.5, fontFace:BODY, fontSize:9, italic:true, color:C.faint });
  },

  reveal(s, sl){
    s.addText((sl.orient||[]).filter(Boolean).join("   ·   ").toUpperCase(),
      { x:MX, y:0.34, w:8, h:0.3, fontFace:BODY, fontSize:9.5, bold:true, color:C.faint, charSpacing:2 });
    clip(s, sl.media.src, MX, 0.85, 7.7, 5.85, sl.media.tag);
    const rx = 8.55, rw = W-MX-rx;
    s.addText([{ text:"✕ THE TRAP   ", options:{ color:C.ember } },
               { text:"✓ THE CHECK",   options:{ color:C.cyan } }],
      { x:rx, y:0.85, w:rw, h:0.3, fontFace:BODY, fontSize:9.5, bold:true, charSpacing:1.5 });
    const after = optionRows(s, sl, rx, 1.28, rw, true);
    if(sl.takeaway) takeaway(s, sl.takeaway, rx, after+0.18, rw);
  },

  cmp3(s, sl){ cmp(s, sl, 3); },
  cmp2(s, sl){ cmp(s, sl, 2); },

  refs(s, sl){
    eyebrow(s, sl.eyebrow);
    head(s, sl.h2, 24);
    const cw = (W-2*MX-0.5)/2;
    sl.cols.forEach((c,i) => {
      const x = MX + i*(cw+0.5);
      s.addText(plain(c.h).toUpperCase(), { x, y:1.95, w:cw, h:0.3,
        fontFace:BODY, fontSize:9.5, bold:true, color:C.ember, charSpacing:2 });
      s.addText(c.items.map(t => ({ text:plain(t), options:{ bullet:true } })),
        { x, y:2.32, w:cw, h:3.4, fontFace:BODY, fontSize:10.5, color:C.dim, lineSpacingMultiple:1.25 });
    });
    s.addShape(pptx.ShapeType.rect, { x:MX, y:6.35, w:W-2*MX, h:0.008, fill:{color:C.hair} });
    s.addText(plain(sl.attrib), { x:MX, y:6.5, w:W-2*MX, h:0.4, fontFace:BODY, fontSize:9.5, color:C.faint });
  }
};

function cmp(s, sl, n){
  eyebrow(s, sl.eyebrow);
  head(s, sl.h2, 24);
  const gap = 0.3, cw = (W-2*MX-(n-1)*gap)/n;
  sl.cells.forEach((c,i) => {
    const x = MX + i*(cw+gap);
    s.addShape(pptx.ShapeType.rect, { x, y:1.9, w:cw, h:4.85, fill:{color:C.lift}, line:{color:C.hair,width:0.75} });
    clip(s, c.src, x+0.08, 1.98, cw-0.16, 3.0, null);
    const tone = c.tone==="trap" ? C.ember : c.tone==="check" ? C.cyan : C.dim;
    s.addText(`${c.mk} ${plain(c.t)}`.toUpperCase(), { x:x+0.16, y:5.1, w:cw-0.32, h:0.3,
      fontFace:BODY, fontSize:9, bold:true, color:tone, charSpacing:1.5 });
    s.addText(plain(c.d), { x:x+0.16, y:5.42, w:cw-0.32, h:1.2, fontFace:BODY, fontSize:9.5, color:C.bone });
  });
}

/* ---------------- assemble ---------------- */
let built = 0;
for(const sl of SLIDES){
  const s = pptx.addSlide();
  dark(s);
  (BUILD[sl.type] || ((sx)=>sx.addText(sl.type, {x:1,y:1,w:5,h:1,color:C.bone})))(s, sl);
  const notes = (sl.notes||[]).map(n => "• " + plain(n)).join("\n");
  const verify = (sl.verify||[]).length
    ? "\n\nVERIFY BEFORE PRESENTING:\n" + sl.verify.map(v => "- " + plain(v)).join("\n") : "";
  s.addNotes(notes + verify);
  built++;
}

const out = join(root, "Dont Get Burned When Ultrasound Lies.pptx");
await pptx.writeFile({ fileName: out });
console.log(`pptx written: ${built} slides -> ${out}`);
