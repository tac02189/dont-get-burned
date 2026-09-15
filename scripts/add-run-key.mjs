/* R (twice) starts a fresh vote run — the presenter-facing half of per-run votes. */
import { readFileSync, writeFileSync } from "node:fs";
const must = (c, m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

let d = readFileSync("deck/deck.js", "utf8");

/* 1. one toast helper, used by the backend warning and by the run notice */
must(d.includes(`function warnPresenter(state){
  const el = document.getElementById("livewarn");
  if(!el) return;
  el.innerHTML = (state === "readonly"`), "deck: warnPresenter anchor");
d = d.replace(`function warnPresenter(state){
  const el = document.getElementById("livewarn");
  if(!el) return;
  el.innerHTML = (state === "readonly"
    ? "Live polling is read-only — another browser owns this session code."
    : "Live polling is offline.")
    + " Phones cannot follow this deck. Press <b>N</b> for the fix, or <b>O</b> for hands mode.";
  el.classList.add("show");
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => el.classList.remove("show"), 12000);
}`,
`function toast(html, ms){
  const el = document.getElementById("livewarn");
  if(!el) return;
  el.innerHTML = html;
  el.classList.add("show");
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => el.classList.remove("show"), ms || 12000);
}

function warnPresenter(state){
  toast((state === "readonly"
    ? "Live polling is read-only — another browser owns this session code."
    : "Live polling is offline.")
    + " Phones cannot follow this deck. Press <b>N</b> for the fix, or <b>O</b> for hands mode.");
}

/* A new run gives this lecture its own vote namespace, so the tallies start
   empty without deleting anything. Two presses, because one stray R during a
   talk must not blank a tally the room is still looking at. */
let runArm = 0;
async function freshRun(){
  if(!(live && live.fs)){ toast("No live backend — there are no tallies to reset."); return; }
  const id = await Live.newRun(live.fs);
  if(!id){ toast("Could not start a new run — this deck does not own the session. Press <b>N</b>."); return; }
  SLIDES.forEach(s => { delete s.liveResults; });   // nothing stale may survive on screen
  repaint();
  Live.onSlide(live.fs, pollIntent(SLIDES[idx]));
  toast("New vote run started · every tally is now empty · phones are waiting for the next poll");
  console.info("[pocus-live] run " + id);
}`);

/* 2. the key itself */
must(d.includes(`  else if(e.key === "q" || e.key === "Q"){ document.body.classList.toggle("qa"); }`), "deck: key anchor");
d = d.replace(`  else if(e.key === "q" || e.key === "Q"){ document.body.classList.toggle("qa"); }`,
`  else if(e.key === "q" || e.key === "Q"){ document.body.classList.toggle("qa"); }
  else if(e.key === "r" || e.key === "R"){   // new lecture: fresh, empty tallies
    if(Date.now() - runArm < 5000){ runArm = 0; freshRun(); }
    else{
      runArm = Date.now();
      toast("Start a fresh vote run? Press <b>R</b> again within five seconds. "
          + "Every tally on this deck goes back to empty — the old votes are kept, "
          + "but this deck stops counting them.", 5000);
    }
  }`);
writeFileSync("deck/deck.js", d);

/* 3. the on-screen key hint */
let h = readFileSync("deck/index.html", "utf8");
must(h.includes("O hands mode</div>"), "index: hint anchor");
h = h.replace("O hands mode</div>", "O hands mode &middot; R new vote run</div>");
writeFileSync("deck/index.html", h);

console.log("deck.js: R starts a new run; index.html: hint updated");
