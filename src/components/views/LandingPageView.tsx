import { ArrowRight, CheckCircle2, Shield, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageViewProps {
  onEnter: () => void;
}

export function LandingPageView({ onEnter }: LandingPageViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto backdrop-blur-md bg-slate-900/50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Future Bimbel</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#fitur" className="hover:text-blue-400 transition-colors">Fitur</a>
          <a href="#katalog" className="hover:text-blue-400 transition-colors">Paket</a>
          <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
        </div>
        <Button 
          onClick={onEnter}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          Masuk / Daftar
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-blue-400" />
              <span>Bimbel Kedinasan Terpercaya 2026</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              Lulus Sekolah Kedinasan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700">Impianmu.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Persiapkan dirimu menghadapi tes SKD dengan materi terupdate, ratusan soal latihan akurat, dan kelas interaktif bersama ahlinya.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button 
                onClick={onEnter}
                className="w-full sm:w-auto h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
              >
                Mulai Belajar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-slate-500 text-sm font-medium">Gabung dengan 5,000+ siswa lainnya.</p>
            </div>
            
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8">
              <div>
                <h4 className="text-3xl font-black text-white mb-0">98%</h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tingkat Kelulusan</p>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div>
                <h4 className="text-3xl font-black text-white mb-0">150+</h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tryout Akurat</p>
              </div>
            </div>
          </div>
          
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-10 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-emerald-500/20 rounded-3xl transform rotate-3 scale-105 blur-3xl" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-700 shadow-2xl p-8 transform rotate-[-1deg] hover:rotate-0 transition-all duration-700 hover:shadow-blue-500/30 hover:border-slate-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <div className="h-4 w-28 bg-slate-700 rounded-md mb-2"></div>
                    <div className="h-3 w-16 bg-slate-800 rounded-md"></div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase">Premium</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Skor SKD</div>
                  <div className="text-4xl font-black text-white tracking-tighter">452</div>
                </div>
                <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Ranking</div>
                  <div className="text-4xl font-black text-blue-500 tracking-tighter">#12</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600/20 to-transparent p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="text-sm font-black text-white mb-1">Materi TIU: Analogi Verbal</div>
                  <div className="text-xs text-slate-400 font-medium">Selesai dalam 15 menit • 100% Benar</div>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="fitur" className="py-32 bg-slate-900 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Kenapa Harus <span className="text-blue-500">Future Bimbel?</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Kami menyediakan ekosistem belajar paling lengkap untuk persiapan tes kedinasan tahun ini.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-black mb-3 text-white">Soal HOTS Akurat</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Bank soal kami dirancang khusus mengikuti tingkat kesulitan tes asli. Dilengkapi pembahasan yang mudah dipahami.
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-black mb-3 text-white">Live Class Zoom</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Belajar langsung dengan tentor lulusan kedinasan terbaik. Sesi tanya jawab interaktif sampai kamu benar-benar paham.
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/50 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black mb-3 text-white">Analisis Cerdas</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Dapatkan laporan performa detail tiap kategori (TWK, TIU, TKP) untuk mengetahui bagian mana yang perlu kamu perbaiki.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing/Katalog Section */}
      <div id="katalog" className="py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 tracking-tight text-white">Pilih Paket <span className="text-blue-500">Belajarmu</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Investasi terbaik untuk masa depan karier kedinasanmu dimulai dari sini.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Paket Satuan */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col hover:border-slate-600 transition-colors">
              <div className="mb-8">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Satuan</span>
                <h3 className="text-2xl font-black text-white mt-4">Tryout Satuan</h3>
                <p className="text-slate-500 text-sm mt-2">Cocok untuk pemanasan.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-white">Rp 25rb</span>
                <span className="text-slate-500 text-sm font-bold">/ paket</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['1x Simulasi SKD', 'Pembahasan Lengkap', 'Ranking Nasional', 'Masa Aktif 30 Hari'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onEnter} className="w-full h-14 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-2xl">Pilih Paket</Button>
            </div>

            {/* Paket Bundle - Populer */}
            <div className="bg-slate-900 border-2 border-blue-500 p-8 rounded-[2.5rem] flex flex-col relative scale-105 shadow-2xl shadow-blue-500/20 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Paling Populer</div>
              <div className="mb-8">
                <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Bundle</span>
                <h3 className="text-2xl font-black text-white mt-4">Paket 10 Tryout</h3>
                <p className="text-slate-500 text-sm mt-2">Persiapan intensif mandiri.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-white">Rp 149rb</span>
                <span className="text-slate-500 text-sm font-bold">/ paket</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['10x Simulasi SKD', 'Bank Soal 1000+', 'Pembahasan Video', 'Ranking Nasional', 'Grup Diskusi Siswa'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onEnter} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl">Beli Sekarang</Button>
            </div>

            {/* Paket Intensif */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col hover:border-slate-600 transition-colors">
              <div className="mb-8">
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Program</span>
                <h3 className="text-2xl font-black text-white mt-4">Intensif Live</h3>
                <p className="text-slate-500 text-sm mt-2">Bimbingan sampai lulus.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-white">Rp 299rb</span>
                <span className="text-slate-500 text-sm font-bold">/ paket</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['Akses Semua Tryout', 'Live Zoom Tiap Hari', 'Materi PDF Eksklusif', 'Konsultasi 1-on-1', 'Jaminan Materi Akurat'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onEnter} className="w-full h-14 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-2xl">Daftar Sekarang</Button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-32 bg-slate-900">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Kapan saya bisa mengakses materi setelah membayar?", a: "Akses akan dibuka maksimal 1x24 jam setelah bukti pembayaran dikonfirmasi oleh admin." },
              { q: "Apakah soal tryout disesuaikan dengan kisi-kisi terbaru?", a: "Ya, tim kami selalu memperbarui bank soal mengikuti tren soal SKD Kedinasan tahun 2024-2025." },
              { q: "Bisakah saya refund jika berubah pikiran?", a: "Mohon maaf, sesuai kebijakan kami, tidak ada pengembalian dana setelah akses materi diberikan." }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-white mb-2">{item.q}</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-left mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="text-xl font-bold text-white">Future Bimbel</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Platform bimbingan belajar khusus kedinasan nomor satu di Indonesia. Fokus pada kualitas materi dan kelulusan siswa.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Navigasi</h4>
            <ul className="space-y-3 text-slate-500 text-sm font-medium">
              <li><a href="#fitur" className="hover:text-white transition-colors">Fitur Utama</a></li>
              <li><a href="#katalog" className="hover:text-white transition-colors">Katalog Paket</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Tanya Jawab</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Kontak Kami</h4>
            <p className="text-slate-500 text-sm mb-4 font-medium">Butuh bantuan? Hubungi kami via WhatsApp atau Email.</p>
            <div className="space-y-3">
              <p className="text-blue-500 text-sm font-black">support@fbk-kedinasan.com</p>
              <p className="text-slate-300 text-sm font-black">+62 883-1294-033</p>
            </div>
          </div>
        </div>
        <div className="pt-10 border-t border-slate-900 text-center">
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">© 2026 Future Bimbel Kedinasan. Dibuat dengan Bangga di Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
