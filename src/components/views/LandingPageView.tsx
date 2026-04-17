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
          
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-10">
            {/* Dekorasi glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-emerald-500/20 rounded-3xl transform rotate-3 scale-105 blur-3xl" />
            
            {/* Dashboard Mockup Card */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl p-6 md:p-8 transform rotate-[-1deg] hover:rotate-0 transition-all duration-500 hover:shadow-blue-500/20 hover:border-slate-600">
              
              {/* Mockup Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div>
                    <div className="h-4 w-28 bg-slate-700 rounded-md mb-2"></div>
                    <div className="h-3 w-16 bg-slate-800 rounded-md"></div>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold tracking-wider">PRO</span>
                </div>
              </div>

              {/* Mockup Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs font-medium mb-2">Skor Rata-rata SKD</div>
                  <div className="text-3xl font-black text-white">415</div>
                  <div className="text-emerald-400 text-xs mt-2 flex items-center font-medium">
                    <span className="mr-1">↑</span> +12 poin dari tryout lalu
                  </div>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs font-medium mb-2">Progress Belajar</div>
                  <div className="text-3xl font-black text-white">85%</div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 w-[85%] h-full rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Mockup Active Item */}
              <div className="bg-gradient-to-r from-blue-600/10 to-blue-400/5 p-5 rounded-2xl border border-blue-500/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-bold text-white mb-1">Simulasi SKD Nasional Batch 3</div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">⏱ 100 Menit</div>
                      <div className="flex items-center gap-1.5">📝 110 Soal</div>
                    </div>
                  </div>
                  <div className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20">Siap</div>
                </div>
                <div className="mt-4 h-9 w-full bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <span className="text-blue-400 text-sm font-semibold">Mulai Kerjakan</span>
                </div>
              </div>

              {/* Floating Badge (Pindah ke kiri bawah untuk balance) */}
              <div className="absolute -left-6 -bottom-6 bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4 shadow-2xl transition-transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="pr-2">
                  <p className="text-white text-sm font-bold">Lulus Passing Grade!</p>
                  <p className="text-slate-400 text-xs mt-0.5">TKP: 166 | TIU: 140 | TWK: 100</p>
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
