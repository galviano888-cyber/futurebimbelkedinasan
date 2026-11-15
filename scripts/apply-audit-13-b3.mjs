import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const get = (n) => pkg.questions.find((x) => x.number === n);
const patch = (n, d) => {
  const q = get(n);
  if (!q) throw new Error("tidak ada #" + n);
  if (d.stem) q.question_text = d.stem;
  if (d.options) q.options = d.options;
  if (d.key) q.correct_answer = d.key;
  if (d.explanation) q.explanation = d.explanation;
};

/* #21 — pengecoh terlalu mudah */
patch(21, {
  options: {
    A: "Seluruh undang-undang tidak lagi memiliki kekuatan hukum mengikat",
    B: "Pasal tersebut tidak lagi memiliki kekuatan hukum mengikat",
    C: "Pasal tersebut tetap berlaku secara formal tetapi tidak dapat diterapkan",
    D: "Pasal tersebut hanya tidak berlaku bagi pihak yang mengajukan uji materiil",
    E: "Pasal tersebut berlaku kembali jika pemerintah menerbitkan aturan pelaksana",
  },
  explanation:
    "Putusan Mahkamah Konstitusi berlaku umum dan mengikat sejak diucapkan, sehingga pasal yang dibatalkan kehilangan kekuatan hukum mengikat untuk semua pihak, bukan hanya pemohon. Undang-undang secara keseluruhan tidak ikut batal, dan aturan pelaksana baru tidak menghidupkan kembali pasal yang telah dinyatakan bertentangan dengan UUD.",
});

/* #22 — hilangkan opsi yang berpotensi benar ganda */
patch(22, {
  options: {
    A: "Peraturan presiden otomatis membatalkan undang-undang yang bertentangan",
    B: "Peraturan presiden berlaku hanya bagi pegawai kementerian yang bersangkutan",
    C: "Peraturan presiden memiliki kedudukan setara dengan undang-undang",
    D: "Peraturan presiden hanya berlaku setelah memperoleh persetujuan DPR",
    E: "Peraturan presiden tidak dapat mengesampingkan undang-undang yang lebih tinggi",
  },
  explanation:
    "Hierarki norma menempatkan undang-undang di atas peraturan presiden. Peraturan presiden tidak dapat mengesampingkan undang-undang, tidak setara dengannya, dan tidak memerlukan persetujuan DPR karena bukan jenis peraturan yang dibentuk bersama legislatif. Pertentangan norma diselesaikan melalui pengujian ke Mahkamah Agung.",
});

/* #23 — pengecoh satu arah, dibuat menjadi argumen formal yang masuk akal */
patch(23, {
  stem: "Pancasila berkedudukan sebagai dasar negara. Sebuah kebijakan publik telah disahkan melalui prosedur yang sah, tetapi isinya bertentangan dengan nilai keadilan sosial. Ditinjau dari kedudukan Pancasila, kebijakan tersebut ...",
  options: {
    A: "Tidak sah karena kebijakan wajib selaras dengan nilai dasar negara",
    B: "Tetap sah karena prosedur pembentukannya sudah sesuai ketentuan",
    C: "Tetap sah karena nilai Pancasila bersifat filosofis, bukan norma hukum",
    D: "Sah selama tidak ada pihak yang mengajukan keberatan secara formal",
    E: "Sah karena penjabaran nilai dasar cukup dilakukan oleh pembentuk undang-undang",
  },
  key: "A",
  explanation:
    "Prosedur yang sah tidak menghapus kewajiban kesesuaian materi dengan dasar negara. Pancasila merupakan sumber nilai yang mengikat, sehingga kebijakan yang bertentangan dengannya kehilangan legitimasi meskipun pembentukannya formal. Pilihan lain memisahkan prosedur dari substansi, atau menempatkan Pancasila hanya sebagai pedoman moral.",
});

/* #25 — kunci ganda: opsi E juga sepenuhnya baku */
patch(25, {
  options: {
    A: "Panitia menyusun jadual acara sebelum mengajukan ijin penggunaan aula.",
    B: "Panitia menyusun jadwal acara sebelum mengajukan izin penggunaan aula.",
    C: "Panitia menyusun jadual acara sebelum mengajukan izin penggunaan aula.",
    D: "Panitia menyusun jadwal acara sebelum mengajukan ijin penggunaan aula.",
    E: "Panitia menyusun jadwal acara sebelum mengajukan ijin pemakaian ruangan.",
  },
  explanation:
    "Bentuk baku menurut KBBI adalah jadwal dan izin. Hanya satu opsi yang bebas dari kedua bentuk tidak baku tersebut; opsi lain memuat jadual atau ijin. Pemakaian ruangan tidak menjadikan kalimat salah, tetapi bentuk ijin tetap tidak baku.",
});

/* #29 — opsi B tertukar dengan soal lain */
patch(29, {
  options: {
    A: "Kepala sekolah menegur guru, yang sering terlambat karena sering lembur.",
    B: "Karena sering lembur, guru itu sering terlambat sehingga kepala sekolah menegurnya.",
    C: "Kepala sekolah, karena sering lembur, menegur guru yang terlambat.",
    D: "Guru yang sering terlambat menegur kepala sekolah karena sering lembur.",
    E: "Kepala sekolah sering lembur karena menegur guru yang terlambat.",
  },
  explanation:
    "Kalimat aslinya ambigu karena keterangan sebab dapat menerangkan keterlambatan guru atau tindakan menegur. Menyusun ulang peristiwa secara berurutan, yaitu guru sering lembur sehingga terlambat lalu ditegur, membuat makna kalimat menjadi tunggal. Pilihan lain memindahkan pelaku atau tetap mempertahankan kekaburan.",
});

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
console.log("batch 3 diterapkan: 21, 22, 23, 25, 29");
