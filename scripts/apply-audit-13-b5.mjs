import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const L = ["A", "B", "C", "D", "E"];
const get = (n) => pkg.questions.find((x) => x.number === n);

/* #41: opsi kunci ditempatkan tidak acak, dan 'Tidak dapat ditentukan' terlalu mudah dieliminasi */
get(41).options = {
  A: "Rani",
  B: "Sari",
  C: "Dimas",
  D: "Fajar",
  E: "Tidak dapat ditentukan",
};
get(41).correct_answer = "D";
get(41).explanation =
  "Urutan dari tertinggi adalah Dimas, Rani, Sari, lalu Fajar. Karena Fajar berada di bawah Sari dan Sari di bawah Rani, Fajar menempati posisi terendah. Informasi pada stem sudah cukup, sehingga pilihan tidak dapat ditentukan tidak berlaku.";

/* #43: 'Dedi' tidak diperkenalkan di stem — data kurang */
get(43).stem = undefined;
get(43).question_text =
  "Lima siswa duduk berjajar. Ani duduk di ujung kiri, Bima duduk di kursi ketiga, Cici tepat di kanan Bima, Dedi tepat di kiri Bima, dan Eka duduk di ujung kanan. Siswa yang duduk di kursi kedua adalah ...";
get(43).options = {
  A: "Ani",
  B: "Bima",
  C: "Cici",
  D: "Dedi",
  E: "Eka",
};
get(43).correct_answer = "D";
get(43).explanation =
  "Ani di kursi 1 dan Eka di kursi 5. Bima di kursi 3, sehingga Cici di kursi 4 dan Dedi tepat di kiri Bima, yaitu kursi 2. Dengan demikian kursi kedua ditempati Dedi.";

/* #44: 'R wajib terpilih' juga selalu benar, sehingga menimbulkan kunci ganda */
get(44).question_text =
  "Panitia memilih tiga dari lima kandidat: P, Q, R, S, dan T. Aturannya, jika P terpilih maka Q tidak boleh terpilih, dan S hanya boleh terpilih jika T terpilih. Jika S terpilih, kandidat yang wajib terpilih adalah ...";
get(44).options = {
  A: "P",
  B: "Q",
  C: "R",
  D: "T",
  E: "Tidak ada",
};
get(44).correct_answer = "D";
get(44).explanation =
  "Aturan menyatakan S hanya boleh terpilih bila T terpilih. Karena S sudah dipastikan terpilih, T wajib ikut terpilih. Kandidat lain tidak memiliki syarat yang langsung mengikat ketika S terpilih.";

/* #47: opsi angka tidak berurutan */
get(47).options = {
  A: "88",
  B: "94",
  C: "100",
  D: "104",
  E: "108",
};
get(47).correct_answer = "C";

/* #48: opsi angka tidak berurutan */
get(48).options = {
  A: "216",
  B: "288",
  C: "324",
  D: "360",
  E: "432",
};
get(48).correct_answer = "C";

/* #46, #49, #50: pastikan urut naik */
get(46).options = { A: "88", B: "92", C: "96", D: "98", E: "102" };
get(49).options = { A: "47", B: "55", C: "61", D: "63", E: "67" };
get(50).options = { A: "30", B: "31", C: "32", D: "33", E: "68" };

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");

const bad = [];
for (const q of pkg.questions) {
  const lens = L.map((x) => q.options[x].length);
  const spread = Math.max(...lens) - Math.min(...lens);
  const top = q.category === "TKP"
    ? L.slice().sort((a, b) => q.tkp_scores[b] - q.tkp_scores[a])[0]
    : q.correct_answer;
  const gap = lens[L.indexOf(top)] - Math.max(...lens.filter((_, i) => i !== L.indexOf(top)));
  if (spread > 25 || gap > 5) bad.push(`${q.number} spread=${spread} gap=${gap}`);
}
console.log("batch 5 diterapkan. belum seimbang:", bad.length, bad.join(" | "));
