# Don't Get Burned: When Ultrasound Lies

Live deck: **https://mizzou-pocus-live.web.app**
Phone client: **https://mizzou-pocus-live.web.app/j?c=BURN-7K4Q**
Firebase console: https://console.firebase.google.com/project/mizzou-pocus-live

29 slides · 35 min · 8 live polls · EM Conference.

---

## ✅ LIVE POLLING IS WORKING — verified end to end 2026-09-14

Firestore database, security rules, anonymous auth, phone client, presenter tally: all confirmed
against the real deployment, not a simulator.

| Check | Result |
|---|---|
| Security rules, 22 cases (`scripts/test-rules.mjs`) | 22/22 pass |
| Real anonymous tokens, 8 cases (`scripts/e2e-poll.mjs`) | 8/8 pass |
| Attendee tries to drive the presenter's deck | **403 denied** |
| Ballot stuffing under another device's id | **403 denied** |
| Unauthenticated read of a session | **403 denied** |
| Phone joins, sees the live question, taps a vote | works |
| Presenter tally after 10 real voters | 50% / 20% / 30% |

## THE SESSION BELONGS TO WHICHEVER BROWSER OPENS THE DECK FIRST

Read this before every talk. It is the only way the polling can break in a way
you cannot see.

Firestore rules let **only the browser that created the session** drive it
(`ownerUid`, an anonymous id that lives in that browser profile). Any other
browser can read the session but every write it makes is rejected. Until
2026-09-14 the deck swallowed that rejection in silence: the phones stayed frozen
on question 1 for the whole talk while the slide kept saying **Voting open**.

That is exactly what happened. A QA run claimed `BURN-7K4Q` from a different
browser, so the presenting machine could never move the phones off poll 1.

**The rules now:**

1. **Open the deck on the machine and browser you will present from, first.**
   Whatever opens it first owns it. A different browser profile, a private
   window, or cleared site data means a different owner.
2. **Never rehearse or QA on the live code.** `index.html?s=<scratch>` drives a
   scratch session instead — pair it with `/j?c=<scratch>` on the phone:
   ```bash
   # deck:  https://mizzou-pocus-live.web.app/?s=REHEARSE-1
   # phone: https://mizzou-pocus-live.web.app/j?c=REHEARSE-1
   node scripts/clear-session.mjs REHEARSE-1   # tidy up afterwards
   ```
3. **The vote pill tells the truth.** It says **Voting open** only when the
   deck's own writes are landing. If it says **Show of hands** and you did not
   press `O`, the phones are not following you — press `N` for the
   diagnosis and the fix. A warning also flashes bottom-left at boot and on
   every poll slide.
4. **A session nobody has driven for 30 minutes can be claimed by any browser.**
   Added 2026-09-14 so a stale owner can never lock you out of your own talk with
   no terminal in reach. The presenting deck stamps a heartbeat on every poll
   slide and every five minutes it is open, so **a talk in progress cannot be
   taken over** — only an abandoned session can. If you are locked out, the deck
   keeps asking: it takes itself back the moment the other browser has been quiet
   long enough, and republishes the slide you are on. Rules test:
   `node scripts/test-rules.mjs` — 30 cases, 8 of them this behaviour.
5. **To hand the session over immediately:** `node scripts/clear-session.mjs`
   then reload the deck there. The first browser to load it after that owns it.
   Needs this build directory, which lives on the **desktop only** — the
   30-minute rule above is the fallback when it is not.

### One real bug the end-to-end test caught

Slide DOM is built once at boot. Live tallies almost always arrive while the **poll** slide is
still up — so by the time you advanced to the reveal, its DOM was stale and showed an empty
tally. And because voting is closed by then, no later snapshot ever fixed it: **the tally would
simply never have appeared during the talk.** Invisible to any single-slide test; only a
poll-then-advance sequence exposes it.

Fixed in `deck.js` `go()` — a reveal re-renders on entry whenever results are held for it.

## EACH LECTURE GETS ITS OWN TALLY, AUTOMATICALLY

Votes are never deleted — no client is allowed to erase one, which is what keeps
a room's answers trustworthy. A clean tally comes from a clean **path** instead:
the deck stamps a `run` id on the session and both deck and phone read and write
`polls/<run>-<n>/votes/<device>`. Last month's answers stay where they are; this
month's deck simply isn't looking at them.

| When | What happens |
|---|---|
| Deck opened and the session has been idle **2+ hours** | New run. This is the ordinary case: you open the deck for a lecture and every tally is empty. |
| Deck **reloaded during a talk** (session driven within 2 hours) | **Same run, tallies preserved.** A refresh mid-talk must never blank results the room already gave you. |
| You press **R twice** | New run on the spot. Use it when rehearsal and the real talk are the same afternoon. |
| Session doesn't exist yet | New run, same as a first open. |

`R` asks for confirmation before it does anything, because one stray keypress must
not blank a tally the room is still looking at. The old votes are still in
Firestore afterwards — the deck has stopped counting them, that is all.

To see what is stored, per run:
```bash
node scripts/clear-session.mjs BURN-7K4Q    # still the way to erase for real
```

### Rehearsing

```bash
cd "C:/Users/tac02/pocus_pitfalls_build"
node scripts/add-voters.mjs REHEARSE-1 4 "0,0,0,1,2,2"  # fake a room, real anon identities
node scripts/clear-session.mjs REHEARSE-1               # wipe the scratch session
node scripts/clear-session.mjs                          # wipe BURN-7K4Q before the real talk
```

Always run `clear-session.mjs` before presenting so rehearsal votes never appear in the room's tally.

## ⚠️ CUT ORDER — 8 polls + 29 slides is tight for 35 minutes

At ~35s a poll that is ~4.7 min of voting across 25 slides in ~27 min of content.
Do a timed run-through **with the polls actually run**; they always take longer live.
If you are over, cut in this order — each one is self-contained and leaves no dangling reference:

1. **The four section-marker slides (spine1-spine4)** — orientation beats, 15s each. Skipping one costs nothing downstream.
2. **Slide "Three inadequate studies" (t1)** — illustrations, not a case. Pure time, no structural loss.
3. **Poll 5 / Reveal 5 (B-lines)** — the newest §3 pair. §3 still has the AAA poll and the
   non-specific-findings comparison, so the section survives intact.
4. **Demote Poll 3 (CBD) to a show-of-hands** — press O, ask the room, skip the tally.
5. **Slide "Mimic gallery" (t2)** — recognition reps; the teaching is already carried by polls 2 and 3.

Do NOT cut Poll 1 (it establishes the whole first question), Poll 8 (the closing), or the
take-home slide.

## Presenting

| Key | Does |
|---|---|
| `→` / `space` | next slide |
| `←` | previous |
| `N` | speaker notes (includes the **Verify before presenting** list) |
| `Esc` | slide grid |
| `F` | fullscreen |
| `O` | **force show-of-hands mode** — kill the backend mid-talk if the network dies |
| `R` `R` | **new vote run** — a fresh, empty tally for a new lecture (press twice) |
| `Q` | QA mode, disables animation |

`O` is the panic button. If polling is failing in the room, one keypress removes every
trace of the live tally and the talk continues unchanged.

### Before you walk in
1. Open the deck **on the presenting machine, in the browser you will present from**, on the venue wifi.
   Check the first poll slide says **Voting open**, not *Show of hands* — that is the ownership check.
2. Run one poll from your own phone and watch the tally land.
3. If it fails, press `O` and present in hands mode. Nothing else changes.
3. The deck also runs fully offline from `deck/index.html` on a USB stick — polling is the only thing that needs network.

---

## ⚠️ CLINICAL CLAIMS TO VERIFY

Press `N` on any slide — items under **Verify before presenting** are listed there.
Neither Codex nor Gemini nor Claude can certify these. They need a primary source.

The ones that matter most:

1. **"Outer wall to outer wall" is aorta-specific.** Gallbladder wall is measured
   anterior-wall-only; IVC inner-to-inner. The slide already carries this scope limit —
   do not let the phrase leave the room as a universal maxim.
2. **"An artifact moves when you change angle"** holds for side-lobe and grating-lobe,
   but B-lines and ring-down stay anchored to the pleural line.
3. **Myometrial mantle threshold** for interstitial ectopic (commonly cited ~5 mm) — confirm before stating.
4. **Normal CBD upper limit** and the age / post-cholecystectomy adjustment.
5. **McConnell's sign specificity** for PE — genuinely contested; the slide says
   "raises suspicion, does not confirm," which is the defensible wording.
6. Any sensitivity/specificity figure you decide to quote.

**All six vignettes are composites** and labeled as such on the references slide.

---

## Structure

Four questions, not four categories. This replaced an earlier "Four Liars" taxonomy after
both Codex (gpt-6-astra) and Gemini (gemini-3.8-flash-high) independently argued that
*"which liar fooled me?"* is a retrospective classification, where the audience needs a
prospective decision.

1. Did I obtain an adequate examination?
2. What am I actually seeing?
3. What does this finding establish?
4. What remains unanswered?

The title and the opening metaphor survive; only the reasoning model changed.

---

## Layout

```
deck/                  source of truth — edit here
  index.html           shell
  deck.css             design system
  deck.js              renderer + navigation + lazy media
  slides.js            ALL CONTENT — edit this to change the talk
  live.js              Firestore poll client (fails silently, never blocks the deck)
  join.html            phone voting client
  firebase-config.js   public web config (not a secret)
  media/               26 clips + QR
live/                  deploy root
  firebase.json  .firebaserc  firestore.rules
  public/              generated — do not edit, it is overwritten
scripts/build-site.mjs deck/ -> live/public/
BRIEF.md               the design brief both engines reviewed
```

### To change content
Edit `deck/slides.js` only. Then:
```bash
cd "C:/Users/tac02/pocus_pitfalls_build" && node scripts/build-site.mjs && cd live && firebase deploy --only hosting
```

---

## Design notes worth keeping

- **No semantic is carried by hue alone.** Every trap/check distinction also carries a word
  and a shape. Verified in full grayscale plus a washed-projector simulation — the first
  run *failed* (you could not tell trap from correct at row level) and per-row ✕/✓ markers were added.
- **Amber was dropped** as a semantic color: it collapses into ember under deuteranopia.
- **Fabricated poll numbers can never reach an audience.** The `results` arrays in `slides.js`
  are invented layout placeholders gated behind `?preview=1`. Without live Firestore data the
  deck shows ✕/✓ and no percentages at all. This was a deliberate rejection of a reviewer
  suggestion to display a "typical" distribution when voting fails.
- **Video is lazy-loaded** (`preload="none"`, attached on slide-enter plus one-slide prefetch).
  The full library is 183 MB; a shared post-talk link would otherwise burn the Spark tier's
  360 MB/day transfer cap.
- Clips are H.264 with **no audio track**, so muted autoplay is guaranteed and ffmpeg is not needed.

## Attribution

All ultrasound clips and stills: **The POCUS Atlas** (thepocusatlas.com), CC BY-NC-SA 4.0.
The attribution slide is a licence requirement, not a courtesy — it stays in the deck.
