import { ArrowRight, CheckCircle2, Zap, MessageSquare, LayoutDashboard, Search, GraduationCap, BookOpen, X, Trophy, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface LandingPageViewProps {
  onEnter: () => void;
}

export function LandingPageView({ onEnter }: LandingPageViewProps) {
  const [showGuide, setShowGuide] = useState(false);
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white font-sans selection:bg-blue-600/30 overflow-x-hidden relative">
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[#050b18]/90 backdrop-blur-xl" onClick={() => setShowGuide(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a1425] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Panduan Penggunaan</h2>
                    <p className="text-slate-400 font-medium text-sm">4 Langkah mudah mulai belajar di Future Bimbel Kedinasan.</p>
                  </div>
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-blue-600/20">1</div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Registrasi Akun</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">Klik tombol "Masuk" dan isi data diri Anda untuk membuat akun baru.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-blue-600/20">2</div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Pilih Paket</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">Pilih paket tryout atau bimbel yang sesuai di halaman Katalog Paket.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-blue-600/20">3</div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Konfirmasi Pembayaran</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">Lakukan transfer, lalu kirim bukti ke Admin via WhatsApp untuk aktivasi akun instan.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-blue-600/20">4</div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Mulai Belajar</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">Akses dashboard Anda untuk mengerjakan tryout, melihat ranking, dan materi belajar.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-12 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b18]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-black text-sm">FBK</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">Future Bimbel Kedinasan</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#fitur" className="hover:text-blue-500 transition-colors">Fitur</a>
            <a href="#paket" className="hover:text-blue-500 transition-colors">Paket SKD</a>
            <a href="#faq" className="hover:text-blue-500 transition-colors">Bantuan</a>
          </div>

          <Button 
            onClick={onEnter}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20 text-[11px] uppercase tracking-widest"
          >
            MASUK SEKARANG
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 lg:pt-56 lg:pb-32 bg-[#0a1425] relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5 fill-blue-400" />
              <span>Platform Persiapan Kedinasan #1</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Wujudkan Mimpi <br />
              Menjadi <span className="text-blue-500">Abdi Negara.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium text-justify">
              Akselerasi persiapan SKD Anda dengan <b>Kurikulum Komprehensif</b> TWK, TIU, & TKP. Rasakan pengalaman simulasi CAT <b>Real-Engine</b> standar BKN untuk raih skor maksimal.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button 
                onClick={onEnter}
                className="w-full sm:w-auto h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Mulai Belajar Sekarang
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>

            </motion.div>
          </motion.div>

          {/* Enhanced Mockup UI */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <div className="relative group">
              {/* Background Glow behind mockup */}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative bg-[#0d1526] rounded-[3.5rem] p-3 shadow-2xl border border-white/10 overflow-hidden">
                 <div className="bg-[#050b18] rounded-[3rem] overflow-hidden border border-white/5">
                    {/* Fake Browser Top Bar */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/30" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                       </div>
                       <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <div className="w-32 h-1.5 bg-white/20 rounded-full" />
                       </div>
                    </div>
                    
                    {/* Mockup Dashboard Content */}
                    <div className="p-8 space-y-8 bg-gradient-to-b from-white/[0.02] to-transparent">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-blue-600/20 rounded-2xl border border-blue-600/30 flex items-center justify-center text-blue-400">
                             <LayoutDashboard className="w-7 h-7" />
                          </div>
                          <div className="space-y-2">
                             <div className="w-48 h-3 bg-white/20 rounded-full" />
                             <div className="w-32 h-1.5 bg-white/10 rounded-full" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-5">
                          <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                             <div className="w-12 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                             <div className="space-y-2">
                                <div className="w-full h-2 bg-white/10 rounded-full" />
                                <div className="w-2/3 h-2 bg-white/5 rounded-full" />
                             </div>
                             <div className="pt-2 flex justify-between items-end">
                                <div className="w-10 h-6 bg-blue-500/20 rounded-md" />
                                <div className="w-4 h-4 bg-white/10 rounded-full" />
                             </div>
                          </div>
                          <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                             <div className="w-12 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <div className="space-y-2">
                                <div className="w-full h-2 bg-white/10 rounded-full" />
                                <div className="w-2/3 h-2 bg-white/5 rounded-full" />
                             </div>
                             <div className="pt-2 flex justify-between items-end">
                                <div className="w-10 h-6 bg-emerald-500/20 rounded-md" />
                                <div className="w-4 h-4 bg-white/10 rounded-full" />
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                          <div className="flex items-center justify-between mb-4">
                             <div className="w-24 h-2 bg-white/20 rounded-full" />
                             <div className="w-8 h-8 rounded-full bg-white/5" />
                          </div>
                          <div className="space-y-3">
                             <div className="w-full h-1.5 bg-white/5 rounded-full" />
                             <div className="w-full h-1.5 bg-white/5 rounded-full" />
                             <div className="w-4/5 h-1.5 bg-white/5 rounded-full" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Floating Decorative Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-8 bg-[#0d1526]/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-5 z-20"
            >
               <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Target Skor Ideal</p>
                  <p className="text-lg font-black text-white">450+ Poin <span className="text-emerald-500 text-xs ml-1">SKD 2026</span></p>
               </div>
            </motion.div>
          </motion.div>
        </div>
        

      </section>

      {/* Feature Section */}
      <section id="fitur" className="py-24 bg-[#0a1425]/50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
                title="Eksklusif: Taruna, Praja & Mahasiswa Kedinasan"
                desc="Dibimbing langsung oleh Kakak tingkat (Taruna, Praja, atau Mahasiswa Kedinasan) yang telah berhasil lolos seleksi. Dapatkan insight berharga dan strategi efektif untuk menghadapi setiap tahapan seleksi."
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-blue-600" />}
                title="Engine Simulasi Standar Kelulusan"
                desc="Uji kemampuan Anda dengan platform simulasi yang presisi sesuai standar sistem CAT BKN asli, didukung dengan sistem penilaian otomatis dan perangkingan nasional."
              />
              <FeatureCard 
                icon={<BookOpen className="w-6 h-6 text-blue-600" />}
                title="Materi & Tryout Standar Terbaru"
                desc="Akses materi belajar dan bank soal yang telah disesuaikan dengan standar seleksi SKD tahun 2024 dan 2025."
              />
           </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="paket" className="py-32 bg-[#0a1425]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
               <h2 className="text-4xl font-black tracking-tight text-white mb-4">Persiapan SKD 2026</h2>
               <p className="text-slate-400 font-medium">Fokus kuasai TWK, TIU, dan TKP dengan pilihan paket tryout.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
               <PackageCard 
                 title="Simulasi SKD Satuan"
                 price="25"
                 features={["1x Tryout SKD Premium", "Pembahasan Detail", "Ranking Nasional"]}
                 onEnter={onEnter}
               />
               <PackageCard 
                 title="Intensif SKD"
                 price="149"
                 featured
                 features={["10x Tryout SKD Premium", "Bank Soal SKD 1000+", "Grup Diskusi Siswa", "E-Book SKD Eksklusif"]}
                 onEnter={onEnter}
               />
               <PackageCard 
                 title="Mastery SKD Pro"
                 price="299"
                 features={["Akses Semua Tryout SKD", "Live Zoom Tiap Minggu", "Konsultasi Strategi SKD"]}
                 onEnter={onEnter}
               />
            </div>
         </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-32 bg-[#0a1425]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
               <h2 className="text-4xl font-black tracking-tight text-white mb-4">Pertanyaan yang Sering Diajukan</h2>
               <p className="text-slate-400 font-medium">Temukan jawaban cepat untuk pertanyaan populer Anda.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-2 max-w-5xl mx-auto">
               <div className="space-y-2">
                  <AccordionItem 
                    question="Apakah materi sesuai dengan standar SKD terbaru?" 
                    answer="Ya, seluruh materi dan tryout kami diperbarui secara berkala mengikuti pola soal asli SKD tahun 2024 dan 2025." 
                  />
                  <AccordionItem 
                    question="Sistem pembelajaran di FBK cocok untuk pemula?" 
                    answer="Sangat cocok. Kami memulai dari konsep dasar hingga teknik menjawab cepat (fast track) yang mudah dipahami bahkan untuk pemula." 
                  />
                  <AccordionItem 
                    question="Apa itu Paket Premium FBK?" 
                    answer="Paket Premium adalah akses lengkap ke seluruh fitur unggulan termasuk bimbingan mentor eksklusif, bank soal HOTS, dan simulasi CAT tanpa batas." 
                  />
               </div>
               <div className="space-y-2">
                  <AccordionItem 
                    question="Apa keuntungan utama berlangganan Paket Premium?" 
                    answer="Anda mendapatkan bimbingan eksklusif dari mentor Taruna/Praja, akses grup diskusi aktif, dan prediksi soal yang sangat akurat." 
                  />
                  <AccordionItem 
                    question="Bagaimana cara Berlangganan?" 
                    answer="Klik tombol 'Masuk', pilih paket yang Anda inginkan, lakukan pembayaran, dan konfirmasi ke Admin via WhatsApp untuk aktivasi instan." 
                  />
                  <AccordionItem 
                    question="Mengapa paket Saya belum bisa diakses?" 
                    answer="Pastikan Anda sudah mengirim bukti transfer ke Admin. Verifikasi biasanya memakan waktu kurang dari 15 menit pada jam operasional." 
                  />
               </div>
            </div>
         </div>
      </section>

      {/* FAQ / Trust Section */}
      <section id="faq" className="py-32 bg-[#0a1425]/50 border-t border-white/5">
         <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-3xl font-black tracking-tight text-white">Butuh Bantuan?</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
               <div className="p-8 bg-white/5 rounded-3xl shadow-sm border border-white/5">
                  <MessageSquare className="w-8 h-8 text-blue-400 mb-4" />
                  <h4 className="font-black text-white mb-2">Hubungi Admin</h4>
                  <p className="text-sm text-slate-400 mb-4 font-medium">Tanya-tanya seputar program dan cara pendaftaran.</p>
                  <a href="https://wa.me/6287753646617" className="text-blue-400 font-black text-[11px] uppercase tracking-widest hover:underline">WhatsApp Admin →</a>
               </div>
               <div className="p-8 bg-white/5 rounded-3xl shadow-sm border border-white/5">
                  <Search className="w-8 h-8 text-blue-400 mb-4" />
                  <h4 className="font-black text-white mb-2">Pusat Bantuan</h4>
                  <p className="text-sm text-slate-400 mb-4 font-medium">Pelajari panduan penggunaan platform kami.</p>
                  <button onClick={() => setShowGuide(true)} className="text-blue-400 font-black text-[11px] uppercase tracking-widest hover:underline">Pelajari →</button>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#0a1425] border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
               <div className="h-8 px-2 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-black text-[10px]">FBK</span>
               </div>
               <span className="text-lg font-black tracking-tighter text-white">Future Bimbel Kedinasan</span>
            </div>
            
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">© 2026 Future Bimbel Kedinasan</p>
         </div>
      </footer>
    </div>
  </div>
  );
}

function AccordionItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-7 flex items-center justify-between text-left group transition-all"
      >
        <span className={`font-bold transition-colors ${isOpen ? 'text-blue-400 text-lg' : 'text-white'}`}>{question}</span>
        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-45 bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/30' : 'group-hover:border-blue-500/50'}`}>
          <Plus className="w-5 h-5 text-white" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-slate-400 text-[15px] leading-relaxed font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-10 bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden h-full flex flex-col"
    >
       {/* Card Glow Effect */}
       <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all duration-700" />
       
       <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-700/10 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform border border-blue-500/20 relative z-10">
          {icon}
       </div>
       <h3 className="text-xl font-black text-white mb-4 relative z-10">{title}</h3>
       <p className="text-sm text-slate-400 leading-relaxed font-medium relative z-10 text-justify">{desc}</p>
    </motion.div>
  );
}

function PackageCard({ title, price, features, featured = false, onEnter }: { title: string, price: string, features: string[], featured?: boolean, onEnter: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={`p-12 rounded-[3.5rem] border transition-all relative overflow-hidden flex flex-col h-full ${
        featured 
          ? "bg-gradient-to-b from-blue-600 to-blue-800 border-blue-400 shadow-2xl shadow-blue-600/30 scale-105 z-10" 
          : "bg-white/[0.03] border-white/10 hover:border-blue-500/30"
      }`}
    >
       {featured && (
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
       )}
       
       <div className="mb-10">
          <h3 className={`text-2xl font-black mb-1 text-white`}>{title}</h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${featured ? "text-blue-100" : "text-slate-500"}`}>
            {featured ? "Paling Populer" : "Paket Pilihan"}
          </p>
       </div>
       <div className="mb-12 flex items-baseline gap-1">
          <span className={`text-[10px] font-black uppercase ${featured ? "text-blue-100" : "text-slate-500"}`}>Rp</span>
          <span className={`text-6xl font-black tracking-tighter text-white`}>{price}</span>
          <span className={`text-sm font-bold ${featured ? "text-blue-100" : "text-slate-500"}`}>ribu</span>
       </div>
       <ul className="space-y-5 mb-14 flex-1">
          {features.map((f: string) => (
            <li key={f} className="flex items-center gap-4 text-sm font-medium">
               <CheckCircle2 className={`w-5 h-5 shrink-0 ${featured ? "text-white" : "text-blue-400"}`} />
               <span className={featured ? "text-blue-50" : "text-slate-400"}>{f}</span>
            </li>
          ))}
       </ul>
       <Button 
         onClick={onEnter}
         className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
           featured 
             ? "bg-white text-blue-600 hover:bg-slate-100 shadow-xl" 
             : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
         }`}
       >
         PILIH PAKET SEKARANG
       </Button>
    </motion.div>
  );
}
