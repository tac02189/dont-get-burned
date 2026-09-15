/* Makes a broken live-poll connection visible to the presenter.
   Before this, live.js swallowed permission-denied and the deck kept
   printing "Voting open" at a room whose phones were frozen. */
import { readFileSync, writeFileSync } from "node:fs";

const P = "deck/deck.js";
let s = readFileSync(P, "utf8");
const had = s;
const must = (cond, msg) => { if(!cond){ console.error("ABORT: " + msg); process.exit(1); } };

/* 1. state -------------------------------------------------------------- */
must(s.includes("let live = null;"), "anchor: live decl");
s = s.replace(
  /let live = null;\s*\/\/ set by live\.js if Firestore is reachable/,
  `let live = null;                // set by live.js if Firestore is reachable
let liveState = "off";          // off | live | readonly | offline — reported by live.js
let liveDetail = "";`);

/* 2. the pill may never claim the phones are listening when they are not -- */
must(s.includes('${handsMode?"Show of hands":"Voting open"}'), "anchor: vote pill");
s = s.replace(
  /<div class="votestate\$\{handsMode\?" offline":""\}">\s*<span class="dot"><\/span>\$\{handsMode\?"Show of hands":"Voting open"\}<\/div>/,
  '${votePill()}');

s = s.replace(/\/\* ---------------- layouts ---------------- \*\//,
`/* The vote pill states the truth about the backend. "Voting open" is a
   promise to the room that their phones are live; only say it when the
   deck's own writes are landing. */
function votePill(){
  const on = !handsMode && liveState === "live";
  return \`<div class="votestate\${on?"":" offline"}">
            <span class="dot"></span>\${on?"Voting open":"Show of hands"}</div>\`;
}

/* ---------------- layouts ---------------- */`);

/* 3. one repaint path for the active slide ------------------------------ */
must(s.includes("function renderNotes(){"), "anchor: renderNotes");
s = s.replace(/function renderNotes\(\)\{/,
`function repaint(){
  const el = stage.querySelector(".slide.active");
  if(!el) return;
  const s = SLIDES[idx];
  el.innerHTML = (LAYOUT[s.type] || (()=>""))(s);
  if(qrData) el.querySelectorAll(".qrslot").forEach(img => img.src = qrData);
  attachMedia(el);
}

function renderNotes(){`);

/* 4. notes panel carries the diagnosis and the one-line fix -------------- */
must(s.includes('${s.verify?.length ?'), "anchor: notes verify block");
s = s.replace(
  /\$\{s\.verify\?\.length \? `<div class="src"><b>Verify before presenting:<\/b> \$\{\s*s\.verify\.map\(v=>`<br>— \$\{v\}`\)\.join\(""\)\}<\/div>` : ""\}`;/,
  `\${s.verify?.length ? \`<div class="src"><b>Verify before presenting:</b> \${
      s.verify.map(v=>\`<br>— \${v}\`).join("")}</div>\` : ""}
    \${liveState === "live" ? "" : \`<div class="src"><b>Live polling: \${liveState.toUpperCase()}</b>
      — the phones are NOT following this deck. \${esc(liveDetail)}
      <br>— Fix: run <b>node scripts/clear-session.mjs</b>, then reload this deck; it re-claims the session.
      <br>— Or press <b>O</b> and run the polls as a show of hands.</div>\`}\`;`);

/* 5. live.js reports status; the deck acts on it ------------------------ */
must(s.includes("window.__deckLiveReady = (l) => { live = l; };"), "anchor: __deckLiveReady");
s = s.replace(/window\.__deckLiveReady = \(l\) => \{ live = l; \};/,
`window.__deckLiveReady = (l) => { live = l; };

/* live.js tells us whether our writes are actually landing. A silent
   failure here is what froze every phone on question 1 on 2026-09-14:
   another browser owned the session, every update was rejected, and the
   deck went on promising "Voting open" for the whole talk. */
window.__deckLiveStatus = (state, detail) => {
  const changed = state !== liveState;
  liveState = state; liveDetail = detail || "";
  if(!changed) return;
  console.info("[pocus-live] " + state + (detail ? " — " + detail : ""));
  if(SLIDES[idx].type === "poll") repaint();
  renderNotes();
  if(state === "readonly" || state === "offline") warnPresenter(state);
};

/* Presenter-facing, not audience-facing: small, low-contrast, bottom-left,
   gone in 12 seconds. The projected slide must not wear a red error bar,
   but the presenter has to find out now rather than from the room. */
let warnTimer = null;
function warnPresenter(state){
  const el = document.getElementById("livewarn");
  if(!el) return;
  el.innerHTML = (state === "readonly"
    ? "Live polling is read-only — another browser owns this session code."
    : "Live polling is offline.")
    + " Phones cannot follow this deck. Press <b>N</b> for the fix, or <b>O</b> for hands mode.";
  el.classList.add("show");
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => el.classList.remove("show"), 12000);
}`);

/* 6. reuse repaint in the tally hook ------------------------------------ */
s = s.replace(
  /  if\(touched && SLIDES\[idx\]\.poll === pollNum && SLIDES\[idx\]\.type === "reveal"\)\{\s*const el = stage\.querySelector\("\.slide\.active"\);\s*el\.innerHTML = LAYOUT\.reveal\(SLIDES\[idx\]\);\s*attachMedia\(el\);\s*\}/,
  `  if(touched && SLIDES[idx].poll === pollNum && SLIDES[idx].type === "reveal") repaint();`);

must(s !== had, "nothing changed");
writeFileSync(P, s);
console.log("deck.js patched");
