import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    paragraphs: [
      "Saat Anda membuat akun, kami mengumpulkan nama, alamat email, nomor WhatsApp, dan informasi sekolah yang Anda berikan. Kami juga menyimpan data transaksi dan paket yang Anda miliki agar layanan dapat diberikan dengan benar.",
      "Saat Anda menggunakan platform, sistem dapat mencatat aktivitas yang diperlukan untuk menjalankan layanan, seperti progres tryout, jawaban, skor, waktu pengerjaan, dan aktivitas keamanan akun.",
    ],
  },
  {
    title: "2. Cara Kami Menggunakan Data",
    paragraphs: [
      "Data digunakan untuk membuat dan mengelola akun, memberikan akses paket, memproses konfirmasi pembayaran, menampilkan hasil tryout, menyediakan pembahasan, menjaga keamanan, serta membantu admin menangani pertanyaan Anda.",
      "Skor dan nama profil dapat ditampilkan pada leaderboard jika fitur tersebut tersedia. Anda dapat mengatur visibilitas nama melalui pengaturan akun bila pilihan itu tersedia.",
    ],
  },
  {
    title: "3. Pembayaran dan WhatsApp",
    paragraphs: [
      "Untuk pemesanan manual, informasi pesanan ditampilkan agar Anda dapat menghubungi admin melalui WhatsApp. Bukti transfer yang diunggah digunakan untuk verifikasi pembayaran. Jangan mengirim kata sandi atau kode verifikasi melalui WhatsApp.",
      "Jika metode pembayaran otomatis tersedia, data pembayaran yang diperlukan diproses oleh penyedia pembayaran terkait. Informasi kartu atau kredensial pembayaran tidak disimpan oleh FBK kecuali dinyatakan secara khusus.",
    ],
  },
  {
    title: "4. Penyimpanan dan Keamanan",
    paragraphs: [
      "Data disimpan pada infrastruktur penyedia layanan yang kami gunakan untuk menjalankan platform. Kami menerapkan pembatasan akses dan langkah keamanan yang wajar untuk melindungi data, tetapi tidak ada sistem elektronik yang dapat dijamin aman sepenuhnya.",
      "Kami menyimpan data selama akun dan layanan masih digunakan atau selama diperlukan untuk administrasi, keamanan, dan kewajiban hukum. Data tryout atau transaksi tertentu dapat disimpan sebagai riwayat layanan.",
    ],
  },
  {
    title: "5. Berbagi Data",
    paragraphs: [
      "Kami tidak menjual data pribadi Anda. Data hanya dapat diproses oleh penyedia teknis yang membantu menjalankan platform, atau dibagikan bila diwajibkan hukum maupun diperlukan untuk melindungi keamanan pengguna dan layanan.",
    ],
  },
  {
    title: "6. Hak dan Pilihan Anda",
    paragraphs: [
      "Anda dapat meminta koreksi data profil atau menanyakan penghapusan akun dengan menghubungi admin melalui WhatsApp. Beberapa data transaksi, keamanan, atau hasil yang diperlukan untuk operasional dapat tetap disimpan selama masih dibutuhkan.",
      "Anda dapat mengatur apakah nama profil ditampilkan pada leaderboard melalui pengaturan akun jika opsi tersebut tersedia.",
    ],
  },
  {
    title: "7. Perubahan Kebijakan",
    paragraphs: [
      "Kebijakan ini dapat diperbarui bila layanan atau aturan yang berlaku berubah. Versi terbaru akan ditampilkan pada halaman ini beserta tanggal pembaruannya.",
    ],
  },
];

export function PrivacyPolicyView() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] px-5 py-10 text-slate-800 dark:bg-[#111923] dark:text-slate-100 sm:px-8 sm:py-14">
      <SEO
        title="Kebijakan Privasi"
        description="Kebijakan privasi Future Bimbel Kedinasan: data yang dikumpulkan, cara penggunaan, penyimpanan, keamanan, dan pilihan pengguna."
        url="https://www.futurebimbelkedinasan.com/privacy-policy"
      />
      <article className="mx-auto max-w-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#15202d] sm:p-10 lg:p-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 dark:text-blue-200 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>

        <div className="mb-8 border-b border-blue-100 pb-7 dark:border-white/10">
          <div className="mb-4 flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Informasi Legal</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#102b54] dark:text-white sm:text-4xl">Kebijakan Privasi</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Terakhir diperbarui: 23 November 2026</p>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            Halaman ini menjelaskan data yang diproses saat Anda menggunakan Future Bimbel Kedinasan (FBK), alasan penggunaannya, dan pilihan yang tersedia bagi Anda.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="mb-3 text-base font-bold text-[#102b54] dark:text-white">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-[14px] leading-7 text-slate-700 dark:text-slate-300">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-blue-100 pt-6 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <p className="font-semibold text-[#102b54] dark:text-white">Pertanyaan tentang data Anda?</p>
          <a href="https://wa.me/6287753646617" target="_blank" rel="noreferrer" className="mt-2 inline-flex font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-600 dark:text-blue-200 dark:hover:text-white">
            Hubungi admin melalui WhatsApp
          </a>
        </div>
      </article>
    </main>
  );
}
