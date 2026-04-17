import { ArrowRight, CheckCircle2, Shield, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageViewProps {
  onEnter: () => void;
}

export function LandingPageView({ onEnter }: LandingPageViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Future Bimbel</span>
        </div>
        <Button 
          onClick={onEnter}
          variant="ghost" 
          className="text-white hover:text-blue-400 hover:bg-white/5 font-medium"
        >
          Masuk / Daftar
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-blue-400" />
              <span>Bimbel Kedinasan Terpercaya 2024</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Lulus Sekolah Kedinasan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Lebih Mudah.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Persiapkan dirimu menghadapi tes SKD dengan materi terupdate, ratusan soal latihan akurat, dan kelas interaktif bersama ahlinya.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button 
                onClick={onEnter}
                className="w-full sm:w-auto h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
              >
                Mulai Belajar Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-slate-500 text-sm">Tanpa kartu kredit.</p>
            </div>
            
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8">
              <div>
                <h4 className="text-3xl font-bold text-white mb-1">98%</h4>
                <p className="text-slate-400 text-sm">Tingkat Kelulusan</p>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div>
                <h4 className="text-3xl font-bold text-white mb-1">5k+</h4>
                <p className="text-slate-400 text-sm">Siswa Aktif</p>
              </div>
            </div>
          </div>
          
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Dekorasi belakang gambar */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-3xl transform rotate-3 scale-105 blur-sm" />
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-800/50 backdrop-blur-sm aspect-[4/5] flex items-end justify-center">
              <img 
                src="/hero-image.png" 
                alt="Taruna Kedinasan" 
                className="w-full h-auto object-cover object-bottom drop-shadow-2xl"
              />
              {/* Floating Badge */}
              <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center gap-3 shadow-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Terverifikasi</p>
                  <p className="text-slate-300 text-xs">Materi SKD 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Kami menyediakan ekosistem belajar yang dirancang khusus untuk memaksimalkan peluangmu lolos tes kedinasan.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Soal HOTS Terakurat</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bank soal kami selalu diperbarui mengikuti kisi-kisi terbaru BKN. Dilengkapi pembahasan mendalam untuk TWK, TIU, dan TKP.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Kelas Interaktif</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Belajar langsung dengan pengajar ahli melalui Zoom. Dapatkan tips, trik cepat menjawab, dan sesi tanya jawab eksklusif.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Evaluasi Real-time</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pantau perkembangan nilaimu lewat grafik statistik komprehensif. Cari tahu kelemahanmu dan perbaiki sebelum hari H.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-sm">© 2024 Future Bimbel Kedinasan. All rights reserved.</p>
      </footer>
    </div>
  );
}
