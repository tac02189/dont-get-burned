import { readFileSync, writeFileSync } from "node:fs";
/* My rewrite put double quotes inside strings that are themselves
   double-quoted in slides.js, which broke the module. Single quotes
   inside a double-quoted JS string need no escaping - use those. */
const p = "C:/Users/tac02/pocus_pitfalls_build/deck/slides.js";
let s = readFileSync(p, "utf8");

const FIX = [
  [`"The trap is the "negative study" answer, and in most rooms it wins.`,
   `"The trap is the 'negative study' answer, and in most rooms it wins.`],
  [`"The "7 mm is normal" answer is a quieter trap`,
   `"The '7 mm is normal' answer is a quieter trap`],
  [`the people who reach for "call it" are not careless`,
   `the people who reach for 'call it' are not careless`]
];
let n = 0;
for (const [a, b] of FIX) {
  if (!s.includes(a)) { console.error("not found: " + a.slice(0, 60)); process.exit(1); }
  s = s.replace(a, b); n++;
}
writeFileSync(p, s);
console.log("repaired " + n + " string(s)");
