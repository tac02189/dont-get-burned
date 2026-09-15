// Assembles the hosting root from deck/. Run before every deploy.
import { cp, rm, mkdir, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "deck");
const dst = join(root, "live", "public");
await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });
await cp(src, dst, { recursive: true });
let bytes = 0, files = 0;
async function walk(d){ for(const e of await readdir(d,{withFileTypes:true})){
  const p = join(d, e.name);
  if(e.isDirectory()) await walk(p); else { bytes += (await stat(p)).size; files++; }
}}
await walk(dst);
console.log(`site built: ${files} files, ${(bytes/1048576).toFixed(1)} MB -> live/public`);
