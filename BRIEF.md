# DESIGN REVIEW REQUEST — a 35-minute conference lecture, not code

**Do not use any tools. Answer only from the content below — everything you need is inline.**

This is a **design and plan review**, not a code review. Nothing has been built yet. I want your
**strongest objections**, not validation. If you think the central conceit is wrong, say so
plainly and argue it. A review that concludes "this is solid, here are four small polish items"
is a failed review — I can generate that myself, and it costs a limited daily quota to get it
from you.

---

## Who this is for and why it matters

Thiago is emergency medicine faculty at the University of Missouri. He builds POCUS
(point-of-care ultrasound) teaching material for residents, PAs, NPs and medical students. He is
presenting a **35-minute session at an EM/PA conference** on POCUS pitfalls and mimics — the ways
bedside ultrasound misleads a clinician into the wrong diagnosis.

Stakes: the audience takes this back to real patients. A memorable-but-wrong teaching point is
worse than a forgettable-but-correct one. Simultaneously, a technically flawless talk nobody
remembers has failed at its actual job. Both failure modes are live.

He has an existing library of twelve POCUS lecture decks in a consistent house style (dark teal
and rust, Georgia headlines, white content slides). **This deck deliberately breaks from that
house style** — he asked for a new visual identity for this talk specifically.

---

## Fixed constraints — these are decided, do not re-litigate them

1. **35 minutes total, including Q&A.** Roughly 27 minutes of actual content.
2. **Audience is deliberately mixed** — medical students through practicing attendings, with wildly
   varying POCUS experience. Some scan daily; some only read other people's scan results.
3. **Six live audience polls.** Attendees scan a QR code on arrival and answer on their phones;
   results display live in the deck. Thiago chose six explicitly after being told each costs about
   a minute.
4. **The deck is an HTML web page, presented from a browser**, hosted on Firebase. Not PowerPoint.
   A PowerPoint file is produced as a backup only.
5. **Projected in a dark room. Not distributed as a printed or PDF handout.** So a dark background
   carries no printing penalty.
6. **Roughly 70% of the ultrasound images come from an existing library** Thiago already owns
   (The POCUS Atlas, CC BY-NC-SA). The other 30% must be sourced from open/CC-licensed references.
7. Title: **"Don't Get Burned: When Ultrasound Lies."** Subtitle: "Four ways POCUS will mislead
   you — and how to catch it."

---

## The content architecture I am proposing — "The Four Liars"

Every POCUS miss is framed as one of four things lying to you. The four sections:

| Section | The lie | The rule that saves you |
|---|---|---|
| **1. The Machine Lies** | A physics artifact invents a structure that is not there, or erases one that is | An artifact obeys the ultrasound beam, not the body. Change your angle — real anatomy stays put, an artifact moves. |
| **2. The Body Lies** | Normal anatomy and anatomic variants impersonate disease | Prove it with a second finding. One structure that looks right is not a diagnosis. |
| **3. The Probe Lies** | Acquisition and measurement error — off-axis imaging, incomplete sweeps, measuring the wrong edge | Outer wall to outer wall. Sweep the whole organ. Off-axis makes everything look smaller. |
| **4. The Brain Lies** | Cognitive error — anchoring, satisfaction of search, premature closure | A negative scan answers exactly one question. Name the question before you put the probe down. |

**Why this structure over the alternatives.** Two other framings were considered and rejected:

- *Organ-by-organ* (a pitfall from cardiac, then lung, then gallbladder, then aorta...). Rejected
  because it produces a list, not a mental model. The audience remembers three examples and no
  principle. It is also the structure every other deck in his library already uses.
- *Pure M&M / case-series* (five near-miss stories back to back). Rejected as the sole structure
  because with a mixed-experience audience the novices lack the scaffolding to extract the general
  lesson from a specific story. But the narrative energy is real, so cases are woven *inside* the
  taxonomy rather than replacing it.

**The slide grammar.** Six polls in 27 minutes only works if polling is not an interlude. So each
section's poll **is** that section's case: the poll shows an unknown ultrasound image, the room
votes on the phones, and the reveal *is* the teaching. Each section becomes:

> section divider → poll (= the case) → reveal (= the teaching, 1–2 slides) → the rule

Four sections at roughly 5 minutes each, plus opening and closing bookend polls (~3 min) and ~5
minutes of Q&A. The opening and closing polls use **the same image**, so the room watches its own
answers move over the course of the talk. Total deck ≈ 28 slides.

**Cases are composite vignettes**, clinically realistic and grounded in documented failure modes
from the literature, labeled as composites on the slide, with citations. Not real patients (no PHI
risk), not pure invention.

---

## The visual direction I am proposing

Three candidates were developed. I recommend **A and C combined**, and I am stating that as a
position for you to attack rather than offering you a menu.

**A — "Ember."** Near-black ground (#0E0E11), bone-white type (#EDE7DF). Ember orange (#E2571E)
and amber (#F0A202) carry danger, mimic, and error. A single cold cyan (#3FB8AF) is reserved
**exclusively** for "the truth / the correct finding / the fix" and appears nowhere else. So the
palette itself encodes the lesson: warm is what burned you, cool is what saves you. Ultrasound
images are grayscale and sit well on near-black.

**B — "Burn scale."** Every pitfall rated first-, second- or third-degree by how badly it hurts
the patient, with the whole visual system built on a thermal gradient. Rejected as the primary
system — I judged it cute at the expense of clarity, and the severity rating would need clinical
defensibility it cannot easily earn.

**C — "Duplex."** The deck's structural device is a hard vertical split down the slide:
*what you saw* on one side, *what it actually was* on the other. Every mimic slide uses it.
The layout itself teaches the lesson, and it maps directly onto the poll-then-reveal rhythm.

Typography: a display serif (Fraunces or Instrument Serif) paired with a grotesque body face
(Archivo or Source Sans 3). Deliberately avoiding Inter, Roboto and Arial.

---

## Technical architecture

- The deck is hand-authored HTML/CSS on a fixed 1280x720 stage, scaled to the viewport. Slides are
  absolutely positioned. Keyboard navigation, a speaker-notes overlay, and a slide-grid overview.
- Ultrasound clips are real MP4 video elements (autoplay, loop, muted), not animated GIFs.
- The polling backend is Firebase Firestore with anonymous authentication. The presenter view holds
  a real-time listener on a responses collection and tallies client-side. One response document per
  device prevents double-voting.
- **The deck and the poll are served from the same origin.** This is not an aesthetic choice:
  Firebase authentication does not work from a local file:// page because the origin is null and
  cannot be an authorized domain. Hosting the deck solves that, removes the USB-stick dependency,
  and gives attendees a link afterward.
- A fully local offline copy ships as a fallback. Every poll slide must remain presentable with no
  network — the question and the reveal live in the slide itself, and only the live bar chart needs
  the backend.

---

## Counter-arguments I have already considered and set aside

State plainly if you think I dismissed any of these wrongly.

1. **"Six polls is too many for 35 minutes."** I partly agree, which is why polling was restructured
   to *be* the content rather than sit alongside it. But Thiago chose six after being told the cost,
   and it is his room. I built a documented cut-order instead of overriding him.
2. **"Four sections in 27 minutes is about 5 minutes each — too thin."** Possibly. The counter is
   that the taxonomy is the takeaway; a talk covering two of four liars teaches a fragment of a
   model. A planned Part 2 goes deeper organ-by-organ later.
3. **"A dark deck is a risk on unknown conference projectors."** Real risk — washed-out projectors
   murder low-contrast dark designs. Mitigated by high contrast ratios and by the fact that
   grayscale ultrasound images are themselves dark-background, so a white deck would actually
   create more harsh luminance transitions.
4. **"Breaking the house style loses brand consistency across his library."** Accepted deliberately.
   This is a conference talk to an external audience, not an internal resident lecture.
5. **"Building a custom polling app instead of using Slido or Poll Everywhere is over-engineering."**
   Considered seriously. Free tiers cap responses or question counts, need an account, and require
   an add-in on the presenting machine. He gives many lectures a year and owns a dozen Firebase apps
   already. But I may be underweighting the reliability of a mature commercial product on conference
   wifi versus something built three weeks ago.
6. **"The Four Liars framing is too cute for a clinical audience."** The strongest objection to the
   whole plan, and I want you to push on it specifically. Personifying a machine as "lying" is a
   metaphor, and metaphors can mislead — an artifact is not deception, it is physics behaving
   exactly as expected.

---

## Questions I want answered — numbered, specific

1. **Is "The Four Liars" the right spine**, or is it a memorable frame that will actively distort
   how a novice reasons about ultrasound? Argue the strongest case against it. If you would replace
   it, give me the replacement, not just the objection.
2. **Is the four-way taxonomy actually MECE** for POCUS error? What real failure mode does it fail
   to contain? I am specifically worried about: machine settings (gain, depth, preset) which sit
   awkwardly between "machine" and "probe"; and patient factors (body habitus, bowel gas,
   uncooperative patient) which arguably belong to none of the four.
3. **Does poll-as-case actually work**, or does it break down because a good poll question and a
   good clinical vignette have different shapes — a poll needs a short unambiguous stem with four
   discrete options, and a vignette needs narrative context?
4. **With a mixed audience of students through attendings, does this talk have a floor problem or a
   ceiling problem?** Which group gets served worse by this plan, and what is the cheapest fix?
5. **Attack the warm/cool color semantic.** Is reserving one cyan exclusively for "truth" a real
   cognitive aid, or a designer's conceit the audience will never consciously register — and does
   it survive a projector with poor color reproduction, or a colorblind viewer? Roughly 8% of men
   have a red-green deficiency, and this audience skews toward physicians.
6. **What does this design ignore entirely?** The blind spot question. Assume there is one.
7. **What should I cut?** Not what to add. Name the specific section, slide, feature or phase you
   would delete, and say what gets better as a result.
8. **Where is the single highest risk of this talk failing in the room** — not in the plan, in the
   actual room, on the actual day? Rank the top three failure modes by probability times damage.

---

## What I expect from you

Findings ordered most severe first. Be concrete — name the section, the slide, the specific choice.
Where you object, say what you would do instead. Where you agree, say so in one line and move on;
do not spend words agreeing.

You have a known failure mode of over-prescribing — recommending more structure, more process, more
scaffolding than a 35-minute lecture warrants. If you catch yourself proposing something that would
take longer to implement than the talk takes to deliver, flag it yourself as oversized and say so.

One thing to note: any **clinical content** — a measurement cutoff, a diagnostic claim, a statement
about what a finding means — you should flag for human verification rather than judge yourself.
Thiago verifies those against primary literature. Do not certify clinical facts as correct, and do
not treat your own agreement with a clinical claim as evidence that it is right.
