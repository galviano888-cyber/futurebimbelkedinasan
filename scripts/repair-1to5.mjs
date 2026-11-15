import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const L = ["A", "B", "C", "D", "E"];

// Perbaikan manual untuk kunci yang terlanjur dipangkas terlalu pendek.
const RESTORE = {
  "SKD-01": {
    7: "Mengedukasi masyarakat tentang pentingnya netralitas ASN dalam menghadapi konflik politik",
    103: null,
  },
  "SKD-02": {
    9: null, 11: null, 68: null, 74: null, 86: null, 96: null, 97: null,
  },
  "SKD-03": { 3: null, 13: null, 17: null, 18: null, 110: null },
  "SKD-04": { 106: null },
  "SKD-05": { 29: null },
};

const TKP_FIX = {
  "SKD-01": { 103: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai" },
  "SKD-02": {
    68: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    74: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    86: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    96: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    97: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
  },
  "SKD-03": {
    70: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    75: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    76: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    77: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    79: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
  },
  "SKD-04": {
    71: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    78: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    83: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
  },
  "SKD-05": {
    76: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    77: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    81: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    82: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
    107: "Mengadakan dialog kelas tentang pentingnya toleransi dan sikap saling menghargai",
  },
};

const keyOf = (q) =>
  q.category === "TKP" && q.tkp_scores
    ? L.slice().sort((a, b) => q.tkp_scores[b] - q.tkp_scores[a])[0]
    : q.correct_answer;

// Kembalikan panjang wajar: pengecoh terpanjang + 5, minimal 70 karakter.
for (const [file, map] of Object.entries({ ...RESTORE, ...TKP_FIX })) {
  const path = `${DIR}\\${file}.json`;
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  let n = 0;

  for (const [num, text] of Object.entries(map)) {
    if (!text) continue;
    const q = pkg.questions.find((x) => x.number === Number(num));
    if (!q) continue;
    const key = keyOf(q);
    q.options[key] = text;
    n++;
  }

  // Untuk kunci yang masih terlalu pendek, panjangkan pengecoh terpendek
  // agar selisih menyusut tanpa memotong kunci.
  for (const q of pkg.questions) {
    const key = keyOf(q);
    if (!key) continue;
    const lens = L.map((x) => q.options[x].length);
    const others = L.filter((x) => x !== key).map((x) => q.options[x].length);
    const shortfall = Math.max(...others) - lens[L.indexOf(key)];
    if (shortfall > 25) {
      const shortest = L.filter((x) => x !== key)
        .sort((a, b) => q.options[a].length - q.options[b].length)[0];
      q.options[shortest] = q.options[shortest].replace(/[.]$/, "") +
        " sesuai ketentuan yang berlaku dalam pelayanan publik.";
      n++;
    }
  }

  writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
  console.log(`${file}: ${n} penyesuaian`);
}
