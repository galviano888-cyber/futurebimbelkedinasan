import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const L = ["A", "B", "C", "D", "E"];

const get = (n) => pkg.questions.find((x) => x.number === n);

// 38: kunci lebih panjang dari pengecoh
get(38).options.B = "Tidak ada anggota komite yang menjabat bendahara";

// 40: pengecoh C terlalu panjang dan hampir benar
get(40).options.B = "Semua peserta ujian adalah pegawai bersertifikat";
get(40).options.C = "Beberapa pegawai bersertifikat mengikuti ujian lanjutan";

// 51-55: seragamkan panjang dengan memendekkan opsi E dan menyeimbangkan D
for (const n of [51, 52, 53, 54, 55]) {
  const q = get(n);
  q.options.E = "Hubungan A dan B tidak dapat ditentukan";
  if (q.options.D) q.options.D = q.options.D.replace(/\s+/g, " ");
}
get(51).options = {
  A: "Kuantitas A lebih besar daripada B",
  B: "Kuantitas A lebih kecil daripada B",
  C: "Kuantitas A sama dengan B",
  D: "Kuantitas A dua kali B",
  E: "Hubungan A dan B tidak dapat ditentukan",
};
get(52).options = {
  A: "Kuantitas P lebih besar daripada Q",
  B: "Kuantitas P lebih kecil daripada Q",
  C: "Kuantitas P sama dengan Q",
  D: "Kuantitas P dua kali Q",
  E: "Hubungan P dan Q tidak dapat ditentukan",
};
get(53).options = {
  A: "Kuantitas A lebih besar daripada B",
  B: "Kuantitas A lebih kecil daripada B",
  C: "Kuantitas A sama dengan B",
  D: "Kuantitas A tiga kali B",
  E: "Hubungan A dan B tidak dapat ditentukan",
};
get(54).options = {
  A: "Kuantitas A lebih besar daripada B",
  B: "Kuantitas A lebih kecil daripada B",
  C: "Kuantitas A sama dengan B",
  D: "Kuantitas A dua kali B",
  E: "Hubungan A dan B tidak dapat ditentukan",
};
get(55).options = {
  A: "Kuantitas P lebih besar daripada Q",
  B: "Kuantitas P lebih kecil daripada Q",
  C: "Kuantitas P sama dengan Q",
  D: "Kuantitas P tiga kali Q",
  E: "Hubungan P dan Q tidak dapat ditentukan",
};

// 73: skor kembar 1 pada dua opsi
get(73).tkp_scores = { A: 2, B: 3, C: 1, D: 2, E: 5 };

// TKP: skor harus unik 1-5 untuk setiap soal
let fixed = 0;
for (const q of pkg.questions) {
  if (q.category !== "TKP" || !q.tkp_scores) continue;
  const scores = L.map((x) => q.tkp_scores[x]);
  if (new Set(scores).size === 5) continue;

  // pertahankan urutan kualitas, lalu beri skor 5,4,3,2,1
  const ranked = L.map((x, i) => ({ x, s: q.tkp_scores[x], i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((v) => v.x);
  const neu = {};
  ranked.forEach((x, idx) => { neu[x] = 5 - idx; });
  q.tkp_scores = neu;
  fixed++;
}

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
console.log("TKP skor diseimbangkan:", fixed);
