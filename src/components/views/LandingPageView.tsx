import { Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import type { Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";

// Landing Sub-components
import { Navbar } from "../landing/Navbar";
import { HeroSection } from "../landing/HeroSection";
const FeaturesSection = lazy(() => import("../landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const PricingSection = lazy(() => import("../landing/PricingSection").then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import("../landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import("../landing/FAQSection").then(m => ({ default: m.FAQSection })));
const Footer = lazy(() => import("../landing/Footer").then(m => ({ default: m.Footer })));
const GuideModal = lazy(() => import("../landing/GuideModal").then(m => ({ default: m.GuideModal })));
const LegalModal = lazy(() => import("../LegalModal").then(m => ({ default: m.LegalModal })));

interface LandingPageViewProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPageView({ onLogin, onRegister }: LandingPageViewProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLegal, setShowLegal] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
  
  // Dynamic Content State
  const [hero, setHero] = useState({ 
    badge: "Platform Persiapan Kedinasan #1",
    title: "Wujudkan Mimpi Menjadi Abdi Negara.", 
    subtitle: "Partner strategis nomor satu untuk raih kursi sekolah kedinasan impianmu. Kami fokus memberikan pendampingan intensif dengan materi terakurat dan sistem simulasi CAT yang presisi demi mencetak calon abdi negara terbaik.",
    cta: "Mulai Sekarang",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [testimonials, setTestimonials] = useState<any[]>([
    { name: "Visi Kami", text: "Misi utama kami adalah mencetak ribuan taruna baru setiap tahunnya melalui metode belajar yang paling efisien dan tertarget sesuai standar BKN.", school: "FBK Commitment" },
    { name: "Jaminan Materi", text: "Kami menjamin semua bank soal yang Anda pelajari adalah materi yang 100% relevan dengan standar seleksi kedinasan terbaru dan terupdate.", school: "FBK Commitment" },
    { name: "Akses Belajar", text: "Di FBK, Anda bisa belajar kapan saja dan di mana saja tanpa hambatan. Tidak ada lagi kendala jarak untuk meraih seragam impian Anda.", school: "FBK Commitment" }
  ]);
  const [faqs, setFaqs] = useState<any[]>([
    { q: "Apakah materi sesuai standar seleksi terbaru?", a: "Ya, seluruh materi dan bank soal kami diperbarui secara berkala mengikuti pola soal asli SKD dan FR (Field Report) terbaru." },
    { q: "Bagaimana sistem belajarnya?", a: "Sistem belajar dilakukan secara online melalui Dashboard khusus yang dilengkapi Simulasi CAT standar BKN, materi terstruktur, dan analisis hasil yang mendalam." },
    { q: "Apakah bisa diakses melalui Smartphone?", a: "Tentu saja! Platform FBK dirancang 100% responsif sehingga Anda bisa belajar dengan nyaman kapan saja dan di mana saja melalui HP, Tablet, maupun Laptop." },
    { q: "Apakah ada grup diskusi atau mentor?", a: "Ya, untuk member Premium dan Platinum akan mendapatkan akses eksklusif ke grup diskusi dan pendampingan langsung oleh mentor berpengalaman." }
  ]);
  const [features, setFeatures] = useState<any[]>([
    { title: "Mentor Kedinasan Eksklusif", desc: "Jangan menebak-nebak. Belajar langsung dari praktisi yang sudah menaklukkan gerbang kedinasan dengan strategi teruji." },
    { title: "Simulasi CAT Super Presisi", desc: "Rasakan atmosfer ujian sesungguhnya dengan sistem CAT yang 100% mengikuti standar sistem BKN terbaru." },
    { title: "Bank Soal Prediksi Akurat", desc: "Berhenti membuang waktu dengan soal lama. Kami menyediakan ribuan bank soal terupdate yang diprediksi keluar di seleksi tahun ini." }
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
          if (item.key === 'testimonials' && item.value?.length > 0) setTestimonials(item.value);
          if (item.key === 'faqs' && item.value?.length > 0) setFaqs(item.value);
          if (item.key === 'features' && item.value?.length > 0) setFeatures(item.value);
          if (item.key === 'site_colors') setColors(item.value);
          if (item.key === 'skd_packages') setPackages(item.value);
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
    <div className="min-h-screen bg-[#050b18] text-white font-sans selection:bg-blue-600/30 overflow-x-hidden relative transform-gpu">
      <SEO 
        title="Future Bimbel Kedinasan | Persiapan Tes SKD #1 Indonesia"
        description="Partner strategis nomor satu untuk raih kursi sekolah kedinasan impianmu. Kami fokus memberikan pendampingan intensif dengan materi terakurat dan sistem simulasi CAT yang presisi demi mencetak calon abdi negara terbaik."
      />
      <Suspense fallback={null}>
        <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />
      </Suspense>

      <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] will-change-opacity" />
      
      <div className="relative z-10">
        <Navbar onLogin={onLogin} onRegister={onRegister} />

        <HeroSection 
          hero={hero} 
          colors={colors} 
          onEnter={onLogin} 
          containerVariants={containerVariants} 
          itemVariants={itemVariants} 
        />

        <Suspense fallback={<div className="h-96" />}>
          <FeaturesSection features={features} />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <PricingSection packages={packages} onEnter={onRegister} />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <TestimonialsSection testimonials={testimonials} />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <FAQSection faqs={faqs} />
        </Suspense>

        <Suspense fallback={<div className="h-60" />}>
          <Footer onLegalClick={handleLegalClick} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <LegalModal 
          isOpen={showLegal} 
          onClose={handleCloseLegal} 
          type={legalType} 
        />
      </Suspense>
    </div>
  );
}
