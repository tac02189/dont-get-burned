import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(p, "utf8");

const START = `/* ---------- CLOSING POLL — unseen application ---------- */`;
const END   = `/* ---------- TAKE-HOME ---------- */`;

const i0 = s.indexOf(START), i1 = s.indexOf(END);
if (i0 < 0 || i1 < 0) { console.error("poll 6 block markers not found"); process.exit(1); }

const BLOCK = `/* ---------- CLOSING POLL — unseen application ---------- */

{ id:"p6", type:"poll", label:"Poll 6 — closing", poll:6,
  orient:["Cardiac","Parasternal short axis",""],
  media:{ src:M+"heart_pericardial_effusion_small.mp4", kind:"video",
          tag:"Live clip \\u00b7 parasternal short axis" },
  stem:"64M, BP 84/50, HR 124, breathless and clammy. You put the probe on and there is a pericardial effusion.",
  ask:"Does this effusion explain his shock?",
  options:[
    "Yes \\u2014 that is the cause. Prepare for pericardiocentesis",
    "Size will not tell you \\u2014 go looking for tamponade physiology",
    "No \\u2014 far too small to cause shock"
  ],
  correct:1, trapped:[0,2],
  results:[34,41,25],
  notes:[
    "Final poll. A NEW image applying all four questions \\u2014 nothing they have seen before.",
    "Say nothing before the vote. The stem is deliberately written so that finding the effusion feels like solving the case.",
    "Watch the split. In most rooms A and C both draw votes, and that is the whole point \\u2014 two opposite errors from the same mistake.",
    "COMPOSITE \\u2014 say so."
  ]
},

{ id:"r6", type:"reveal", label:"Reveal 6 \\u2014 size is not physiology", poll:6,
  orient:["Cardiac","Four-chamber","Different patient"],
  media:{ src:M+"heart_tamponade_rv_collapse.mp4", kind:"video",
          tag:"Different patient \\u00b7 what tamponade actually looks like" },
  stem:"64M, BP 84/50. Composite case.",
  options:[
    "That is the cause \\u2014 drain it",
    "Look for tamponade physiology",
    "Too small to matter"
  ],
  correct:1, trapped:[0,2], results:[34,41,25],
  takeaway:{
    lab:"All four questions, one image",
    p:"<b>A and C are both wrong, in opposite directions.</b> Effusion size does not establish tamponade \\u2014 physiology does. An effusion that collected fast can tamponade while small; a large chronic one often does not.",
    scope:"Scope: this is about whether the effusion explains <b>this</b> patient's shock. Look for RV diastolic collapse, a plethoric IVC and respirophasic inflow variation. It is not a threshold for drainage, and it does not replace formal echo."
  },
  notes:[
    "This is the payoff slide. Walk the four questions out loud on one image:",
    "Q1 adequate? One window, one plane. You have not looked at the IVC and you have no second view.",
    "Q2 what am I seeing? A pericardial effusion \\u2014 that part is not in doubt.",
    "Q3 what does it establish? That fluid is present. Not that it is the cause of the shock.",
    "Q4 what remains unanswered? Every other cause of shock in a breathless hypotensive 64-year-old.",
    "Land the ending on the trap that catches experienced people: A is the eager error, C is the complacent one, and both come from reading size instead of physiology.",
    "COMPOSITE \\u2014 say so."
  ],
  verify:[
    "RV diastolic collapse, IVC plethora and respirophasic variation as the signs you want to name \\u2014 confirm the list and wording against a current source.",
    "The rapid-accumulation point (small effusion can tamponade, large chronic may not) \\u2014 well established, but confirm how you want to phrase it.",
    "The view label on the reveal clip: the poll clip is annotated PSSA by the machine, but the tamponade clip carries no view annotation and I have labelled it conservatively. Correct it if you recognise the window.",
    "Consider adding an annotation ring over the collapsing RV on the reveal clip once you have confirmed the chamber \\u2014 I did not place one rather than guess at the anatomy."
  ]
},

`;

s = s.slice(0, i0) + BLOCK + s.slice(i1);
writeFileSync(p, s);
console.log("poll 6 swapped: interstitial ectopic -> small effusion in shock");
console.log("  trapped is now an array [0,2] - both A and C are marked as traps");
