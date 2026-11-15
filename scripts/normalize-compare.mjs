import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const L = ["A", "B", "C", "D", "E"];

// Tentukan jenis hubungan dari teks opsi lama, lalu tulis ulang dengan diksi seragam.
function relationOf(text) {
  const t = String(text).toLowerCase();
  if (/tidak dapat ditentukan/.test(t)) return "undetermined";
  if (/dua kali|2 kali/.test(t)) return "double";
  if (/tiga kali|3 kali/.test(t)) return "triple";
  if (/lebih besar|>/.test(t)) return "greater";
  if (/lebih kecil|</.test(t)) return "less";
  if (/sama dengan|sama| = /.test(t)) return "equal";
  return null;
}

function wording(relation, symbol) {
  const s = symbol || "A";
  const o = symbol === "A" ? "B" : "B";
  switch (relation) {
    case "greater": return `${s} lebih besar daripada ${o}`;
    case "less": return `${s} lebih kecil daripada ${o}`;
    case "equal": return `${s} sama dengan ${o}`;
    case "double": return `${s} dua kali ${o}`;
    case "triple": return `${s} tiga kali ${o}`;
    case "undetermined": return `Hubungan ${s} dan ${o} tidak dapat ditentukan`;
    default: return null;
  }
}

for (const n of ["01", "02", "03", "04", "05"]) {
  const path = `${DIR}\\SKD-${n}.json`;
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;

  for (const q of pkg.questions) {
    if (q.category !== "TIU" || q.sub_category !== "Perbandingan Kuantitatif") continue;

    // simbol yang dipakai stem: P/Q, x/y, atau A/B
    let symbol = "A";
    if (/Kuantitas\s+P|kuantitas\s+p/.test(q.question_text)) symbol = "P";
    else if (/Kuantitas\s+x|kuantitas\s+x/.test(q.question_text)) symbol = "x";

    const keyRelation = relationOf(q.options[q.correct_answer]);
    if (!keyRelation) continue;

    const neu = {};
    for (const x of L) {
      const rel = relationOf(q.options[x]);
      if (!rel) { neu[x] = q.options[x]; continue; }
      neu[x] = rel === "undetermined"
        ? `Hubungan ${symbol} dan ${symbol === "A" ? "B" : "B"} tidak dapat ditentukan`
        : wording(rel, symbol);
    }
    q.options = neu;
    changed++;
  }

  writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
  console.log(`SKD-${n}: ${changed} soal perbandingan diseragamkan`);
}
