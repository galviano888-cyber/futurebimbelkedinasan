import { ArrowRight, Zap, GraduationCap, BookOpen, X, Trophy, Plus, Loader2, MessageCircle, Check, HelpCircle } from "lucide-react";
import { LegalModal } from "@/components/LegalModal";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface LandingPageViewProps {
  onEnter: () => void;
}

export function LandingPageView({ onEnter }: LandingPageViewProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLegal, setShowLegal] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
  
  // Dynamic Content State
  const [hero, setHero] = useState({ 
    badge: "Platform Persiapan Kedinasan #1",
    title: "Wujudkan Mimpi Menjadi Abdi Negara.", 
    subtitle: "Persiapkan dirimu menghadapi seleksi sekolah kedinasan bersama Future Bimbel Kedinasan. Belajar lebih efektif dengan sistem CAT standar BKN.",
    cta: "Mulai Sekarang",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [testimonials, setTestimonials] = useState<any[]>([
    { name: "Siswa FBK", text: "Berkat simulasi CAT di FBK, saya jadi terbiasa dengan tekanan waktu saat ujian asli.", school: "Lulusan 2024" }
  ]);
  const [faqs, setFaqs] = useState<any[]>([
    { q: "Apakah materi sesuai standar terbaru?", a: "Ya, seluruh materi diperbarui berkala mengikuti pola soal asli SKD." }
  ]);
  const [features, setFeatures] = useState<any[]>([
    { title: "Eksklusif: Mentor Kedinasan", desc: "Dibimbing langsung oleh Kakak tingkat yang telah berhasil lolos seleksi dengan strategi efektif." },
    { title: "Engine CAT Standar BKN", desc: "Uji kemampuan dengan platform simulasi presisi sesuai standar sistem CAT BKN asli." },
    { title: "Bank Soal Terupdate", desc: "Akses materi belajar dan bank soal yang telah disesuaikan dengan standar seleksi terbaru." }
  ]);
  const [colors, setColors] = useState({
    badge: "#3b82f6",
    title: "#ffffff",
    subtitle: "#94a3b8",
    logo: "#3b82f6",
    cta: "#2563eb"
  });
  const [packages, setPackages] = useState<any[]>([
    { name: "Paket Mandiri", price: "Gratis", originalPrice: "", benefits: ["Akses 1 Tryout SKD", "Hasil Skor Instan", "Pembahasan Soal"], isRecommended: false },
    { name: "Paket Premium", price: "Rp 149.000", originalPrice: "Rp 499.000", benefits: ["Akses Semua Tryout", "Ranking Nasional", "Materi Eksklusif", "Grup Konsultasi"], isRecommended: true },
    { name: "Paket Platinum", price: "Rp 299.000", originalPrice: "Rp 999.000", benefits: ["Semua Fitur Premium", "Bimbingan Live Zoom", "Prediksi Soal Akurat", "Sertifikat Kelulusan"], isRecommended: false }
  ]);
  const [waNumber, setWaNumber] = useState("6287753646617");

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    if (!supabase) return;
    try {
      console.log("[CMS] Mengambil data site_settings...");
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) {
        console.error("[CMS ERROR] Gagal ambil data:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("[CMS] Data ditemukan:", data);
        data.forEach(item => {
          if (item.key === 'hero_content') {
             console.log("[CMS] Mengupdate Hero:", item.value);
             setHero(item.value);
          }
          if (item.key === 'testimonials') setTestimonials(item.value);
          if (item.key === 'faqs') setFaqs(item.value);
          if (item.key === 'features') setFeatures(item.value);
          if (item.key === 'site_colors') setColors(item.value);
          if (item.key === 'skd_packages') setPackages(item.value);
          if (item.key === 'official_contacts' && item.value?.whatsapp) setWaNumber(item.value.whatsapp);
        });
      } else {
        console.warn("[CMS] Table site_settings kosong, menggunakan data default.");
      }
    } catch (err) {
      console.error("[CMS CATCH] Gagal ambil setting:", err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Menyiapkan Pengalaman Belajar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b18] text-white font-sans selection:bg-blue-600/30 overflow-x-hidden relative">
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[#050b18]/90 backdrop-blur-xl" onClick={() => setShowGuide(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a1425] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">Panduan Penggunaan</h2>
                    <p className="text-slate-400 font-medium text-sm">4 Langkah mudah mulai belajar di Future Bimbel Kedinasan.</p>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
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

                <button onClick={() => setShowGuide(false)} className="w-full mt-12 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b18]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white font-black text-sm">FBK</div>
            <span className="text-xl font-black tracking-tighter text-white">Future Bimbel Kedinasan</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#fitur" className="hover:text-blue-500 transition-colors">Fitur</a>
            <a href="#paket" className="hover:text-blue-500 transition-colors">Paket SKD</a>
            <a href="#testimoni" className="hover:text-blue-500 transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-blue-500 transition-colors">FAQ</a>
          </div>
          <Button onClick={onEnter} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-blue-600/20 text-[11px] uppercase tracking-widest">MASUK SEKARANG</Button>
        </div>
      </nav>

      <section className="pt-16 pb-0 bg-[#0a1425] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 lg:pr-10">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase mb-4 shadow-sm" style={{ color: colors.badge }}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>{hero.badge}</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-[2rem] lg:text-[2.8rem] font-black tracking-tighter leading-[1.25] text-white" style={{ textWrap: 'balance' } as any}>
              {(() => {
                const lastComma = hero.title.lastIndexOf(',');
                const hasSplit = lastComma > 0;
                const firstPart = hasSplit ? hero.title.slice(0, lastComma) + ',' : hero.title;
                const secondPart = hasSplit ? hero.title.slice(lastComma + 1).trim() : '';
                return (
                  <>
                    <span className="block text-white">{firstPart}</span>
                    {secondPart && (
                      <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        {secondPart}
                      </span>
                    )}
                  </>
                );
              })()}
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-base lg:text-xl leading-relaxed max-w-xl text-slate-400 font-medium text-justify lg:-translate-y-4">
              {hero.subtitle}
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <Button onClick={onEnter} className="w-full sm:w-auto h-16 px-10 text-white font-black text-lg rounded-2xl shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all group" style={{ backgroundColor: colors.cta }}>
                Mulai Belajar Sekarang 
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:block relative"
          >
             <div className="relative z-10 w-full h-[500px] lg:h-[620px] flex items-end justify-center lg:justify-end pr-4 lg:pr-10">
                <div className="relative h-full w-auto flex items-end justify-center w-full">
                  <img 
                    src="/hero-squad.png" 
                    alt="Squad Kedinasan" 
                    className="h-[100%] w-auto max-w-none object-contain brightness-110 contrast-[1.05] origin-bottom animate-in fade-in zoom-in-95 duration-1000 translate-y-12 lg:translate-y-32 scale-[1.25] lg:scale-[1.72]"
                    style={{
                      maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
                      WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
                    }}
                  />
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[120%] h-40 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
                
                {/* Floating Info Card 1 */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  style={{ willChange: "transform" }}
                  className="absolute bottom-[15%] left-0 lg:-left-40 bg-white/5 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                         <Trophy className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] leading-none mb-1.5">Target Skor</p>
                         <p className="text-xl font-black text-white tracking-tight">SKD 450+</p>
                      </div>
                   </div>
                </motion.div>

                {/* Floating Info Card 2 */}
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ 
                    duration: 7, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 1 
                  }}
                  style={{ willChange: "transform" }}
                  className="absolute top-[30%] -right-4 lg:-right-32 bg-white/5 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                         <Zap className="w-7 h-7 text-blue-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em] leading-none mb-1.5">Simulasi CAT</p>
                         <p className="text-xl font-black text-white tracking-tight">Standar BKN</p>
                      </div>
                   </div>
                </motion.div>
             </div>
             
             {/* Background Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
          </motion.div>
        </div>
      </section>

      <section id="fitur" className="pt-16 pb-24 bg-[#0a1425]/50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
               {features.map((f, i) => (
                 <FeatureCard 
                   key={i}
                   icon={i === 0 ? <GraduationCap className="w-6 h-6 text-blue-600" /> : i === 1 ? <Zap className="w-6 h-6 text-blue-600" /> : <BookOpen className="w-6 h-6 text-blue-600" />} 
                   title={f.title} 
                   desc={f.desc} 
                 />
               ))}
            </div>
        </div>
      </section>

      <section id="paket" className="py-32 bg-[#050b18]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
               <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Pilih Paket Belajarmu</h2>
               <p className="text-slate-400 font-medium">Investasi terbaik untuk masa depan seragam kedinasanmu.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
               {packages.map((p, i) => (
                 <motion.div 
                   key={i} 
                   whileHover={{ y: -10 }}
                   className={`relative p-10 rounded-[3rem] border transition-all duration-500 ${p.isRecommended ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/20' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}
                 >
                    {p.isRecommended && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">Terpopuler</div>
                    )}
                    <h3 className={`text-xl font-black mb-2 ${p.isRecommended ? 'text-white' : 'text-white'}`}>{p.name}</h3>
                    <div className="flex flex-col mb-8">
                       {p.originalPrice && p.originalPrice !== "0" && (
                         <span className={`text-sm font-bold line-through decoration-red-500 decoration-2 mb-1 ${p.isRecommended ? 'text-white/50' : 'text-slate-400'}`}>
                           {p.originalPrice}
                         </span>
                       )}
                       <span className={`text-3xl font-black ${p.isRecommended ? 'text-white' : 'text-blue-500'}`}>{p.price}</span>
                    </div>
                    <div className="space-y-4 mb-10">
                       {p.benefits.map((b: string, bi: number) => (
                         <div key={bi} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${p.isRecommended ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                               <Check className="w-3 h-3" />
                            </div>
                            <span className={`text-sm font-medium ${p.isRecommended ? 'text-blue-50' : 'text-slate-400'}`}>{b}</span>
                         </div>
                       ))}
                    </div>
                    <Button 
                      onClick={onEnter} 
                      className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${p.isRecommended ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                    >
                       Daftar Sekarang
                    </Button>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      <section id="testimoni" className="py-32 bg-[#0a1425]">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-black text-white mb-16">Apa Kata Mereka?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {testimonials.map((t, i) => (
                 <motion.div key={i} whileHover={{ y: -5 }} className="p-10 bg-white/[0.03] rounded-[2.5rem] border border-white/5 text-left">
                    <p className="text-slate-400 italic mb-8 leading-relaxed text-justify">"{t.text}"</p>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs">{t.name.charAt(0)}</div>
                       <div>
                          <p className="font-black text-white text-sm">{t.name}</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase">{t.school}</p>
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      <section id="faq" className="py-32 bg-[#0a1425] relative overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 mb-6"
               >
                 <HelpCircle className="w-3.5 h-3.5" />
                 <span>FAQ</span>
               </motion.div>
               <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight"
               >
                 Pertanyaan yang <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Sering Diajukan</span>
               </motion.h2>
               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="text-slate-400 font-medium max-w-2xl mx-auto"
               >
                 Temukan jawaban untuk pertanyaan umum seputar program belajar, sistem ujian, dan pendaftaran di Future Bimbel Kedinasan.
               </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-white/5 p-4 lg:p-8 shadow-2xl"
            >
               <div className="divide-y divide-white/5">
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} question={f.q} answer={f.a} />
                  ))}
               </div>
            </motion.div>
            

         </div>
      </section>

      <footer className="py-20 bg-[#0a1425] border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="flex items-center gap-3">
               <div className="h-10 px-3 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center shadow-lg shadow-blue-600/20">FBK</div>
               <span className="text-xl font-black text-white tracking-tight">Future Bimbel Kedinasan</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="flex gap-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <button 
                    onClick={() => { setLegalType('terms'); setShowLegal(true); }} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    Syarat & Ketentuan
                  </button>
                  <button 
                    onClick={() => { setLegalType('privacy'); setShowLegal(true); }} 
                    className="hover:text-blue-400 transition-colors"
                  >
                    Kebijakan Privasi
                  </button>
               </div>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">© 2026 Future Bimbel Kedinasan</p>
            </div>
         </div>
      </footer>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <motion.a 
        href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo Admin FBK, saya ingin bertanya seputar paket bimbel...")}`}
        target="_blank"
        rel="noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[60] group"
      >
        <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
        <div className="relative bg-green-500 p-5 rounded-full shadow-2xl flex items-center justify-center border border-white/20">
          <MessageCircle className="w-8 h-8 text-white fill-white" />
          <div className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-100">
            Tanya Admin FBK 💬
          </div>
        </div>
      </motion.a>

      <LegalModal 
        isOpen={showLegal} 
        onClose={() => setShowLegal(false)} 
        type={legalType} 
      />
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="group">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-8 flex items-center justify-between text-left transition-all"
      >
        <span className={`text-base lg:text-lg font-black tracking-tight transition-all duration-300 ${isOpen ? 'text-blue-400 translate-x-2' : 'text-white'}`}>
          {question}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-blue-500 text-white rotate-45' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
          <Plus className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-8 pl-2 pr-4 text-slate-400 text-sm lg:text-base leading-relaxed text-justify font-medium">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-10 bg-white/[0.03] rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group h-full">
       <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 text-blue-500">{icon}</div>
       <h3 className="text-xl font-black text-white mb-4 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300">{title}</h3>
       <p className="text-sm text-slate-400 leading-relaxed font-medium text-justify">{desc}</p>
    </div>
  );
}
