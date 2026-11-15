import { readFileSync, writeFileSync } from "node:fs";

const DIR = "D:\\BIMBEL FBKKKKKKKKKKKKKKKKKKKKK\\publish soal";
const path = DIR + "\\SKD-13.json";
const pkg = JSON.parse(readFileSync(path, "utf8"));
const L = ["A", "B", "C", "D", "E"];
const get = (n) => pkg.questions.find((x) => x.number === n);

const patch = (n, data) => {
  const q = get(n);
  if (!q) throw new Error("tidak ada #" + n);
  if (data.stem) q.question_text = data.stem;
  if (data.options) q.options = data.options;
  if (data.key) q.correct_answer = data.key;
  if (data.explanation) q.explanation = data.explanation;
  if (data.scores) q.tkp_scores = data.scores;
};

/* ---------- BATCH 1: TWK 1-10 ---------- */

patch(1, {
  stem: "Sekolah Aruna menerima peserta pertukaran pelajar. Sebagian dari mereka menilai upacara bendera sebagai kegiatan kuno dan menolak mengikutinya. Beberapa siswa mengusulkan agar mereka dikeluarkan dari kegiatan sekolah. Sikap yang paling tepat adalah ...",
  options: {
    A: "Menjelaskan makna simbol negara dan tetap melibatkan mereka dalam kegiatan",
    B: "Meminta sekolah membatasi keikutsertaan mereka dalam upacara",
    C: "Mengabaikan sikap mereka karena mereka tamu yang perlu dihormati",
    D: "Melaporkan mereka kepada pihak berwenang karena menghina simbol negara",
    E: "Mengajak siswa lain menjauhi mereka agar tidak terpengaruh",
  },
  key: "A",
  explanation:
    "Ada dua kepentingan yang harus ditimbang: penghormatan pada simbol negara dan kewajiban sekolah mendidik, bukan mengeluarkan siswa. Menjelaskan makna simbol negara sambil tetap melibatkan mereka memenuhi keduanya. Membatasi, mengabaikan, melaporkan, atau menjauhi hanya menyelesaikan satu sisi dan menimbulkan masalah baru.",
});

patch(2, {
  stem: "Desa memiliki anggaran terbatas. Sebagian warga mengusulkan festival budaya, sebagian lain mengusulkan perbaikan jalan penghubung antardusun. Kedua usulan memiliki pendukung kuat dan tidak dapat dibiayai sekaligus. Sebagai anggota tim perencana, tindakan yang paling tepat adalah ...",
  options: {
    A: "Menetapkan festival budaya karena nilai budaya tidak dapat diukur secara ekonomi",
    B: "Menetapkan perbaikan jalan karena manfaat ekonominya lebih langsung dirasakan",
    C: "Membandingkan manfaat keduanya melalui musyawarah dan data sebelum memutuskan",
    D: "Membagi anggaran secara merata tanpa mempertimbangkan skala kebutuhan",
    E: "Menunda kedua program sampai anggaran daerah bertambah tahun berikutnya",
  },
  key: "C",
  explanation:
    "Kedua usulan sah dengan dasar berbeda: nilai budaya dan manfaat ekonomi. Keputusan publik yang dapat dipertanggungjawabkan menuntut perbandingan manfaat berbasis data dan musyawarah, bukan penetapan sepihak atau pembagian merata yang mengabaikan skala kebutuhan. Karena itu membandingkan lebih dahulu adalah langkah yang paling tepat.",
});

patch(3, {
  stem: "Survei pembeli produk UMKM Baskara menunjukkan 60% menilai kemasan kurang menarik, 25% menilai harga terlalu tinggi, dan 15% menilai produk belum bersertifikat halal. Anggaran perbaikan hanya cukup untuk satu prioritas utama disertai perbaikan bertahap. Tindakan yang paling tepat adalah ...",
  options: {
    A: "Menurunkan harga seluruh produk agar bersaing dengan barang impor",
    B: "Memperbaiki kemasan lebih dahulu, lalu mengurus sertifikasi bertahap",
    C: "Menghentikan penjualan daring dan memfokuskan pemasaran lokal",
    D: "Meminta pemerintah membatasi peredaran barang impor di pasar daring",
    E: "Mengganti merek produk agar tampak seperti produk impor",
  },
  key: "B",
  explanation:
    "Data menunjukkan faktor terbesar adalah kemasan (60%), jauh di atas harga (25%) dan sertifikasi (15%). Dengan anggaran satu prioritas, tindakan harus mengikuti faktor dominan lalu menanganinya secara bertahap. Memperbaiki kemasan lebih dahulu konsisten dengan data dan batas anggaran, sedangkan pilihan lain menjawab faktor kecil atau tidak menjawab penyebab yang terukur.",
});

patch(4, {
  stem: "Seorang atlet Cempaka menerima tawaran membela negara lain dengan imbalan jauh lebih besar. Ia tetap memilih memperkuat tim nasional meski penghasilannya lebih kecil. Makna paling mendasar dari tindakan tersebut adalah ...",
  options: {
    A: "Keputusan yang wajar karena membela negara lain juga diakui secara internasional",
    B: "Pilihan yang tidak perlu dibanggakan karena prestasi tetap milik pribadi",
    C: "Tindakan yang baru bernilai jika pemerintah menjamin karier pascapensiun",
    D: "Nasionalisme yang menempatkan pengabdian di atas keuntungan pribadi",
    E: "Sikap kurang rasional karena kesejahteraan pribadi seharusnya prioritas",
  },
  key: "D",
  explanation:
    "Pilihan atlet tersebut menunjukkan pengabdian pada bangsa mengalahkan imbalan materi. Itu bukan penolakan kesejahteraan, melainkan penempatan prioritas nilai ketika keduanya bertabrakan. Pilihan lain menilai tindakan dengan tolok ukur yang berbeda, sehingga tidak menangkap makna pengabdian.",
});

patch(6, {
  options: {
    A: "Mewajibkan seluruh pegawai berbahasa Indonesia termasuk saat berkomunikasi pribadi",
    B: "Menegur pegawai yang berbahasa asing di depan rekan kerja lain agar jera",
    C: "Menggunakan bahasa Indonesia dalam forum resmi dan tetap menghargai bahasa asing",
    D: "Menyampaikan bahwa bahasa asing hanya boleh dipakai untuk istilah teknis",
    E: "Membiarkan karena bahasa asing dinilai lebih menunjukkan wawasan modern",
  },
});

patch(7, {
  stem: "Kegiatan selesai dengan sisa dana Rp5.000.000. Laporan harus diserahkan besok, sedangkan mekanisme pengembalian ke kas memerlukan dua minggu. Seorang anggota mengusulkan sisa dana dipakai untuk kegiatan lanjutan yang bermanfaat tetapi belum dianggarkan. Tindakan yang paling tepat adalah ...",
  options: {
    A: "Mengembalikan sisa dana melalui mekanisme resmi meski laporan terlambat",
    B: "Menggunakan sisa dana untuk kegiatan lanjutan yang bermanfaat bagi peserta",
    C: "Menggunakan sisa dana setelah memperoleh persetujuan lisan pemberi dana",
    D: "Mencatat sisa dana sebagai biaya tak terduga agar laporan tepat waktu",
    E: "Menyimpan sisa dana sampai penyusunan anggaran kegiatan berikutnya",
  },
  key: "A",
  explanation:
    "Usulan B dan C berangkat dari niat baik, tetapi dana yang tidak dianggarkan tidak boleh dibelanjakan dan persetujuan lisan tidak menggantikan prosedur. Pengembalian melalui mekanisme resmi tetap merupakan pilihan yang sah meskipun laporan menjadi terlambat, karena keterlambatan dapat dijelaskan sedangkan penggunaan dana di luar peruntukan sulit dipertanggungjawabkan.",
});

/* ---------- BATCH 2: TWK 11-20 ---------- */

patch(11, {
  stem: "Harum mengetahui rekan satu tim memakai kendaraan dinas untuk mengantar keluarganya pada akhir pekan. Rekan itu berdalih pemakaiannya singkat dan tidak merugikan. Rekan tersebut juga pernah membantunya menyelesaikan pekerjaan mendesak. Tindakan yang paling tepat adalah ...",
  options: {
    A: "Mengingatkan bahwa kendaraan dinas hanya untuk keperluan dinas",
    B: "Membiarkan karena pemakaiannya singkat dan rekan pernah membantunya",
    C: "Ikut memakai kendaraan dinas agar tidak merasa dirugikan",
    D: "Melaporkan langsung ke inspektorat tanpa memberi kesempatan perbaikan",
    E: "Menegur rekan di depan anggota tim lain agar menimbulkan efek jera",
  },
  key: "A",
  explanation:
    "Jasa personal rekan tidak menghapus status penyalahgunaan aset negara, sehingga alasan pada pilihan B tidak dapat diterima. Untuk pelanggaran pertama yang ringan, mengingatkan lebih dahulu tetap memberi kesempatan perbaikan sekaligus menjaga prosedur, sedangkan pelaporan langsung tanpa dialog bersifat tidak proporsional.",
});

patch(12, {
  stem: "Seorang pegawai menemukan kesalahan pada laporan yang telah ia serahkan, tetapi laporan itu sudah dipakai dalam rapat. Kesalahan tersebut belum diketahui siapa pun. Perilaku yang mencerminkan integritas pada situasi tersebut adalah ...",
  options: {
    A: "Melaporkan kesalahan dan mengusulkan perbaikan kepada atasan",
    B: "Memperbaiki dokumen tanpa memberi tahu pihak yang telah menerima",
    C: "Menunggu sampai ada pihak yang menemukan kesalahan tersebut",
    D: "Menyalahkan data yang diberikan rekan agar tidak dipersalahkan",
    E: "Menyimpan versi perbaikan secara pribadi sebagai bukti di kemudian hari",
  },
  key: "A",
  explanation:
    "Laporan yang sudah dipakai berpotensi memengaruhi keputusan, sehingga kesalahan harus diungkapkan, bukan diperbaiki diam-diam. Melaporkan sekaligus mengusulkan perbaikan memungkinkan koreksi diambil sebelum dampaknya meluas, sementara perbaikan tanpa keterbukaan membuat pengambil keputusan tetap memakai data keliru.",
});

patch(14, {
  stem: "Jatmiko melihat fasilitas umum di lingkungannya rusak dan tidak dirawat selama berbulan-bulan. Warga sekitar menganggap perawatan sepenuhnya tanggung jawab pemerintah. Jika Jatmiko ingin menyelesaikan masalah dengan cara yang paling berdampak dan berkelanjutan, tindakan yang paling tepat adalah ...",
  options: {
    A: "Melaporkan kerusakan dan mengajak warga bergotong royong merawatnya",
    B: "Menyebarkan foto kerusakan ke media sosial agar pemerintah bertindak",
    C: "Menunggu pemerintah daerah memperbaiki karena itu tugas negara",
    D: "Membongkar fasilitas yang rusak agar tidak menimbulkan bahaya",
    E: "Mengajukan permohonan anggaran perbaikan melalui musyawarah warga",
  },
  key: "A",
  explanation:
    "Kriteria pada stem adalah berdampak sekaligus berkelanjutan. Pelaporan saja bergantung pada pihak lain, sedangkan gotong royong langsung memperbaiki keadaan dan menumbuhkan kepedulian warga. Mengajukan anggaran adalah jalur sah, tetapi hanya menyelesaikan aspek pendanaan tanpa perawatan bersama.",
});

patch(15, {
  options: {
    A: "Mengamankan akun, melapor ke tim keamanan siber, dan menginformasikan insiden",
    B: "Menghapus akun lalu membuat akun baru tanpa melaporkan insidennya",
    C: "Membalas informasi palsu melalui akun pribadi agar warga tahu fakta",
    D: "Menunggu penyedia layanan mengembalikan akun sebelum memberi keterangan",
    E: "Menutup seluruh layanan digital instansi sampai penyelidikan selesai",
  },
});

patch(16, {
  stem: "Laras mencurigai adanya peredaran narkotika di lingkungan tempat tinggalnya, tetapi belum memiliki bukti yang cukup. Ia khawatir laporannya justru menimbulkan fitnah. Tindakan yang paling tepat adalah ...",
  options: {
    A: "Melaporkan informasi yang dimiliki kepada aparat untuk ditindaklanjuti",
    B: "Menyebarkan dugaan itu ke grup warga agar semua ikut berhati-hati",
    C: "Mendatangi orang yang dicurigai dan menanyakan kebenarannya langsung",
    D: "Membiarkan karena belum ada bukti dan berisiko menimbulkan fitnah",
    E: "Menunggu warga lain yang lebih berani melapor kepada pihak berwenang",
  },
  key: "A",
  explanation:
    "Menyebarkan dugaan tanpa bukti berisiko fitnah, sedangkan mendiamkan membiarkan peredaran berlanjut. Melapor kepada aparat memungkinkan verifikasi tanpa memperluas tuduhan, sehingga risiko fitnah dan risiko ancaman dapat ditekan sekaligus.",
});

patch(17, {
  stem: "Seorang warga mengetahui tetangganya menyebarkan informasi bahwa kelompok tertentu tidak berhak tinggal di lingkungan itu. Informasi tersebut mulai dipercaya warga. Tindakan yang paling mencerminkan bela negara adalah ...",
  options: {
    A: "Menelusuri kebenaran informasi dan mengajak warga menahan diri",
    B: "Meneruskan informasi agar warga lain ikut berhati-hati",
    C: "Membiarkan karena informasi itu belum menimbulkan keributan",
    D: "Meminta tetangga tersebut pindah dari lingkungan",
    E: "Melaporkan warga yang percaya informasi itu kepada aparat",
  },
  key: "A",
  explanation:
    "Informasi yang menyerukan penyingkiran kelompok berpotensi memicu konflik, sehingga perlu diverifikasi lebih dahulu. Menelusuri kebenaran sambil mengajak warga menahan diri meredakan ketegangan tanpa memperluas penyebaran maupun menghukum pihak yang belum terbukti bersalah.",
});

patch(18, {
  options: {
    A: "Menggalang bantuan dan bergabung dalam tim relawan terkoordinasi",
    B: "Menyalurkan bantuan melalui lembaga resmi tanpa turun ke lokasi",
    C: "Mengunggah informasi bencana tanpa memverifikasi kebenarannya",
    D: "Mengumpulkan donasi tanpa mencatat penggunaan dana yang terkumpul",
    E: "Menghindari keterlibatan karena bukan wilayah tempat tinggalnya",
  },
});

patch(20, {
  options: {
    A: "Tepat karena daerah lebih memahami kondisi wilayahnya sendiri",
    B: "Tepat selama izin diberikan kepada perusahaan milik daerah",
    C: "Tidak tepat karena melampaui kewenangan yang telah dibagi",
    D: "Tidak tepat karena daerah tidak boleh mengelola sumber daya",
    E: "Tepat jika pemerintah pusat telah melimpahkan kewenangan itu",
  },
});

writeFileSync(path, JSON.stringify(pkg, null, 2), "utf8");
console.log("batch 1-2 diterapkan:", [1, 2, 3, 4, 6, 7, 11, 12, 14, 15, 16, 17, 18, 20].length, "soal");
