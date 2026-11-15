import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const L = ["A", "B", "C", "D", "E"];
const get = (n) => pkg.questions.find((x) => x.number === n);

/* #51 — hilangkan isomorfisme; pastikan tidak ada opsi yang juga benar */
const q51 = get(51);
q51.question_text =
  "Diketahui x = 3 dan y = 4. Kuantitas A = x² − y², sedangkan Kuantitas B = x² + y². Hubungan yang benar adalah ...";
q51.options = {
  A: "Kuantitas A lebih besar daripada B",
  B: "Kuantitas A lebih kecil daripada B",
  C: "Kuantitas A sama dengan B",
  D: "Kuantitas A sama dengan negatif B",
  E: "Hubungan A dan B tidak dapat ditentukan",
};
q51.correct_answer = "B";
q51.explanation =
  "Kuantitas A = 9 − 16 = −7, sedangkan Kuantitas B = 9 + 16 = 25. Karena −7 lebih kecil dari 25, hubungan yang benar adalah A lebih kecil daripada B. Pilihan A sama dengan B menggoda karena bentuk x² − y² dan x² + y² tampak mirip, tetapi hasilnya berbeda tanda dan besaran.";

/* #52 — pengecoh berbasis selisih, bukan kelipatan mustahil */
const q52 = get(52);
q52.options.D = "Kuantitas P lebih besar 2 satuan daripada Q";
q52.explanation =
  "Nilai P = 0,4 × 90 = 36 dan nilai Q = 0,25 × 140 = 35. Selisihnya satu satuan, sehingga P lebih besar daripada Q. Pilihan yang menyebut selisih dua satuan menggoda karena arahnya benar tetapi besarannya salah.";

/* #53 — kembalikan pengecoh yang tidak mungkin menjadi kunci kedua */
get(53).options.D = "Kuantitas A tiga kali B";

/* #54 — pengecoh arah terbalik */
const q54 = get(54);
q54.options.D = "Kuantitas A lebih besar 1 satuan daripada B";
q54.explanation =
  "Kuantitas A = 6 : 2 = 3 dan Kuantitas B = 6 − 2 = 4. Karena 3 lebih kecil dari 4, hubungan yang benar adalah A lebih kecil daripada B. Pilihan yang menyebut A lebih besar satu satuan menggoda karena angkanya dekat, tetapi arah perbandingannya terbalik.";

/* #55 — pengecoh selisih dekat */
const q55 = get(55);
q55.options.D = "Kuantitas P lebih kecil 4 satuan daripada Q";
q55.explanation =
  "Nilai P = 2/3 × 45 = 30 dan nilai Q = 3/5 × 55 = 33. Karena 30 lebih kecil dari 33, hubungan yang benar adalah P lebih kecil daripada Q. Pilihan yang menyebut selisih empat satuan menggoda karena arahnya benar tetapi besarannya salah.";

/* #56 — naikkan ke dua langkah */
const q56 = get(56);
q56.question_text =
  "Seorang pekerja menyelesaikan 48 unit dalam sehari dan bekerja selama 15 hari. Karena satu hari digunakan untuk pelatihan, jumlah unit yang diselesaikan berkurang 48 unit. Jumlah unit yang diselesaikan adalah ...";
q56.options = { A: "672", B: "696", C: "720", D: "744", E: "768" };
q56.correct_answer = "A";
q56.explanation =
  "Total sebelum pengurangan adalah 48 × 15 = 720 unit. Karena satu hari digunakan untuk pelatihan, hasilnya 720 − 48 = 672 unit. Pilihan 720 menggoda karena merupakan hasil sebelum pengurangan, sedangkan 768 berasal dari penambahan satu hari.";

/* #57 — pengecoh mewakili kesalahan urutan operasi */
const q57 = get(57);
q57.options = { A: "28", B: "36", C: "40", D: "48", E: "52" };
q57.correct_answer = "C";
q57.explanation =
  "Pembagian dan perkalian dikerjakan lebih dahulu: 96 : 8 = 12 dan 7 × 4 = 28. Hasil akhirnya 12 + 28 = 40. Pilihan 28 menggoda bila siswa hanya menghitung perkalian, sedangkan 48 berasal dari mengabaikan penambahan.";

/* #58 — naikkan ke dua tahap */
const q58 = get(58);
q58.question_text =
  "Harga sebuah barang naik 35% dari Rp240.000. Karena tidak terjual, harga kemudian diturunkan 20% dari harga baru. Harga akhir barang tersebut adalah ...";
q58.options = {
  A: "Rp240.000",
  B: "Rp248.000",
  C: "Rp252.000",
  D: "Rp259.200",
  E: "Rp266.400",
};
q58.correct_answer = "D";
q58.explanation =
  "Harga setelah kenaikan adalah 240.000 × 1,35 = 324.000. Harga setelah penurunan adalah 324.000 × 0,8 = 259.200. Pilihan Rp240.000 menggoda karena menganggap kenaikan 35% dan penurunan 20% saling menghapus, padahal persentasenya dihitung dari harga yang berbeda.";

/* #60 — pengecoh berbasis kesalahan pecahan */
const q60 = get(60);
q60.options = { A: "128", B: "144", C: "160", D: "192", E: "256" };
q60.correct_answer = "C";
q60.explanation =
  "Seperdelapan dari 256 adalah 32, sehingga lima perdelapan adalah 5 × 32 = 160. Pilihan 128 menggoda bila siswa menghitung setengah, 192 bila memakai enam perdelapan, dan 256 bila menganggap seluruh bagian.";

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
console.log("batch 6 diterapkan: 51, 52, 53, 54, 55, 56, 57, 58, 60");
