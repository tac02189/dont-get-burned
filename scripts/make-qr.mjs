/* Regenerates the join QR for a deck.
   The deck renders media/qr.txt (a data URL) into every .qrslot img; qr.png is
   the same code as a file, for printing or dropping into the .pptx backup.

   Usage: node scripts/make-qr.mjs [joinUrl] [outDir]
     joinUrl  defaults to the SESSION_CODE in deck/firebase-config.js
     outDir   defaults to deck/media

   Run it whenever the session code or the host changes — a deck whose QR points
   at the previous lecture's code sends the whole room to the wrong session, and
   nothing on screen would say so. */
import QRCode from "qrcode";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const cfg  = readFileSync("deck/firebase-config.js", "utf8");
const code = (cfg.match(/SESSION_CODE\s*=\s*"([^"]+)"/) || [])[1];
const host = (cfg.match(/authDomain:\s*"([^".]+)\./) || [])[1];
const url  = process.argv[2] || (code && host ? `https://${host}.web.app/j?c=${code}` : null);
const out  = process.argv[3] || "deck/media";
if(!url){ console.error("could not derive the join URL — pass it explicitly"); process.exit(1); }

/* Dark modules on a light ground, quiet zone intact: a projected QR is scanned
   from the back of a room, so contrast and margin are not cosmetic. */
const opts = { errorCorrectionLevel: "M", margin: 2, width: 360,
               color: { dark: "#0E0E11", light: "#FFFFFF" } };

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "qr.txt"), await QRCode.toDataURL(url, opts));
await QRCode.toFile(join(out, "qr.png"), url, opts);
console.log(`QR written to ${out}/qr.txt + qr.png for ${url}`);
