/* ============================================================
   Don't Get Burned: When Ultrasound Lies — renderer + navigation
   ============================================================ */
import { SLIDES, MEETING } from "./slides.js";
import * as Live from "./live.js";

/* PREVIEW MODE
   The `results` arrays in slides.js are INVENTED numbers used only to
   lay out and screenshot the design. They must never be shown to an
   audience as if they were real votes. They render only with ?preview=1.
   In the live deck, percentages appear ONLY from live Firestore data. */
const PREVIEW = new URLSearchParams(location.search).has("preview");

const stage = document.getElementById("stage");
const notesEl = document.getElementById("notes");
const ovEl = document.getElementById("ov");
const progEl = document.getElementById("prog");
const hintEl = document.getElementById("hint");

let idx = 0;
let handsMode = false;          // O toggles: no backend, show of hands
let revealed = {};              // pollNum -> true once presenter reveals
let live = null;                // set by live.js if Firestore is reachable
let liveState = "off";          // off | live | readonly | offline — reported by live.js
let liveDetail = "";

const esc = s => String(s == null ? "" : s);
/* esc() passes HTML through, which slides.js content relies on. Anything that
   can come from the URL (the ?s= code, error text that quotes it) goes through
   this instead. */
const html = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
// derived, never hardcoded - adding a poll must not leave "of 6" behind
const TOTAL_POLLS = new Set(SLIDES.filter(x => x.poll).map(x => x.poll)).size;

/* ---------------- QR ---------------- */
let qrData = "";
async function loadQR(){
  try { qrData = (await (await fetch("media/qr.txt")).text()).trim(); }
  catch { qrData = ""; }
}

/* ---------------- media ----------------
   Lazy: a clip's src is only attached when its slide is current or
   adjacent. 26 clips at ~900 KB each would otherwise all fetch at load,
   and a shared post-talk link would burn Firebase's daily transfer cap. */
function mediaEl(m){
  if(!m) return "";
  if(m.kind === "img")
    return `<img data-src="${esc(m.src)}" alt="">`;
  return `<video data-src="${esc(m.src)}" loop muted playsinline preload="none"></video>`;
}
function attachMedia(slideEl){
  slideEl.querySelectorAll("[data-src]").forEach(el => {
    if(!el.getAttribute("src")) el.setAttribute("src", el.dataset.src);
    if(el.tagName === "VIDEO"){ el.currentTime = 0; el.play().catch(()=>{}); }
  });
}
function detachMedia(slideEl){
  slideEl.querySelectorAll("video").forEach(v => v.pause());
}

/* ---------------- option rows ---------------- */
function optionRows(s, opts){
  // reveal:false means NOTHING may hint at the answer - no colour, no glyph.
  const reveal      = !!(opts && opts.reveal);
  const withResults = !!(opts && opts.withResults);
  const res = withResults ? (s.liveResults || s.results || []) : null;
  const total = res ? res.reduce((a,b)=>a+b,0) : 0;
  // `trapped` may be a single index or several — some questions are wrong in
  // more than one direction, and saying so is often the actual lesson.
  const traps = Array.isArray(s.trapped) ? s.trapped
              : (s.trapped === undefined || s.trapped === null ? [] : [s.trapped]);
  return s.options.map((t,i) => {
    const cls = reveal ? (i === s.correct ? "correct" : (traps.includes(i) ? "trapped" : "")) : "";
    const mk  = reveal ? (i === s.correct ? "✓" : (traps.includes(i) ? "✕" : "")) : "";
    const pct = res && total ? Math.round(res[i]/total*100) : null;
    return `<div class="opt ${cls}">
      ${pct!==null ? `<div class="bar" style="width:${pct}%"></div>` : ""}
      <div class="k">${"ABC"[i]}</div>
      <div class="t">${t}</div>
      ${pct!==null ? `<div class="pct">${pct}%</div>` : ""}
      ${mk ? `<div class="mk">${mk}</div>` : ""}
    </div>`;
  }).join("");
}

function orientBar(o, pollNum){
  const parts = (o||[]).filter(Boolean).map(esc);
  return `<div class="orient">${
    parts.map((p,i)=> `<span>${p}</span>${i<parts.length-1?'<i>·</i>':''}`).join("")
  }${pollNum ? `<span class="pn">Poll ${pollNum} of ${TOTAL_POLLS}</span>` : ""}</div>`;
}

function annotations(s){
  let out = "";
  (s.calipers||[]).forEach(c => {
    out += `<div class="caliper ${c.bad?"bad":""}" style="left:${c.x}%;top:${c.y}%;width:${c.w}%">
      <div class="line"></div>
      <div class="cap" style="left:0"></div><div class="cap" style="right:0"></div>
      <div class="lbl" style="${c.above?"top:-26px":"top:9px"}">${esc(c.label)}</div>
    </div>`;
  });
  (s.rings||[]).forEach(r => {
    out += `<div class="ring ${r.bad?"bad":""}" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%">
      <div class="rl">${esc(r.label)}</div></div>`;
  });
  return out;
}

/* The vote pill states the truth about the backend. "Voting open" is a
   promise to the room that their phones are live; only say it when the
   deck's own writes are landing. */
function votePill(){
  // PREVIEW is layout-only and never runs the backend; keep the pill in its
  // designed state there so design screenshots stay faithful.
  const on = PREVIEW || (!handsMode && liveState === "live");
  return `<div class="votestate${on?"":" offline"}">
            <span class="dot"></span>${on?"Voting open":"Show of hands"}</div>`;
}

/* ---------------- layouts ---------------- */
const LAYOUT = {

title: s => `
  <div class="eyebrow">${MEETING.org} · ${MEETING.event}</div>
  <div class="rule"></div>
  <h1>${s.h1[0]}<br><em>${s.h1[1]}</em></h1>
  <div class="sub" style="max-width:600px;font-size:18px">${s.sub}</div>
  <div class="title-meta">
    <div><b>Presented by</b>${MEETING.presenter}</div>
    <div><b>Join</b>${MEETING.joinUrl} · <span style="color:var(--bone)">${MEETING.joinCode}</span></div>
  </div>
  <div class="spine">
    ${s.spine.map((p,i)=>`<div><div class="n">0${i+1}</div><p>${p}</p></div>`).join("")}
  </div>`,

join: s => `
  <div class="eyebrow">Before we start</div>
  <div class="joinwrap">
    <img class="qrslot" alt="Join QR code">
    <div>
      <div class="jt">Scan to join · no app, no sign-in</div>
      <div class="jcode">${MEETING.joinCode}</div>
      <div class="jurl">${MEETING.joinUrl}</div>
      <div class="jnote">${s.note}</div>
    </div>
  </div>`,

spine: s => `
  <div class="eyebrow">${s.eyebrow}</div>
  <h2 style="margin-top:14px;max-width:940px">${s.h2[0]}<em>${s.h2[1]}</em>${s.h2[2]}</h2>
  <div class="qgrid">
    ${s.cards.map((c,i)=>`
      <div class="qcard${s.highlight===i?" on":""}">
        <div class="num">${c.n}</div>
        <div class="qt">${c.t}</div>
        ${(s.highlight===i || s.cardText==="all") ? `<div class="qd">${c.d}</div>` : ""}
      </div>`).join("")}
  </div>
  ${s.foot ? `<div class="takeaway" style="margin-top:24px">
    <div class="lab">${s.foot.lab}</div><p>${s.foot.p}</p></div>` : ""}`,

poll: s => `
  ${orientBar(s.orient, s.poll)}
  <div class="pollgrid">
    <div class="clipwrap">${mediaEl(s.media)}
      <div class="cliptag">${esc(s.media.tag)}</div></div>
    <div class="rail">
      <p class="q">${s.stem}</p>
      ${s.ask ? `<div class="sub" style="margin:-2px 0 4px;font-size:15px">${s.ask}</div>` : ""}
      ${optionRows(s, { reveal:false })}
      <div class="joinbox">
        <img class="qrslot" alt="Join QR">
        <div>
          <div class="jt">Scan to vote</div>
          <div class="code">${MEETING.joinCode}</div>
          ${votePill()}
        </div>
      </div>
    </div>
  </div>`,

reveal: s => {
  const show = PREVIEW || (!handsMode && s.liveResults);
  return `
  ${orientBar(s.orient, null)}
  <div class="pollgrid">
    <div class="clipwrap">${mediaEl(s.media)}
      ${annotations(s)}
      <div class="cliptag">${esc(s.media.tag)}</div></div>
    <div class="rail${show?" showres":" showres"}">
      <div style="display:flex;gap:8px">
        <span class="badge trap">✕ The trap</span>
        <span class="badge check">✓ The check</span>
      </div>
      ${optionRows(s, { reveal:true, withResults: show })}
      ${!show ? `<div class="badge note" style="align-self:flex-start">Show of hands — no live tally</div>` : ""}
      ${s.takeaway ? `<div class="takeaway">
        <div class="lab">${s.takeaway.lab}</div>
        <p>${s.takeaway.p}</p>
        ${s.takeaway.scope?`<p class="scope">${s.takeaway.scope}</p>`:""}
      </div>` : ""}
    </div>
  </div>`;
},

cmp3: s => `
  <div class="eyebrow">${s.eyebrow}</div>
  <h2 style="margin-top:12px">${s.h2[0]}<em>${s.h2[1]}</em>${s.h2[2]}</h2>
  <div class="cmp three">
    ${s.cells.map(c=>`
      <div class="cell ${c.tone}">
        <div class="cm">${mediaEl(c)}</div>
        <div class="cc"><div class="ct">${c.mk} ${c.t}</div><div class="cd">${c.d}</div></div>
      </div>`).join("")}
  </div>`,

cmp2: s => `
  <div class="eyebrow">${s.eyebrow}</div>
  <h2 style="margin-top:12px">${s.h2[0]}<em>${s.h2[1]}</em>${s.h2[2]}</h2>
  <div class="cmp two">
    ${s.cells.map(c=>`
      <div class="cell ${c.tone}">
        <div class="cm">${mediaEl(c)}</div>
        <div class="cc"><div class="ct">${c.mk} ${c.t}</div><div class="cd">${c.d}</div></div>
      </div>`).join("")}
  </div>`,

refs: s => `
  <div class="eyebrow">${s.eyebrow}</div>
  <h2 style="margin-top:12px">${s.h2[0]}<em>${s.h2[1]}</em>${s.h2[2]}</h2>
  <div class="refs">
    ${s.cols.map(c=>`
      <div class="refcol"><h3>${c.h}</h3>
        <ul>${c.items.map(i=>`<li>${i}</li>`).join("")}</ul></div>`).join("")}
  </div>
  <div class="attrib">${s.attrib}</div>`
};

/* ---------------- build ---------------- */
function build(){
  stage.querySelectorAll(".slide").forEach(n => n.remove());
  SLIDES.forEach((s,i) => {
    const el = document.createElement("section");
    el.className = "slide";
    el.dataset.i = i;
    el.innerHTML = (LAYOUT[s.type] || (()=>`<h2>${s.type}?</h2>`))(s);
    stage.insertBefore(el, progEl);
  });
  if(qrData) stage.querySelectorAll(".qrslot").forEach(img => img.src = qrData);
  buildOverview();
}

function buildOverview(){
  ovEl.innerHTML = SLIDES.map((s,i)=>`
    <div class="th" data-go="${i}">
      <div class="n">${String(i+1).padStart(2,"0")}</div>
      <div class="l">${esc(s.label)}</div>
    </div>`).join("");
  ovEl.querySelectorAll("[data-go]").forEach(t =>
    t.addEventListener("click", ()=>{ go(+t.dataset.go); ovEl.classList.remove("show"); }));
}

function repaint(){
  const el = stage.querySelector(".slide.active");
  if(!el) return;
  const s = SLIDES[idx];
  el.innerHTML = (LAYOUT[s.type] || (()=>""))(s);
  if(qrData) el.querySelectorAll(".qrslot").forEach(img => img.src = qrData);
  attachMedia(el);
}

/* The backend changed state: swap the vote pill in place. Re-rendering the
   slide here restarted its clip on every change, and the write deadline makes
   changes more frequent on a flaky network. (Ported from pocus-live-lectures,
   2026-11-12) */
function refreshPill(){
  stage.querySelectorAll(".slide.active .votestate").forEach(el => { el.outerHTML = votePill(); });
}

function renderNotes(){
  const s = SLIDES[idx];
  const n = s.notes || [];
  // The fix line is a command the presenter may paste into a shell, so only a
  // plain session code goes into it; anything else from ?s= gets a placeholder.
  // (Codex re-review, 2026-11-12)
  const active = Live.ACTIVE_CODE || MEETING.joinCode;
  const codeArg = /^[A-Za-z0-9_-]{1,64}$/.test(active) ? active : "<session-code>";
  notesEl.innerHTML = `<div class="nt">Speaker notes · ${esc(s.label)}</div>
    <ul>${n.map(x=>`<li>${x}</li>`).join("")}</ul>
    ${s.verify?.length ? `<div class="src"><b>Verify before presenting:</b> ${
      s.verify.map(v=>`<br>— ${v}`).join("")}</div>` : ""}
    ${liveState === "live" ? "" : `<div class="src"><b>Live polling: ${liveState.toUpperCase()}</b>
      — the phones are NOT following this deck. ${html(liveDetail)}
      <br>— Fix: run <b>node scripts/clear-session.mjs ${html(codeArg)}</b>, then reload this deck; it re-claims the session.
      <br>— Or press <b>O</b> and run the polls as a show of hands.</div>`}`;
}

/* What the phones should show for this slide. The stem and options always
   come from the POLL slide, never the reveal: reveals carry abbreviated
   labels and no prompt, and a phone that lands on one should still show the
   question the room actually voted on. */
function pollIntent(s){
  if(!s.poll) return null;
  const q = SLIDES.find(x => x.poll === s.poll && x.type === "poll") || s;
  // In hands mode (O) the phones are told the poll is closed, so nobody is
  // voting on a phone while the room votes by hand. (2026-11-12)
  return { poll: s.poll, open: s.type === "poll" && !handsMode, ask: q.ask, options: q.options };
}

function go(n){
  const prev = stage.querySelector(".slide.active");
  if(prev) detachMedia(prev);
  idx = Math.max(0, Math.min(SLIDES.length-1, n));
  stage.querySelectorAll(".slide").forEach(el =>
    el.classList.toggle("active", +el.dataset.i === idx));
  const cur = stage.querySelector(".slide.active");
  if(cur){
    // Slide DOM is built once at boot. A live tally almost always arrives
    // while the POLL slide is still up, so by the time the presenter
    // advances to the reveal its DOM is stale and shows an empty tally --
    // and since voting is closed by then, no later snapshot ever fixes it.
    // Re-render the reveal on entry whenever we hold results for it.
    // (Found by end-to-end test; invisible to any single-slide check.)
    const s = SLIDES[idx];
    // Poll slides carry live state too (the vote pill), so re-render those on
    // entry as well: a slide built before Firestore answered must not go on
    // promising the room that their phones are connected.
    // Reveals re-render on EVERY entry, not only when results are held: after
    // R R deleted the results, a reveal visited earlier kept its old tally in
    // the DOM and showed it again (Codex review of pocus-live-lectures,
    // 2026-11-12).
    if(s.type === "poll" || s.type === "reveal"){
      cur.innerHTML = LAYOUT[s.type](s);
      if(qrData) cur.querySelectorAll(".qrslot").forEach(img => img.src = qrData);
    }
    attachMedia(cur);
  }
  // prefetch the next slide's media so advancing is instant
  const next = stage.querySelector(`.slide[data-i="${idx+1}"]`);
  if(next) next.querySelectorAll("[data-src]").forEach(el => {
    if(!el.getAttribute("src")) el.setAttribute("src", el.dataset.src);
  });
  // A broken backend matters most the moment a poll goes up, and the boot-time
  // warning has long since faded by then — so say it again on every poll slide.
  if(SLIDES[idx].type === "poll" && (liveState === "readonly" || liveState === "offline"))
    warnPresenter(liveState);
  progEl.style.width = ((idx+1)/SLIDES.length*100) + "%";
  renderNotes();
  ovEl.querySelectorAll(".th").forEach(t => t.classList.toggle("cur", +t.dataset.go === idx));
  if(idx > 0) hintEl.classList.add("hide");
  location.hash = SLIDES[idx].id;
  if(live && live.fs) Live.onSlide(live.fs, pollIntent(SLIDES[idx]));
}

/* ---------------- live polling hook ----------------
   live.js calls window.__deckLive(pollNum, countsArray) when Firestore
   delivers a tally. Until then nothing numeric is ever displayed. */
window.__deckLive = (pollNum, counts) => {
  let touched = false;
  SLIDES.forEach(s => { if(s.poll === pollNum){ s.liveResults = counts; touched = true; } });
  if(touched && SLIDES[idx].poll === pollNum && SLIDES[idx].type === "reveal") repaint();
};
window.__deckLiveReady = (l) => { live = l; };

/* live.js tells us whether our writes are actually landing. A silent
   failure here is what froze every phone on question 1 on 2026-09-14:
   another browser owned the session, every update was rejected, and the
   deck went on promising "Voting open" for the whole talk. */
window.__deckLiveStatus = (state, detail) => {
  const changed = state !== liveState;
  liveState = state; liveDetail = detail || "";
  if(!changed) return;
  console.info("[pocus-live] " + state + (detail ? " — " + detail : ""));
  refreshPill();
  renderNotes();
  if(state === "readonly" || state === "offline") warnPresenter(state);
};

/* Presenter-facing, not audience-facing: small, low-contrast, bottom-left,
   gone in 12 seconds. The projected slide must not wear a red error bar,
   but the presenter has to find out now rather than from the room. */
let warnTimer = null;
function toast(html, ms){
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
  // A reset sent offline is not lost: it lands when the network returns, and
  // the deck must wait for it before switching runs. Refuse it while the deck
  // already knows its writes are not landing, rather than have it go off
  // minutes later. (Gemini review, 2026-11-12)
  if(liveState === "offline"){ toast("Live polling is offline, so a new run cannot start now. Try again once the pill says Voting open."); return; }
  const id = await Live.newRun(live.fs);
  if(!id){ toast("Could not start a new run — this deck does not own the session. Press <b>N</b>."); return; }
  SLIDES.forEach(s => { delete s.liveResults; });   // nothing stale may survive on screen
  repaint();
  Live.onSlide(live.fs, pollIntent(SLIDES[idx]));
  toast("New vote run started · every tally is now empty · "
      + (SLIDES[idx].poll ? "this slide's question is going to the phones" : "phones are waiting for the next poll"));
  console.info("[pocus-live] run " + id);
}

/* ---------------- keys ---------------- */
addEventListener("keydown", e => {
  if(e.key === "ArrowRight" || e.key === " " || e.key === "PageDown"){ e.preventDefault(); go(idx+1); }
  else if(e.key === "ArrowLeft" || e.key === "PageUp"){ e.preventDefault(); go(idx-1); }
  else if(e.key === "n" || e.key === "N"){ notesEl.classList.toggle("show"); }
  else if(e.key === "Escape"){ ovEl.classList.toggle("show"); }
  else if(e.key === "f" || e.key === "F"){
    if(document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(()=>{});
  }
  else if(e.key === "o" || e.key === "O"){   // venue fallback: no backend, hands only
    handsMode = !handsMode; build(); go(idx);
    // go() closes the phones on a poll or reveal slide. Anywhere else it has no
    // poll to send, so close the question the phones were last given.
    if(handsMode && live && live.fs && !SLIDES[idx].poll) Live.closeVoting(live.fs);
  }
  else if(e.key === "q" || e.key === "Q"){ document.body.classList.toggle("qa"); }
  else if(e.key === "r" || e.key === "R"){   // new lecture: fresh, empty tallies
    if(Date.now() - runArm < 5000){ runArm = 0; freshRun(); }
    else{
      runArm = Date.now();
      toast("Start a fresh vote run? Press <b>R</b> again within five seconds. "
          + "Every tally on this deck goes back to empty — the old votes are kept, "
          + "but this deck stops counting them.", 5000);
    }
  }
  else if(e.key === "Home"){ go(0); }
  else if(e.key === "End"){ go(SLIDES.length-1); }
});

function fit(){
  const s = Math.min(innerWidth/1280, innerHeight/720);
  stage.style.transform = `scale(${s})`;
}
addEventListener("resize", fit);

/* ---------------- boot ---------------- */
(async function(){
  await loadQR();
  fit();
  build();
  const want = SLIDES.findIndex(s => s.id === location.hash.slice(1));
  go(want >= 0 ? want : 0);
  if(PREVIEW) document.body.classList.add("qa");
  if(!PREVIEW){ Live.start().then(() => { if(live && live.fs) Live.onSlide(live.fs, pollIntent(SLIDES[idx])); }); }
})();
