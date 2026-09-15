/* ============================================================
   PptxGenJS re-embeds media on every addMedia/addImage call, so a clip
   used on two slides is stored twice. This SHA-1s every ppt/media/*
   entry, repoints the .rels of every duplicate at one canonical copy,
   drops the redundant parts, and repacks.

   Required by POCUS Lectures/CLAUDE.md — "keep this step in every build."
   ============================================================ */
import JSZip from "jszip";
import { readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(root, "Dont Get Burned When Ultrasound Lies.pptx");

const before = (await stat(FILE)).size;
const zip = await JSZip.loadAsync(await readFile(FILE));

// 1. hash every media part
const media = Object.keys(zip.files).filter(n => n.startsWith("ppt/media/") && !zip.files[n].dir);
const byHash = new Map();      // sha1 -> canonical filename
const rename = new Map();      // duplicate filename -> canonical filename

for(const name of media){
  const buf = await zip.files[name].async("nodebuffer");
  const h = createHash("sha1").update(buf).digest("hex");
  if(byHash.has(h)) rename.set(name.replace("ppt/media/",""), byHash.get(h));
  else byHash.set(h, name.replace("ppt/media/",""));
}

if(rename.size === 0){
  console.log(`no duplicate media found (${media.length} parts, ${(before/1048576).toFixed(1)} MB) — nothing to do`);
  process.exit(0);
}

// 2. repoint every .rels reference at the canonical copy
const rels = Object.keys(zip.files).filter(n => n.endsWith(".rels"));
let rewrites = 0;
for(const r of rels){
  let xml = await zip.files[r].async("string");
  let touched = false;
  for(const [dup, canon] of rename){
    if(xml.includes(dup)){
      xml = xml.split(dup).join(canon);
      touched = true; rewrites++;
    }
  }
  if(touched) zip.file(r, xml);
}

// 3. drop the now-unreferenced duplicates
for(const dup of rename.keys()) zip.remove("ppt/media/" + dup);

const out = await zip.generateAsync({ type:"nodebuffer", compression:"DEFLATE",
  compressionOptions:{ level:6 } });
await writeFile(FILE, out);

const after = (await stat(FILE)).size;
console.log(`deduped ${rename.size} duplicate media part(s) across ${rewrites} rel rewrite(s)`);
console.log(`${(before/1048576).toFixed(1)} MB -> ${(after/1048576).toFixed(1)} MB  (saved ${((before-after)/1048576).toFixed(1)} MB)`);
