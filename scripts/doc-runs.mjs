import { readFileSync, writeFileSync } from "node:fs";
const must = (c, m) => { if(!c){ console.error("ABORT: " + m); process.exit(1); } };

/* README */
let r = readFileSync("README.md", "utf8");
must(r.includes("### Rehearsing"), "readme: rehearsing anchor");
r = r.replace("### Rehearsing",
`## EACH LECTURE GETS ITS OWN TALLY, AUTOMATICALLY

Votes are never deleted — no client is allowed to erase one, which is what keeps
a room's answers trustworthy. A clean tally comes from a clean **path** instead:
the deck stamps a \`run\` id on the session and both deck and phone read and write
\`polls/<run>-<n>/votes/<device>\`. Last month's answers stay where they are; this
month's deck simply isn't looking at them.

| When | What happens |
|---|---|
| Deck opened and the session has been idle **2+ hours** | New run. This is the ordinary case: you open the deck for a lecture and every tally is empty. |
| Deck **reloaded during a talk** (session driven within 2 hours) | **Same run, tallies preserved.** A refresh mid-talk must never blank results the room already gave you. |
| You press **R twice** | New run on the spot. Use it when rehearsal and the real talk are the same afternoon. |
| Session doesn't exist yet | New run, same as a first open. |

\`R\` asks for confirmation before it does anything, because one stray keypress must
not blank a tally the room is still looking at. The old votes are still in
Firestore afterwards — the deck has stopped counting them, that is all.

To see what is stored, per run:
\`\`\`bash
node scripts/clear-session.mjs BURN-7K4Q    # still the way to erase for real
\`\`\`

### Rehearsing`);
must(r.includes("| \`Q\` | QA mode, disables animation |"), "readme: key table anchor");
r = r.replace("| \`Q\` | QA mode, disables animation |",
`| \`R\` \`R\` | **new vote run** — a fresh, empty tally for a new lecture (press twice) |
| \`Q\` | QA mode, disables animation |`);
writeFileSync("README.md", r);

/* memory */
const M = "C:/Users/tac02/.claude/projects/D---1--Thiago-OneDrive--3--Claude-POCUS-Lectures/memory/dont-get-burned-deck.md";
let m = readFileSync(M, "utf8");
if(!m.includes("per-lecture vote run")){
  m = m.replace("Related: [[powerpoint-com-blocked-in-sandbox]]",
`**Votes are namespaced by per-lecture vote run, never deleted (2026-09-14).** No client may erase a
vote (\`allow delete: if false\`), so a fresh tally comes from a fresh path: the deck stamps a \`run\`
id on the session and both sides use \`polls/<run>-<n>/votes/<device>\`. A new run starts when the
session has been idle 2+ hours (a new lecture) or on a deliberate double-press of \`R\`; a reload
during a talk keeps its run, because blanking tallies the room already gave you is the worse
failure. Old runs stay queryable. \`clear-session.mjs\` enumerates buckets with \`showMissing=true\`
rather than guessing poll numbers, since run ids cannot be enumerated.

Related: [[powerpoint-com-blocked-in-sandbox]]`);
  writeFileSync(M, m);
}
console.log("README + memory updated");
