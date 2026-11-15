// Perbaiki mojibake (karakter UTF-8 yang salah dibaca sebagai Windows-1252)
// pada file sumber. Jalankan: node scripts/fix-mojibake.mjs [--apply]
//
// Tanpa --apply hanya melaporkan file dan jumlah kemunculan.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const apply = process.argv.includes("--apply");

const MAP = [
  ["â”€", "─"],
  ["â”‚", "│"],
  ["â”œ", "├"],
  ["â””", "└"],
  ["â”¬", "┬"],
  ["â”¼", "┼"],
  ["â”œ", "├"],
  ["â†’", "→"],
  ["â† ", "←"],
  ["â€”", "—"],
  ["â€“", "–"],
  ["â€™", "’"],
  ["â€˜", "‘"],
  ["â€œ", "“"],
  ["â€\x9d", "”"],
  ["â€¦", "…"],
  ["âœ“", "✓"],
  ["âœ…", "✅"],
  ["âš ", "⚠"],
  ["Ã¢", "â"],
  ["Ã©", "é"],
  ["Ã¯", "ï"],
  ["Ã¼", "ü"],
  ["Ã¶", "ö"],
  ["Ã¤", "ä"],
  ["Â ", " "],
  ["Â", ""],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === ".git") continue;
      walk(p, out);
    } else if (/\.(ts|tsx|js|jsx|md|json|css|html|sql)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const PATTERN = /â€|â†|Ã¢|Ã©|Ã¯|ðŸ|â”|âœ|Â/g;

let totalFiles = 0;
let totalHits = 0;

for (const file of walk(resolve(ROOT, "src"))) {
  const original = readFileSync(file, "utf8");
  const hits = (original.match(PATTERN) ?? []).length;
  if (hits === 0) continue;

  totalFiles++;
  totalHits += hits;

  let fixed = original;
  for (const [from, to] of MAP) fixed = fixed.split(from).join(to);

  const remaining = (fixed.match(PATTERN) ?? []).length;
  console.log(`${file.replace(ROOT + "\\", "")}  hit=${hits}  sisa=${remaining}`);

  if (apply) writeFileSync(file, fixed, "utf8");
}

console.log(`\n${totalFiles} file, ${totalHits} kemunculan`);
if (!apply) console.log("DRY RUN. Tambahkan --apply untuk memperbaiki.");
