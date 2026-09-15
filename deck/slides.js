/* ============================================================
   Don't Get Burned: When Ultrasound Lies — slide content
   35 min · EM Conference · 8 live polls

   CLINICAL CONTENT POLICY
   - Every vignette is a COMPOSITE, labeled as such on the slide.
   - Every teaching claim is scoped on the slide itself, not left
     as a portable maxim. (Codex: "their wording invites application
     outside that application.")
   - `verify` on a slide lists claims Thiago must check against a
     primary source before presenting. These are NOT certified by
     Claude, Codex or Gemini.
   ============================================================ */

export const MEETING = {
  org:      "Mizzou Emergency Medicine",
  event:    "EM Conference",
  date:     "",                                  // intentionally blank - not shown
  presenter:"Thiago DeSouza, M.D.",
  joinCode: "BURN-7K4Q",
  joinUrl:  "mizzou-pocus-live.web.app"          // must match the real host, see note below
};

const M = "media/";

export const SLIDES = [

/* ---------- TITLE ---------- */

{ id:"title", type:"title", label:"Title",
  h1:["Don't Get Burned:", "When Ultrasound Lies"],
  sub:"Four questions that keep a bedside scan honest.",
  spine:[
    "Did I obtain an adequate examination?",
    "What am I actually seeing?",
    "What does this finding establish?",
    "What remains unanswered?"
  ],
  notes:[
    "Open cold. Do not explain the structure yet — the join slide comes next and people are still sitting down.",
    "One line only: 'Everything in this talk is a scan that looked fine.'"
  ]
},


/* ---------- JOIN ---------- */

{ id:"join", type:"join", label:"Join / QR",
  note:"Eight polls today. Nothing is recorded, nothing identifies you — the point is to see what a room of clinicians actually does with an ambiguous image.",
  notes:[
    "Give this a full 45 seconds. Late arrivals are still coming in — this is the cheapest place to spend that time.",
    "Say out loud: 'If the wifi is bad, we do it by hands. Nothing here depends on your phone.'",
    "Have the show-of-hands fallback ready — press O on any poll slide to switch it to hands mode."
  ]
},


/* ---------- THE SPINE ---------- */

{ id:"spine", type:"spine", label:"Four questions",
  eyebrow:"The spine of this talk",
  h2:["Four questions — asked ", "before", " you trust the scan, not after it burned you."],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],
  foot:{ lab:"Why not “the four liars”",
    p:"“Which one fooled me?” is a question you ask afterwards. These four you can ask with the probe still on the patient." },
  notes:[
    "This is the only framework slide in the deck. 60 seconds, then move.",
    "The joke lands: 'I was going to call these the Four Liars. Then I realised the machine has never lied to me once — it does exactly what physics says, every time.'",
    "Point out that Q1 comes first deliberately: you cannot interpret what you never acquired."
  ]
},


/* ========== §1 · ADEQUATE EXAMINATION ========== */

{ id:"p1", type:"poll", label:"Poll 1 — distal aorta", poll:1,
  orient:["Abdominal aorta","Transverse","Proximal"],
  media:{ src:M+"aorta_proximal_transverse_seagull_normal.mp4", kind:"video",
          tag:"Live clip · proximal aorta, transverse" },
  stem:"71M, sudden tearing back pain, BP 104/62. The proximal aorta looks like this. Below the umbilicus, bowel gas obscures the vessel completely.",
  ask:"What goes in the chart?",
  options:[
    "Nondiagnostic distal segment — needs CT",
    "No AAA — negative study",
    "Normal caliber proximally, low suspicion"
  ],
  correct:0, trapped:1,
  results:[34,52,14],
  notes:[
    "This is the whole first section in one question. Let them commit before you say anything.",
    "The trap is the 'negative study' answer, and in most rooms it wins. That is the point — it is the most natural charting behavior in the world.",
    "Do not shame it. Say: 'that is what the chart template invites you to write.'"
  ]
},

{ id:"r1", type:"reveal", label:"Reveal 1 — inadequate ≠ negative", poll:1,
  orient:["Abdominal aorta","Transverse","Proximal"],
  media:{ src:M+"aorta_proximal_transverse_seagull_normal.mp4", kind:"video",
          tag:"Same clip · the segment you could see" },
  stem:"71M, tearing back pain, BP 104/62.",
  options:[
    "Nondiagnostic distal segment — needs CT",
    "No AAA — negative study",
    "Normal caliber proximally, low suspicion"
  ],
  correct:0, trapped:1, results:[34,52,14],
  takeaway:{
    lab:"Bounded takeaway",
    p:"Abdominal aortic aneurysms are predominantly <b>infrarenal</b> — the segment bowel gas hides is the segment that matters most.",
    scope:"Scope: this is about charting. A non-visualized segment is missing data, not reassuring data. The next step depends on your pre-test probability, not on this rule."
  },
  notes:[
    "Land the distinction hard: 'negative' and 'nondiagnostic' are different words and they belong in different charts.",
    "This is the answer the rest of the talk keeps returning to. If they remember one thing, make it this.",
    "Offer the phrasing they can actually use: 'Aorta visualized to the level of X; distal segment obscured by bowel gas; not excluded by POCUS.'"
  ],
  verify:[
    "Proportion / predominance of AAA that is infrarenal — check against a current vascular surgery or ACEP source before stating a figure.",
    "Whether you want to commit to a specific next step (CT vs repeat vs formal) or leave it pre-test-probability dependent."
  ]
},

{ id:"spine1", type:"spine", label:"Question 01 marker", highlight:0,
  eyebrow:"Question 01 of 4",
  h2:["Did I obtain an ", "adequate examination", "?"],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],
  foot:{ lab:"Coming up", p:"Three studies that get charted as negative — and the chart entry that turns missing data into reassuring data." },
  notes:[
    "A beat to place what just happened on the map. 15 seconds — point at the lit card and move.",
    "If you are running behind, skip straight past this one; nothing downstream depends on it."
  ]
},

{ id:"t1", type:"cmp3", label:"Three inadequate studies",
  eyebrow:"Question 01 · Adequate examination",
  h2:["Three studies that get charted as ", "negative", ""],
  cells:[
    { kind:"video", src:M+"appendix_retrocecal.mp4", tone:"trap", mk:"✕",
      t:"Appendix not visualized", d:"Non-visualization does not exclude appendicitis. Retrocecal position is common and the appendix simply may not be reachable." },
    { kind:"video", src:M+"efast_luq_free_fluid_subtle.mp4", tone:"trap", mk:"✕",
      t:"LUQ stopped too low", d:"Fluid collects above the spleen before Morison's fills. A LUQ view that never clears the diaphragm is an incomplete window." },
    { kind:"video", src:M+"dvt_popliteal_compression_normal.mp4", tone:"check", mk:"✓",
      t:"Full wall apposition", d:"This is what adequate compression looks like — walls fully touching. Anything less is an uninterpretable segment, not a negative one." }
  ],
  notes:[
    "Rapid — 20 seconds each, no more. These are illustrations, not cases.",
    "The through-line: in all three, the honest chart entry is 'not assessed', and in all three the tempting entry is 'normal'.",
    "If you are running long, cut the middle cell."
  ],
  verify:["Retrocecal appendix frequency, if you quote a number."]
},


/* ========== §2 · WHAT AM I SEEING ========== */

{ id:"p2", type:"poll", label:"Poll 2 — pyramids", poll:2,
  orient:["Right kidney","Long axis",""],
  media:{ src:M+"renal_medullary_pyramids_normal.mp4", kind:"video", tag:"Live clip · right kidney, long" },
  stem:"24F, right flank pain, microscopic hematuria on dip. Your registrar calls this mild hydronephrosis.",
  ask:"Do you agree?",
  options:[
    "Yes — mild hydronephrosis",
    "Can't tell from this view",
    "No — normal medullary pyramids"
  ],
  correct:2, trapped:0, results:[44,18,38],
  notes:[
    "The most common false positive in renal POCUS, and it catches experienced people when the kidney is well hydrated.",
    "Let C be respectable — 'can't tell' is never the wrong instinct in this talk."
  ]
},

{ id:"r2", type:"reveal", label:"Reveal 2 — pyramids", poll:2,
  orient:["Right kidney","Long axis",""],
  media:{ src:M+"renal_medullary_pyramids_normal.mp4", kind:"video", tag:"Same clip · annotated" },
  stem:"24F, right flank pain.",
  options:[
    "Yes — mild hydronephrosis",
    "Can't tell from this view",
    "No — normal medullary pyramids"
  ],
  correct:2, trapped:0, results:[44,18,38],
  takeaway:{
    lab:"The check",
    p:"Pyramids are <b>discrete, evenly spaced and peripheral</b>. Hydronephrosis is <b>continuous and branching</b> — the spaces interconnect and run toward the pelvis.",
    scope:"Scope: this separates pyramids from hydronephrosis. It does not grade hydronephrosis, and a well-hydrated patient can have mild fullness that is real."
  },
  notes:[
    "Two structural checks, both free: do the dark spaces connect to each other, and do they reach the renal pelvis?",
    "Color Doppler is the third check — pyramids sit between the arcuate vessels; fluid has no flow.",
    "Bilateral comparison is the cheapest check of all and almost nobody does it."
  ],
  verify:["Whether you want to include a hydronephrosis grading scale, and which one."]
},

{ id:"p3", type:"poll", label:"Poll 3 — CBD", poll:3,
  orient:["Porta hepatis","Long axis",""],
  media:{ src:M+"gb_portal_triad_normal.mp4", kind:"video", tag:"Live clip · porta hepatis" },
  stem:"58F, RUQ pain, mildly raised ALP. You find a tubular structure running anterior to the portal vein and measure it at 7 mm.",
  ask:"Dilated common bile duct?",
  options:[ "Yes — dilated CBD, send LFTs and arrange MRCP", "Put color on it before deciding", "No — 7 mm is within normal" ],
  correct:1, trapped:0, results:[41,37,22],
  notes:[
    "Classic. The hepatic artery runs in exactly the same place and looks exactly the same in B-mode.",
    "The '7 mm is normal' answer is a quieter trap — 'normal' thresholds shift with age and cholecystectomy."
  ]
},

{ id:"r3", type:"reveal", label:"Reveal 3 — put color on it", poll:3,
  orient:["Porta hepatis","Long axis",""],
  media:{ src:M+"gb_portal_triad_doppler_normal.mp4", kind:"video", tag:"Same window · color Doppler" },
  stem:"58F, RUQ pain.",
  options:[ "Yes — dilated CBD, LFTs + MRCP", "Put color on it before deciding", "No — 7 mm is within normal" ],
  correct:1, trapped:0, results:[41,37,22],
  takeaway:{
    lab:"The check",
    p:"It fills with color. That is the <b>hepatic artery</b>, not the duct. The CBD is the tube in the triad <b>without</b> flow.",
    scope:"Scope: color separates vessel from duct. It does not tell you whether a genuinely dilated duct is obstructed — and normal CBD caliber varies with age and prior cholecystectomy."
  },
  notes:[
    "This is the single cheapest check in the deck — one button, one second, and it converts a guess into an answer.",
    "Make the general point here: when two structures are indistinguishable in B-mode, stop looking harder in B-mode.",
    "Tie back to Q2: 'what am I seeing' is often answered by changing the question you ask the machine, not by squinting."
  ],
  verify:[
    "Normal CBD upper limit and how you want to handle the age / post-cholecystectomy adjustment — this is the classic contested number.",
    "Whether to state a specific measurement threshold at all, given the mixed audience."
  ]
},

{ id:"spine2", type:"spine", label:"Question 02 marker", highlight:1,
  eyebrow:"Question 02 of 4",
  h2:["What am I ", "actually seeing", "?"],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],
  foot:{ lab:"Coming up", p:"Normal anatomy wearing the costume of disease — and the cheapest check that separates them." },
  notes:[
    "A beat to place what just happened on the map. 15 seconds — point at the lit card and move.",
    "If you are running behind, skip straight past this one; nothing downstream depends on it."
  ]
},

{ id:"t2", type:"cmp3", label:"Mimic gallery",
  eyebrow:"Question 02 · What am I seeing",
  h2:["Three more that look ", "exactly", " like the thing you fear"],
  cells:[
    { kind:"video", src:M+"iv_carotid_vs_ij_doppler.mp4", tone:"check", mk:"✓",
      t:"Carotid vs IJ", d:"Compress before you puncture. The vein flattens; the artery does not. Position alone has fooled experienced operators." },
    { kind:"video", src:M+"dvt_superficial_thrombophlebitis.mp4", tone:"trap", mk:"✕",
      t:"Superficial, not deep", d:"Clot in the great saphenous is not a DVT. Know which vein you are on before you commit to anticoagulation." },
    { kind:"video", src:M+"renal_simple_cyst.mp4", tone:"trap", mk:"✕",
      t:"Cyst, not hydronephrosis", d:"A peripheral simple cyst is round, does not branch, and does not communicate with the collecting system." }
  ],
  notes:[
    "Fast gallery — these are recognition reps, not cases. 20 seconds each.",
    "Carotid/IJ is the one the PAs in the room will use tonight.",
    "Saphenous point is worth 10 extra seconds — the management divergence is large and the images are nearly identical."
  ],
  verify:["Current management of superficial thrombophlebitis / saphenofemoral junction proximity thresholds — this has changed and varies by guideline."]
},


/* ========== §3 · WHAT DOES IT ESTABLISH ========== */

{ id:"p4", type:"poll", label:"Poll 4 — 4.1 cm", poll:4,
  orient:["Abdominal aorta","Transverse","Infrarenal"],
  media:{ src:M+"aorta_mural_thrombus.mp4", kind:"video", tag:"Live clip · aorta, transverse" },
  stem:"78M, tearing back pain, BP 88/52. Your on-screen measurement reads <b>4.1 cm</b>.",
  ask:"What do you do next?",
  options:[ "Not an aneurysm — look for another cause", "Activate vascular surgery now", "Re-measure before deciding either way" ],
  correct:2, trapped:0, results:[47,22,31],
  notes:[
    "Hypotension plus back pain plus a number below threshold is exactly the combination that produces a fatal discharge.",
    "Hold the reveal. Let someone say out loud why they would re-measure."
  ]
},

{ id:"r4", type:"reveal", label:"Reveal 4 — measure the wall", poll:4,
  orient:["Abdominal aorta","Transverse","Infrarenal"],
  media:{ src:M+"aorta_mural_thrombus_doppler.mp4", kind:"video", tag:"Same patient · color Doppler" },
  stem:"78M, tearing back pain, BP 88/52.",
  options:[ "Not an aneurysm", "Activate now", "Re-measure first" ],
  correct:2, trapped:0, results:[47,22,31],
  takeaway:{
    lab:"Bounded takeaway",
    p:"Mural thrombus is nearly anechoic. Measuring the flow lumen understated this aorta by <b>1.8 cm</b>.",
    scope:"Scope: outer-wall-to-outer-wall is the convention <b>for the aorta</b>. Gallbladder wall is measured anterior-wall-only and IVC inner-to-inner — do not carry this rule across."
  },
  notes:[
    "Color makes the thrombus obvious, but you should not need color — the wall is visible in B-mode if you look for it rather than at the black.",
    "The scope line matters. Say it out loud; do not let 'outer wall to outer wall' leave this room as a universal maxim.",
    "This is the slide where Q3 lands: the number established less than it appeared to."
  ],
  verify:[
    "AAA measurement convention (outer-to-outer) and current threshold figures — confirm against a primary source.",
    "The 1.8 cm delta is illustrative of this clip; confirm it reads correctly against the images before presenting.",
    "GB wall and IVC measurement conventions as stated in the scope line."
  ]
},

{ id:"p4b", type:"poll", label:"Poll 5 — B-lines", poll:5,
  orient:["Lung","Right anterior apical",""],
  media:{ src:M+"thoracic_blines_diffuse.mp4", kind:"video", tag:"Live clip · anterior lung" },
  stem:"71F, breathless since midnight, crackles to the mid-zones, BP 152/94. You find this pattern on the right anterior apical lung.",
  ask:"Give furosemide?",
  options:[
    "Look at the pleural line and the distribution first",
    "Yes — that is pulmonary edema, treat it",
    "No — B-lines are too non-specific to act on"
  ],
  correct:0, trapped:[1,2],
  results:[33,46,21],
  notes:[
    "Everyone here has seen B-lines, and most have treated them as a synonym for failure.",
    "One answer over-reads the finding, the other dismisses it entirely. Both skip the same step.",
    "Do not let this turn into a discussion about diuretic dosing — the point is what the finding does and does not tell you."
  ]
},

{ id:"r4b", type:"reveal", label:"Reveal 5 — a pattern, not a diagnosis", poll:5,
  orient:["Lung","Right middle zone","Different patient"],
  media:{ src:M+"thoracic_blines_focal.mp4", kind:"video",
          tag:"Different patient · focal, right middle zone" },
  stem:"71F, breathless, crackles to mid-zones. Composite case.",
  options:[
    "Check the pleural line and distribution",
    "Pulmonary edema — treat it",
    "Too non-specific to act on"
  ],
  correct:0, trapped:[1,2], results:[33,46,21],
  takeaway:{
    lab:"Bounded takeaway",
    p:"B-lines tell you there is <b>interstitial fluid</b>. They do not tell you why it is there. This clip is focal and confined to one zone — a different problem from the one the treat-it-as-edema answer assumed.",
    scope:"Scope: distribution and pleural-line appearance help separate cardiogenic from pneumonic or inflammatory causes. They are a discriminator, not a treatment rule — and a patient can have both at once."
  },
  notes:[
    "The discriminator worth naming: diffuse, bilateral and gravity-dependent leans cardiogenic; focal or patchy with an irregular, thickened pleural line leans pneumonia or ARDS.",
    "Say the uncomfortable part out loud — a breathless elderly patient can be in failure AND have a pneumonia, and the scan will not adjudicate that for you.",
    "COMPOSITE — say so."
  ],
  verify:[
    "The distribution / pleural-line discriminator between cardiogenic and non-cardiogenic B-lines — confirm the wording against a current lung-ultrasound source.",
    "Lung zone nomenclature, if you name zones out loud.",
    "Zone on the poll clip is per your own identification (right anterior apical); the reveal clip is machine-annotated RIGHT MIDDLE. Both are now stated on the slides."
  ]
},

{ id:"spine3", type:"spine", label:"Question 03 marker", highlight:2,
  eyebrow:"Question 03 of 4",
  h2:["What does this finding ", "establish", "?"],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],
  foot:{ lab:"Coming up", p:"Findings that raise your suspicion, and what it costs to treat them as confirmation." },
  notes:[
    "A beat to place what just happened on the map. 15 seconds — point at the lit card and move.",
    "If you are running behind, skip straight past this one; nothing downstream depends on it."
  ]
},

{ id:"t3", type:"cmp3", label:"Non-specific findings",
  eyebrow:"Question 03 · What does it establish",
  h2:["Findings that ", "support", " — and don't establish"],
  cells:[
    { kind:"img", src:M+"efast_pneumothorax_barcode_mmode.jpg", tone:"trap", mk:"✕",
      t:"Absent sliding", d:"Barcode sign means the pleura isn't moving. Mainstem intubation, bullae, pleurodesis, ARDS and apnoea all do that too." },
    { kind:"video", src:M+"efast_pneumothorax_lung_point.mp4", tone:"check", mk:"✓",
      t:"Lung point", d:"The transition between sliding and absent sliding is the specific sign. Absent sliding alone is the sensitive one." },
    { kind:"video", src:M+"heart_rv_strain_mcconnell.mp4", tone:"trap", mk:"✕",
      t:"RV strain pattern", d:"Right heart strain raises your suspicion of PE. It does not confirm it — RV infarct and chronic pulmonary hypertension produce similar appearances." }
  ],
  notes:[
    "Sensitive vs specific, made concrete. Most of the room knows these words and has never had them attached to two images side by side.",
    "The lung point is the money image — if you have time for one thing in this section, make them look at the transition.",
    "McConnell's: be careful how you word this. Raise suspicion, do not confirm."
  ],
  verify:[
    "Test characteristics of absent lung sliding and lung point — if you quote sensitivity/specificity, source them.",
    "McConnell's sign specificity for PE and the RV-infarct mimic — this is genuinely contested in the literature, so word it carefully or cite."
  ]
},


/* ========== §4 · WHAT REMAINS UNANSWERED ========== */

{ id:"p5", type:"poll", label:"Poll 6 — first window", poll:6,
  orient:["FAST","RUQ","Morison's pouch"],
  media:{ src:M+"efast_morrison_free_fluid.mp4", kind:"video", tag:"Live clip · Morison's pouch" },
  stem:"26M, motorcycle crash, HR 118, BP 102/64. This is your <b>first</b> window.",
  ask:"What do you do next?",
  options:[ "Positive FAST — you have your answer, call the surgeon", "Finish every window, including both lung fields", "Repeat the RUQ to be sure" ],
  correct:1, trapped:0, results:[38,45,17],
  notes:[
    "A rare poll where the room mostly gets it right — and that is useful. It sets up the fact that knowing the answer and doing it under pressure are different.",
    "Ask for a show of hands on a second question: 'who has actually stopped early?' Far more honest than the poll."
  ]
},

{ id:"r5", type:"reveal", label:"Reveal 6 — satisfaction of search", poll:6,
  orient:["FAST","Thoracic window","Same patient"],
  media:{ src:M+"efast_hemothorax.mp4", kind:"video", tag:"Same patient · the window nobody got to" },
  stem:"26M, motorcycle crash. Composite case.",
  options:[ "Positive FAST — call the surgeon", "Finish every window", "Repeat the RUQ" ],
  correct:1, trapped:0, results:[38,45,17],
  takeaway:{
    lab:"Bounded takeaway",
    p:"There was blood in the chest as well. A positive finding is the most reliable way to end a search early — <b>satisfaction of search</b> is not a knowledge failure, it is what finding something does to attention.",
    scope:"Scope: this is about completing the exam you started. It does not mean every unstable trauma patient gets a full eFAST before intervention — that is a resuscitation judgement."
  },
  notes:[
    "Name it out loud: free fluid in Morison's AND a hemothorax. One was found, one was never looked for.",
    "Say plainly: this is not about knowing less. The people who stop early are the ones who found something, which is to say the ones doing it right.",
    "Design answer, not a willpower answer — build the window list into the machine preset or the chart template so completion is structural.",
    "COMPOSITE — say so."
  ],
  verify:[
    "Which eFAST window you want to credit the hemothorax to, and how you describe finding it (cephalad off the RUQ vs a dedicated thoracic view).",
    "Whether you want to name a volume threshold for a clinically significant hemothorax - if so, source it."
  ]
},

{ id:"p5b", type:"poll", label:"Poll 7 — standstill", poll:7,
  orient:["Cardiac","Rhythm-check pause",""],
  media:{ src:M+"heart_cardiac_standstill.mp4", kind:"video", tag:"Live clip · during the pause" },
  stem:"58M, witnessed arrest, PEA on the monitor. You scan during the rhythm-check pause and see this.",
  ask:"Does this end the resuscitation?",
  options:[
    "Yes — standstill. Call it",
    "No — imaging should not influence this at all",
    "It informs the decision. It does not make it"
  ],
  correct:2, trapped:[0,1],
  results:[39,17,44],
  notes:[
    "The heaviest slide in the deck. Slow down and let the room sit with it.",
    "One answer lets a single loop carry a decision it cannot carry. The other refuses to use information you already have.",
    "Worth saying plainly: the people who reach for 'call it' are not careless — they are looking for permission, and an image feels like permission."
  ]
},

{ id:"r5b", type:"reveal", label:"Reveal 7 — prognostic, not dispositive", poll:7,
  orient:["Cardiac","Parasternal long axis","Different patient"],
  media:{ src:M+"heart_reduced_lv_function.mp4", kind:"video",
          tag:"Different patient · severely reduced, but not standstill" },
  stem:"58M, witnessed arrest. Composite case.",
  options:[
    "Standstill — call it",
    "Imaging should not influence this",
    "It informs the decision, it does not make it"
  ],
  correct:2, trapped:[0,1], results:[39,17,44],
  takeaway:{
    lab:"All four questions, under pressure",
    p:"Sonographic standstill is strongly associated with non-survival — but it is <b>prognostic, not dispositive</b>. Severely reduced function, like this clip, can read as standstill on a brief, off-axis or low-frame-rate look.",
    scope:"Scope: this is about how much weight one clip carries inside a resuscitation decision. It is not a termination-of-efforts rule, and scanning lengthens the pause — which carries its own cost."
  },
  notes:[
    "Q1 adequate? A few seconds, one window, during a pause, on a moving patient. The least adequate scan in the whole talk.",
    "Q2 what am I seeing? Absent motion — or motion too subtle for this frame rate and this window.",
    "Q3 what does it establish? A poor prognosis. Not a decision.",
    "Q4 what remains unanswered? Every reversible cause not yet excluded, and what the pause itself cost.",
    "Close cleanly and move on — do not let this become a debate about termination policy.",
    "COMPOSITE — say so."
  ],
  verify:[
    "The association between sonographic standstill and survival — decide whether to cite a figure or keep it qualitative, and source it either way.",
    "The claim that ultrasound during arrest lengthens pause duration — well described, but confirm your phrasing.",
    "Whether your institution has a termination-of-resuscitation protocol you should reference rather than leaving this open."
  ]
},

{ id:"spine4", type:"spine", label:"Question 04 marker", highlight:3,
  eyebrow:"Question 04 of 4",
  h2:["What remains ", "unanswered", "?"],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"Bowel gas, habitus, incomplete sweeps. An inadequate study is not a negative study." },
    { n:"02", t:"What am I actually seeing?",
      d:"Artifact and anatomic mimic together — at the bedside you can't separate them by category." },
    { n:"03", t:"What does this finding establish?",
      d:"A finding supports a conclusion. It rarely establishes one on its own." },
    { n:"04", t:"What remains unanswered?",
      d:"The question you never asked is the one that reaches the patient." }
  ],
  foot:{ lab:"Coming up", p:"The scan that reassures you — and the question you never got round to asking." },
  notes:[
    "A beat to place what just happened on the map. 15 seconds — point at the lit card and move.",
    "If you are running behind, skip straight past this one; nothing downstream depends on it."
  ]
},

{ id:"t4", type:"cmp2", label:"The scan that reassures",
  eyebrow:"Question 04 · What remains unanswered",
  h2:["The most dangerous scan is the one that ", "reassures you", ""],
  cells:[
    { kind:"video", src:M+"efast_ruq_normal.mp4", tone:"trap", mk:"✕",
      t:"A negative FAST", d:"Answers one question: is there free fluid visible now. It does not exclude solid-organ injury, retroperitoneal bleeding, or an injury that hasn't bled yet. It is a snapshot, and it expires." },
    { kind:"video", src:M+"aorta_proximal_long_axis_celiac_sma_normal.mp4", tone:"trap", mk:"✕",
      t:"A normal aorta", d:"Answers one question: is there an aneurysm at this level. A dissection can sit entirely above the diaphragm, where this window never reaches. You screened for the wrong thing and got a reassuring answer to it." }
  ],
  notes:[
    "Both of these feel like answers. That is exactly why they are in the last section.",
    "'It is a snapshot, and it expires' — repeat that line, it is the one people write down.",
    "On the aorta: point out that the proximal view is about as high as this window reaches. Everything above it was never examined, and the chart rarely says so.",
    "Bring it back to Q4: before you put the probe down, say out loud what you still do not know."
  ],
  verify:[
    "Negative FAST test characteristics, if you quote them.",
    "How you want to state the limits of abdominal aortic POCUS for dissection — the sensitivity of a bedside abdominal view for a dissection flap is low and worth wording carefully rather than quoting a figure.",
    "Whether to mention the suprasternal or parasternal views as partial answers to the thoracic question, or leave that out to save time."
  ]
},


/* ---------- CLOSING POLL ---------- */

{ id:"p6", type:"poll", label:"Poll 8 — closing", poll:8,
  orient:["Cardiac","Parasternal short axis",""],
  media:{ src:M+"heart_pericardial_effusion_small.mp4", kind:"video",
          tag:"Live clip \u00b7 parasternal short axis" },
  stem:"64M, BP 84/50, HR 124, breathless and clammy. You put the probe on and there is a pericardial effusion.",
  ask:"Does this effusion explain his shock?",
  options:[
    "Size will not tell you — go looking for tamponade physiology",
    "Yes — that is the cause. Prepare for pericardiocentesis",
    "No — far too small to cause shock"
  ],
  correct:0, trapped:[1,2],
  results:[41,34,25],
  notes:[
    "Final poll. A NEW image applying all four questions \u2014 nothing they have seen before.",
    "Say nothing before the vote. The stem is deliberately written so that finding the effusion feels like solving the case.",
    "Watch the split. In most rooms both confident answers draw votes, and that is the whole point \u2014 two opposite errors from the same mistake.",
    "COMPOSITE \u2014 say so."
  ]
},

{ id:"r6", type:"reveal", label:"Reveal 8 \u2014 size is not physiology", poll:8,
  orient:["Cardiac","Four-chamber","Different patient"],
  media:{ src:M+"heart_tamponade_rv_collapse.mp4", kind:"video",
          tag:"Different patient \u00b7 what tamponade actually looks like" },
  stem:"64M, BP 84/50. Composite case.",
  options:[
    "Look for tamponade physiology",
    "That is the cause — drain it",
    "Too small to matter"
  ],
  correct:0, trapped:[1,2], results:[41,34,25],
  takeaway:{
    lab:"All four questions, one image",
    p:"<b>Both confident answers are wrong, in opposite directions.</b> Effusion size does not establish tamponade \u2014 physiology does. An effusion that collected fast can tamponade while small; a large chronic one often does not.",
    scope:"Scope: this is about whether the effusion explains <b>this</b> patient's shock. Look for RV diastolic collapse, a plethoric IVC and respirophasic inflow variation. It is not a threshold for drainage, and it does not replace formal echo."
  },
  notes:[
    "This is the payoff slide. Walk the four questions out loud on one image:",
    "Q1 adequate? One window, one plane. You have not looked at the IVC and you have no second view.",
    "Q2 what am I seeing? A pericardial effusion \u2014 that part is not in doubt.",
    "Q3 what does it establish? That fluid is present. Not that it is the cause of the shock.",
    "Q4 what remains unanswered? Every other cause of shock in a breathless hypotensive 64-year-old.",
    "Land the ending on the trap that catches experienced people: one error is eager, the other complacent, and both come from reading size instead of physiology.",
    "COMPOSITE \u2014 say so."
  ],
  verify:[
    "RV diastolic collapse, IVC plethora and respirophasic variation as the signs you want to name \u2014 confirm the list and wording against a current source.",
    "The rapid-accumulation point (small effusion can tamponade, large chronic may not) \u2014 well established, but confirm how you want to phrase it.",
    "The view label on the reveal clip: the poll clip is annotated PSSA by the machine, but the tamponade clip carries no view annotation and I have labeled it conservatively. Correct it if you recognize the window.",
    "Consider adding an annotation ring over the collapsing RV on the reveal clip once you have confirmed the chamber \u2014 I did not place one rather than guess at the anatomy."
  ]
},


/* ---------- TAKE-HOME ---------- */

{ id:"home", type:"spine", label:"Take-home", cardText:"all",
  eyebrow:"Take this to your next shift",
  h2:["Four questions. ", "Ask them out loud", "."],
  cards:[
    { n:"01", t:"Did I obtain an adequate examination?",
      d:"If a segment was not seen, the chart says not seen — never normal." },
    { n:"02", t:"What am I actually seeing?",
      d:"When B-mode can't separate two structures, change the question: color, compression, a second plane." },
    { n:"03", t:"What does this finding establish?",
      d:"Sensitive is not specific. Say which one you have before you act on it." },
    { n:"04", t:"What remains unanswered?",
      d:"Before the probe goes down, say out loud what you still don't know." }
  ],
  foot:{ lab:"The one line",
    p:"Every scan in this talk looked fine. The difference was never a better image — it was a better question." },
  notes:[
    "Slow down. This is the photographable slide — pause long enough for phones.",
    "Do not add new content here. Land the four and stop.",
    "Then straight to questions; do not read the references aloud."
  ]
},


/* ---------- REFERENCES ---------- */

{ id:"refs", type:"refs", label:"References",
  eyebrow:"References & attribution",
  h2:["Where this ", "came from", ""],
  cols:[
    { h:"Images & clips", items:[
      "All ultrasound clips and stills: <b>The POCUS Atlas</b> (thepocusatlas.com), used under CC BY-NC-SA 4.0.",
      "Clips are unmodified; annotations are overlaid at presentation time and are not part of the source images.",
      "Teaching library curated by the Mizzou EM Emergency Ultrasound Division."
    ]},
    { h:"Cases & caveats", items:[
      "<b>Every vignette in this talk is a composite.</b> They are constructed to be clinically realistic and are not drawn from identifiable patients.",
      "Poll distributions shown during the talk are this room's live responses.",
      "Measurement conventions, thresholds and test characteristics should be confirmed against your own institutional protocols before use."
    ]}
  ],
  attrib:"Mizzou Emergency Medicine · Emergency Ultrasound Division — questions and corrections welcome.",
  notes:[
    "Do not read this slide. Leave it up during Q&A.",
    "The POCUS Atlas attribution is a licence requirement, not a courtesy — it stays on screen."
  ]
},

];
