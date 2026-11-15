import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const get = (n) => pkg.questions.find((x) => x.number === n);

/* #36: opsi D juga valid (semua peserta wajib → semua yang dari luar kota wajib). */
const q36 = get(36);
q36.options = {
  A: "Peserta dari dalam kota tidak wajib memakai tanda pengenal",
  B: "Semua pemakai tanda pengenal datang dari luar kota",
  C: "Tidak ada peserta luar kota yang memakai tanda pengenal",
  D: "Semua peserta yang datang dari luar kota wajib memakai tanda pengenal",
  E: "Sebagian peserta dari luar kota wajib memakai tanda pengenal",
};
q36.correct_answer = "D";
q36.explanation =
  "Kewajiban memakai tanda pengenal berlaku bagi seluruh peserta, tanpa membedakan asal kota. Karena itu seluruh peserta yang datang dari luar kota juga wajib memakainya. Kesimpulan yang hanya menyebut sebagian terlalu lemah, sedangkan pilihan lain membalik arah hubungan atau menyangkal premis.";

/* #38: opsi A juga benar (tidak ada lulusan hukum yang bendahara → tidak ada bendahara yang lulusan hukum). */
const q38 = get(38);
q38.options = {
  A: "Semua bendahara adalah lulusan hukum",
  B: "Tidak ada anggota komite yang menjabat bendahara",
  C: "Sebagian anggota komite menjabat sebagai bendahara",
  D: "Semua lulusan hukum adalah anggota komite",
  E: "Sebagian bendahara adalah anggota komite",
};
q38.correct_answer = "B";
q38.explanation =
  "Seluruh anggota komite adalah lulusan hukum, dan tidak ada lulusan hukum yang menjabat bendahara. Rantai itu menutup kemungkinan anggota komite merangkap bendahara. Pilihan lain membalik arah hubungan, menyatakan kemungkinan yang sudah tertutup, atau menambahkan informasi yang tidak ada pada premis.";

/* #33: pengecoh 'Hama' tidak sejajar; ganti dengan pengecoh yang lebih dekat. */
get(33).options = {
  A: "Tanaman",
  B: "Tanah",
  C: "Petani",
  D: "Panen",
  E: "Bibit",
};
get(33).explanation =
  "Hubungannya adalah bahan yang diberikan untuk memperbaiki kondisi objek sasaran. Obat diberikan kepada penderita penyakit, sedangkan pupuk diberikan kepada tanaman. Tanah adalah media, bibit adalah bahan tanam, dan panen adalah hasil, sehingga tidak sejajar dengan hubungan pada soal.";

/* #31: 'Benda' terlalu umum, 'Isi' kurang sejajar; rapikan. */
get(31).options = {
  A: "Panjang",
  B: "Suhu",
  C: "Isi",
  D: "Kecepatan",
  E: "Berat",
};
get(31).explanation =
  "Hubungannya adalah alat ukur dengan besaran yang diukur. Jam mengukur waktu, sedangkan timbangan mengukur berat. Panjang diukur meteran, suhu termometer, isi gelas ukur, dan kecepatan speedometer.";

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
console.log("batch 4 diterapkan: 31, 33, 36, 38");
