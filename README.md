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

## 2026-11-12 — five engine bugs fixed, ported from pocus-live-lectures

`pocus-live-lectures` (the two house-style lectures for 2026-11-18) runs a copy of
this deck's engine. Codex and Gemini reviews of that copy, and testing its deployed
site, found five bugs that were also here. Their fixes were ported back, each
commented and dated in `deck/live.js` and `deck/deck.js`:

| Bug | Fix |
|---|---|
| The pill stayed on **Voting open** after the network dropped: an offline write never fails, it waits | The write a poll or reveal slide sends gets 8 s. Past that the pill says **Show of hands**; it comes back by itself when the newest queued write lands, and the phones end on the last question you showed |
| `R` `R` could bring back an old tally: a reveal visited earlier kept its numbers in the page | A reveal re-renders every time you enter it |
| A session re-created mid-talk left the deck counting the old run's votes | `claim()` drops the old vote listener |
| `O` did not close the phones: they went on taking votes while the room voted by hand | In hands mode the phones are told voting is closed, whatever slide you press it on |
| Opening the phone page (`/j`) in the presenting browser could take over the deck's sign-in, because both share one origin | The deck signs in through its own named Firebase app |

A Codex review of the port found that the 8-second deadline needed more care than
the first version gave it, in both copies: a write past its deadline is not lost,
it lands when the network returns. So the deck now forgets which question the
phones hold after any write that missed its deadline, a late write turns the pill
back to **Voting open** only if no newer one is still queued, and `R` `R` switches
the deck to the new run only once that write has landed. `R` `R` also waits its
turn behind slide writes already queued, so an older poll cannot go out after the
reset and reopen voting. The deck refuses `R` `R` while it already knows it is
offline (`N` shows **Live polling: OFFLINE**). If the network drops just as you press
it, the reset goes out when the network returns, and the slide you are on follows it.

A Codex review of the pocus-live-lectures copy on 2026-11-13 found one gap in the
`O` fix, in both copies. After a reload, `O` pressed before the deck had connected,
on a slide with no poll, switched the slides to show of hands but never reached the
phones. So a poll left open before the reload stayed open until the next poll or
reveal slide. The deck now sends that close as soon as it connects. Codex's review
of that fix found one older case, fixed the same day. A deck that came up read-only
lost the close, because its heartbeat, on taking the session back, replayed only the
last poll it had sent. `deck/live.js` now keeps the close as the intent to replay.

Limits that remain:
- A deck parked on one slide sends only its five-minute heartbeat, which has no
  deadline, so it notices a dead network at the next poll or reveal slide. Phones
  that already have the question can still vote meanwhile.
- The writes the deck makes to recover a session (re-claiming it, taking it back)
  have no deadline either.
- Closing a poll is what the phones show: the rules do not refuse a late vote.
- `O` reaches the phones only through the deck's connection. If the network is down,
  the phones are closed when it returns; if the deck is still connecting, as soon as
  it connects; if another browser holds the session, once the deck takes it back,
  which the rules allow only once the session's heartbeat is 30 minutes old, or
  missing. A deck that gives up connecting tells the phones nothing until it is reloaded, and
  hands mode does not survive a reload, so press `O` again after one.

Plus one guard: a deck served from `localhost` drives `LOCAL-BURN-7K4Q`, never the
live code, unless `?s=` names a session (see **Rehearsing**).

The same review found that the phone page put text it did not write into the page
as markup: the `?c=` code (inside Firebase's error messages) and a session's question
and options, which any signed-in browser can set on a session it creates. A crafted
`/j?c=` link could therefore run script on this site. Both are now shown as plain
text.

⚠️ **The deck signs in under a new anonymous identity since this change.** The
browser that owned `BURN-7K4Q` before 2026-11-12 no longer does. `BURN-7K4Q` was last
driven on 2026-09-18, so the 30-minute rule below hands it to whichever browser opens
the deck first, which is the usual rule: open it on the presenting machine first. To
hand it over at once instead, run `node scripts/clear-session.mjs` and reload.

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
   deck's own writes are landing; a write the server has not acknowledged
   within 8 seconds counts as not landing. The deck writes on every poll and
   reveal slide, so one parked on a slide finds out at the next of those. If it says
   **Show of hands** and you did not press `O`, the phones are not following
   you — press `N` for the diagnosis and the fix. A warning also flashes
   bottom-left at boot and on every poll slide.
4. **A session nobody has driven for 30 minutes can be claimed by any browser.**
   Added 2026-09-14 so a stale owner can never lock you out of your own talk with
   no terminal in reach. The presenting deck stamps a heartbeat on every poll
   slide and every five minutes it is open, so **a talk in progress cannot be
   taken over** — only an abandoned session can. If you are locked out, the deck
   keeps asking every five minutes: it takes itself back at the first try after the
   other browser has been quiet for 30, and republishes the slide you are on. Rules test:
   `node scripts/test-rules.mjs` — 30 cases, 8 of them this behaviour.
5. **To hand the session over immediately:** `node scripts/clear-session.mjs`
   then reload the deck there. The first browser to load it after that owns it.
   Needs a clone of this repo: the desktop has one, and since 2026-11-12 so does
   the laptop, both at `%USERPROFILE%\pocus_pitfalls_build`. The 30-minute rule
   above is the fallback when neither is in reach.

### One real bug the end-to-end test caught

Slide DOM is built once at boot. Live tallies almost always arrive while the **poll** slide is
still up — so by the time you advanced to the reveal, its DOM was stale and showed an empty
tally. And because voting is closed by then, no later snapshot ever fixed it: **the tally would
simply never have appeared during the talk.** Invisible to any single-slide test; only a
poll-then-advance sequence exposes it.

Fixed in `deck.js` `go()` — a reveal re-renders on entry. Until 2026-11-12 it did so only
when results were held for it, which let a stale tally survive `R` `R` (table above).

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

A deck served from `localhost` (the preview pane, `serve.cjs`) drives `LOCAL-BURN-7K4Q`
rather than the live code, unless `?s=` names another session. A phone votes into it at
`https://mizzou-pocus-live.web.app/j?c=LOCAL-BURN-7K4Q`; clear it afterwards with
`node scripts/clear-session.mjs LOCAL-BURN-7K4Q`. The slides still show `BURN-7K4Q`
and the QR still points at it, for a local deck and for `?s=` alike, so a rehearsal
phone must open its URL by hand rather than scan.

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
| `O` | **force show-of-hands mode**, for when polling fails mid-talk: the slides drop the live tally and the phones are told voting is closed. The deck stays connected; `O` again goes back |
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

⚠️ **On Windows, clone with `git clone -c core.autocrlf=false`.** Git for Windows
defaults to `autocrlf=true`, which checks every text file out with CRLF endings. The
repo and the live site are LF, so a deploy from such a clone would change all seven
text files on the site even if you had edited none of them. Found on 2026-11-12, when
the laptop's first clone compared unequal to the live release on exactly those seven
files and equal on all 34 media files.

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
