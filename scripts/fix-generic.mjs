import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";

const FIX = {
  "SKD-NEW-01.json": {
    20: {
      options: {
        B: "Jati diri bangsa harus dipertahankan agar pengaruh asing tidak merubah identitas nasional.",
      },
      explanation:
        "Kata baku menurut KBBI adalah analisis, seksama, dan independen. Pilihan lain memuat bentuk tidak baku: konkrit seharusnya konkret, berfikir seharusnya berpikir, sistimatis seharusnya sistematis, dan merubah seharusnya mengubah.",
    },
    25: {
      options: {
        A: "Dia membeli alat tulis, seperti pena, pensil dan buku di toko sebelah.",
      },
      explanation:
        "Kalimat yang tepat memakai koma untuk memisahkan keterangan yang mendahului induk kalimat. Pilihan lain salah karena menempatkan titik dua setelah kata kerja, memakai tanda hubung sebagai pengganti koma, atau menghilangkan koma sebelum kata dan pada perincian.",
    },
  },
  "SKD-SERI-01.json": {
    4: {
      explanation:
        "Kontrak beasiswa adalah perjanjian yang mengikat secara hukum, sehingga pelanggarannya diselesaikan melalui mekanisme hukum, bukan dengan penilaian moral sepihak. Nasionalisme justru tampak pada kesediaan menepati janji pengabdian yang menjadi syarat beasiswa. Menilai awardee yang tidak kembali pasti tidak nasionalis terlalu menyederhanakan, sedangkan membenarkan pelanggaran kontrak melemahkan tujuan beasiswa itu sendiri.",
    },
    30: {
      explanation:
        "Aposisi, yaitu keterangan yang menjelaskan atau menggantikan kata sebelumnya, dipisahkan dengan koma di depan dan di belakangnya. Penulisan yang tepat adalah Bapak Joko, Presiden Indonesia ke-7, memimpin sidang. Tanda kurung, tanda hubung, dan titik dua tidak dipakai untuk aposisi seperti itu, dan kata ulang menteri-menteri tetap memakai tanda hubung.",
    },
  },
  "SKD-SERI-02.json": {
    26: {
      explanation:
        "Kalimat aslinya memakai bentuk tidak baku dimana, pengulangan kata kasus, dan frasa para masyarakat yang berlebihan. Perbaikan yang tepat menghilangkan dimana, memakai masyarakat tanpa para, dan menyusun hubungan sebab-akibat dengan sehingga. Pilihan lain masih mempertahankan dimana atau bentuk berlebihan seperti masyarakat-masyarakat dan para masyarakat.",
    },
    28: {
      explanation:
        "Bentuk baku menurut PUEBI adalah aktivitas, daring sebagai padanan online, pascapandemi yang ditulis serangkai, dan generasi Z dengan huruf kapital pada Z. Pilihan lain memakai aktifitas, post-pandemic, pasca-pandemi, onlen, atau penulisan generasi-Z yang tidak sesuai kaidah.",
    },
    30: {
      explanation:
        "Anak kalimat yang mendahului induk kalimat dipisahkan dengan koma, dan perincian tiga unsur atau lebih memakai koma termasuk sebelum kata dan. Kalimat yang tepat menuliskan Setelah membaca buku, novel, dan majalah, saya merasa wawasan bertambah luas. Titik koma, titik dua, atau penghilangan koma sebelum dan membuat kalimat tidak sesuai kaidah.",
    },
  },
  "SKD-SERI-03.json": {
    28: {
      explanation:
        "Penulisan yang tepat memakai Rp tanpa titik dan tanpa spasi, titik sebagai pemisah ribuan, koma untuk sen, serta kata miliar sesuai KBBI. Bentuk milyar, Rp. dengan titik, huruf r kecil, atau tanda hubung di akhir angka tidak sesuai PUEBI.",
    },
  },
};

let n = 0;
for (const [file, map] of Object.entries(FIX)) {
  const path = join(DIR, file);
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  for (const [num, patch] of Object.entries(map)) {
    const q = pkg.questions.find((x) => x.number === Number(num));
    if (!q) { console.log(`TIDAK ADA ${file} #${num}`); continue; }
    if (patch.options) Object.assign(q.options, patch.options);
    q.explanation = patch.explanation;
    n++;
  }
  writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
}
console.log("pembahasan generik diperbaiki:", n);
