import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const L = ["A", "B", "C", "D", "E"];

for (const n of ["01", "02", "03", "04", "05"]) {
  const path = `${DIR}\\SKD-${n}.json`;
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  let fixedScores = 0;
  let fixedCues = 0;

  for (const q of pkg.questions) {
    // 1. TKP: pastikan skor unik 1-5 dengan mempertahankan urutan kualitas
    if (q.category === "TKP" && q.tkp_scores) {
      const values = L.map((x) => q.tkp_scores[x]);
      if (new Set(values).size !== 5) {
        const ranked = L.map((x, i) => ({ x, v: q.tkp_scores[x], i }))
          .sort((a, b) => b.v - a.v || a.i - b.i)
          .map((o) => o.x);
        const neu = {};
        ranked.forEach((x, idx) => (neu[x] = 5 - idx));
        q.tkp_scores = neu;
        fixedScores++;
      }
    }

    // 2. Kunci tidak boleh menonjol karena lebih panjang
    const key = q.category === "TKP"
      ? L.slice().sort((a, b) => q.tkp_scores[b] - q.tkp_scores[a])[0]
      : q.correct_answer;
    if (!key) continue;

    const lens = L.map((x) => q.options[x].length);
    const others = L.filter((x) => x !== key).map((x) => q.options[x].length);
    const maxOther = Math.max(...others);
    const gap = lens[L.indexOf(key)] - maxOther;

    if (gap > 0) {
      // pangkas kunci pada batas klausa tanpa mengubah makna inti
      const text = q.options[key];
      const parts = text.split(/(,\s+|\s+dan\s+|\s+serta\s+|\s+agar\s+|\s+sehingga\s+)/i);
      let out = "";
      for (const p of parts) {
        if ((out + p).trim().length > maxOther && out.trim().length >= 40) break;
        out += p;
      }
      let trimmed = out.trim().replace(/[,;]$/, "").trim();
      trimmed = trimmed.replace(/\s+(dan|serta|agar|sehingga|untuk|dengan|kepada|pada)$/i, "").trim();
      if (trimmed.length >= 40 && trimmed.length < text.length) {
        q.options[key] = /[.!?]$/.test(trimmed) ? trimmed : trimmed + ".";
        fixedCues++;
      }
    }
  }

  // 3. Kata mutlak di kunci: haluskan bila memungkinkan
  for (const q of pkg.questions) {
    const key = q.category === "TKP"
      ? L.slice().sort((a, b) => q.tkp_scores[b] - q.tkp_scores[a])[0]
      : q.correct_answer;
    if (!key) continue;
    const t = q.options[key];
    if (/\bpasti\b/i.test(t)) {
      q.options[key] = t.replace(/\bpasti\s+/i, "").replace(/\s+pasti\b/i, "");
    }
  }

  writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
  console.log(`SKD-${n}: skor TKP diperbaiki=${fixedScores}, panjang kunci dipangkas=${fixedCues}`);
}
