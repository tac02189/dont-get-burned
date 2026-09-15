/* Two defects found by driving the deployed deck against a live phone client:

   1. The vote pill is baked into every slide at boot, so a poll slide built
      before Firestore connected kept saying "Voting open" forever — and the
      one it repainted was only ever the slide that happened to be active.
   2. Two slide changes in the same tick raced: the reveal's write could land
      after the poll's, publishing the reveal's abbreviated labels and no stem
      ("Choose one") to the phones, and leaving voting open on a reveal.
      Going BACK to a poll slide also never reopened voting. */
import { readFileSync, writeFileSync } from "node:fs";
const must = (c,m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

/* ---------------- deck.js ---------------- */
let d = readFileSync("deck/deck.js", "utf8");

must(d.includes('if(s.type === "reveal" && s.liveResults) cur.innerHTML = LAYOUT.reveal(s);'), "anchor: go() reveal re-render");
d = d.replace('    if(s.type === "reveal" && s.liveResults) cur.innerHTML = LAYOUT.reveal(s);',
`    // Poll slides carry live state too (the vote pill), so re-render those on
    // entry as well: a slide built before Firestore answered must not go on
    // promising the room that their phones are connected.
    if(s.type === "poll" || (s.type === "reveal" && s.liveResults)){
      cur.innerHTML = LAYOUT[s.type](s);
      if(qrData) cur.querySelectorAll(".qrslot").forEach(img => img.src = qrData);
    }`);

must(d.includes("if(live && live.fs) Live.onSlide(live.fs, SLIDES[idx]);"), "anchor: onSlide call");
d = d.replace("  if(live && live.fs) Live.onSlide(live.fs, SLIDES[idx]);",
"  if(live && live.fs) Live.onSlide(live.fs, pollIntent(SLIDES[idx]));");

must(d.includes("function go(n){"), "anchor: go decl");
d = d.replace("function go(n){",
`/* What the phones should show for this slide. The stem and options always
   come from the POLL slide, never the reveal: reveals carry abbreviated
   labels and no prompt, and a phone that lands on one should still show the
   question the room actually voted on. */
function pollIntent(s){
  if(!s.poll) return null;
  const q = SLIDES.find(x => x.poll === s.poll && x.type === "poll") || s;
  return { poll: s.poll, open: s.type === "poll", ask: q.ask, options: q.options };
}

function go(n){`);
writeFileSync("deck/deck.js", d);

/* ---------------- live.js ---------------- */
let l = readFileSync("deck/live.js", "utf8");
const from = l.indexOf("/* Called by the deck whenever the active slide changes. */");
const to   = l.indexOf("function subscribeVotes(fs, poll){");
must(from > 0 && to > from, "anchor: onSlide block");
l = l.slice(0, from) +
`/* Called by the deck whenever the active slide changes. \`intent\` is
   { poll, open, ask, options }, built by the deck from the POLL slide. */
export function onSlide(fsMod, intent){
  if(!db || !fsMod || !sessionRef || !intent || !intent.poll) return;
  const fs = fsMod;
  const mine = ++seq;
  // Serialized, and superseded writes are dropped. Two slide changes in one
  // tick used to race; whichever landed last won, which is how a reveal could
  // leave the phones voting on a question the room had already been shown.
  queue = queue.then(async () => {
    if(mine !== seq) return;
    const poll = intent.poll;
    const open = !!intent.open;

    if(poll !== curPoll){
      // Publish what the phones should show. Options are short labels only —
      // the stem stays on the big screen so eyes stay up.
      const ok = await publish(fs, {
        currentPoll: poll,
        state: open ? "open" : "closed",
        q: { stem: (intent.ask || "Choose one"), options: intent.options || [] }
      });
      // curPoll only moves when the phones have actually been told to move.
      // If the write failed the room is still on the previous question, and
      // the next slide change retries instead of assuming it got through.
      if(ok) curPoll = poll;
    }else{
      // Same question, different slide: open on the poll, closed on the
      // reveal — including when the presenter walks BACK to re-run a poll,
      // which used to leave every phone locked out.
      await publish(fs, { state: open ? "open" : "closed" });
    }

    if(poll !== subPoll){ subscribeVotes(fs, poll); subPoll = poll; }
  }).catch(quiet("onSlide"));
}

` + l.slice(to);

must(l.includes("let curPoll = null;"), "anchor: state decls");
l = l.replace("let canDrive = false; // are our writes landing?",
`let canDrive = false; // are our writes landing?
let queue = Promise.resolve();   // one write at a time
let seq = 0;                     // newest slide change wins`);
writeFileSync("deck/live.js", l);
console.log("deck.js + live.js patched");
