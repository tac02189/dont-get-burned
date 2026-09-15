import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/tac02/pocus_pitfalls_build/deck/deck.js";
let d = readFileSync(p, "utf8");

const OLD = `  const cur = stage.querySelector(".slide.active");
  if(cur) attachMedia(cur);`;

const NEW = `  const cur = stage.querySelector(".slide.active");
  if(cur){
    // Slide DOM is built once at boot. A live tally almost always arrives
    // while the POLL slide is still up, so by the time the presenter
    // advances to the reveal its DOM is stale and shows an empty tally --
    // and since voting is closed by then, no later snapshot ever fixes it.
    // Re-render the reveal on entry whenever we hold results for it.
    // (Found by end-to-end test; invisible to any single-slide check.)
    const s = SLIDES[idx];
    if(s.type === "reveal" && s.liveResults) cur.innerHTML = LAYOUT.reveal(s);
    attachMedia(cur);
  }`;

if (!d.includes(OLD)) { console.error("anchor not found - already patched?"); process.exit(1); }
d = d.replace(OLD, NEW);
writeFileSync(p, d);
console.log("patched go() to re-render stale reveal slides on entry");
