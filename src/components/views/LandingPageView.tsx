import { Loader2, MessageCircle } from "lucide-react";
import { LegalModal } from "@/components/LegalModal";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// Landing Sub-components
import { Navbar } from "../landing/Navbar";
import { HeroSection } from "../landing/HeroSection";
import { FeaturesSection } from "../landing/FeaturesSection";
import { PricingSection } from "../landing/PricingSection";
import { TestimonialsSection } from "../landing/TestimonialsSection";
import { FAQSection } from "../landing/FAQSection";
import { Footer } from "../landing/Footer";
import { GuideModal } from "../landing/GuideModal";

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
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) {
        console.error("[CMS ERROR] Gagal ambil data:", error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.key === 'hero_content') setHero(item.value);
          if (item.key === 'testimonials') setTestimonials(item.value);
          if (item.key === 'faqs') setFaqs(item.value);
          if (item.key === 'features') setFeatures(item.value);
          if (item.key === 'site_colors') setColors(item.value);
          if (item.key === 'skd_packages') setPackages(item.value);
          if (item.key === 'official_contacts' && item.value?.whatsapp) setWaNumber(item.value.whatsapp);
        });
      }
    } catch (err) {
      console.error("[CMS CATCH] Gagal ambil setting:", err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }), []);

  const itemVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  }), []);

  const handleLegalClick = useCallback((type: 'terms' | 'privacy') => {
    setLegalType(type);
    setShowLegal(true);
  }, []);

  const handleCloseGuide = useCallback(() => setShowGuide(false), []);
  const handleCloseLegal = useCallback(() => setShowLegal(false), []);

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
      <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />

      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="relative z-10">
        <Navbar onEnter={onEnter} />

        <HeroSection 
          hero={hero} 
          colors={colors} 
          onEnter={onEnter} 
          containerVariants={containerVariants} 
          itemVariants={itemVariants} 
        />

        <FeaturesSection features={features} />

        <PricingSection packages={packages} onEnter={onEnter} />

        <TestimonialsSection testimonials={testimonials} />

        <FAQSection faqs={faqs} />

        <Footer onLegalClick={handleLegalClick} />
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
        onClose={handleCloseLegal} 
        type={legalType} 
      />
    </div>
  );
}
