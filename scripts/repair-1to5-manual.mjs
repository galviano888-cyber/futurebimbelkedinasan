import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const L = ["A", "B", "C", "D", "E"];

const FIX = {
  "SKD-01": {
    7: {
      D: "Mengedukasi masyarakat tentang pentingnya netralitas ASN dalam konflik politik",
    },
  },
  "SKD-02": {
    9: {
      A: "Mengedukasi tetangga tentang pentingnya menjaga kebersihan lingkungan",
      B: "Membangun saluran air secara swadaya agar banjir tidak menggenang",
      C: "Mengelola sampah rumah tangga secara mandiri dengan memilah jenisnya",
      D: "Mengikuti kerja bakti rutin yang diadakan pengurus lingkungan",
      E: "Melaporkan warga yang membuang sampah sembarangan kepada pihak berwajib",
    },
    11: {
      A: "Membiarkan rekan baru belajar mandiri agar terbiasa menyelesaikan masalah",
      B: "Mengusulkan pelatihan tambahan bagi rekan baru kepada atasan",
      C: "Membagi tugas rekan baru kepada anggota tim lain agar target tercapai",
      D: "Menyusun panduan tertulis agar rekan baru mempelajarinya sendiri",
      E: "Memberikan bimbingan personal kepada rekan baru agar cepat beradaptasi",
    },
  },
  "SKD-05": {
    8: {
      A: "Melarang seluruh akses konten budaya asing di media sosial nasional",
      B: "Mengabaikan tren global dan melestarikan kesenian tradisional secara murni",
      C: "Mengemas ulang kearifan lokal dengan format digital yang menarik",
      D: "Mewajibkan media massa menayangkan konten budaya asli setiap hari",
      E: "Mengklaim budaya asing yang populer sebagai bagian budaya nasional",
    },
    29: {
      A: "Mendorong penyelesaian sengketa melalui musyawarah dan penetapan resmi",
    },
    110: {
      A: "Mengatur jadwal fokus agar notifikasi kerja tidak masuk di luar jam kerja",
      B: "Menghapus semua aplikasi kerja dari ponsel agar bebas di luar jam kerja",
      C: "Membalas semua notifikasi segera meski harus bekerja hingga larut malam",
      D: "Mengabaikan notifikasi di luar jam kerja lalu membalasnya pagi hari",
      E: "Meminta atasan membuat aturan yang melarang pesan di luar jam kerja",
    },
  },
};

for (const [file, map] of Object.entries(FIX)) {
  const path = `${DIR}\\${file}.json`;
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  let n = 0;
  for (const [num, opts] of Object.entries(map)) {
    const q = pkg.questions.find((x) => x.number === Number(num));
    if (!q) continue;
    Object.assign(q.options, opts);
    n++;
  }
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
  console.log(`${file}: ${n} soal diperbaiki | sisa masalah: ${bad.length}${bad.length ? " -> " + bad.join(" | ") : ""}`);
}
