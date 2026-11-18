import { useState, useEffect, useCallback, useMemo } from "react";
import type { Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";
import { FBKLoader } from "@/components/ui/skeleton";

// Landing Sub-components
import { Navbar } from "../landing/Navbar";
import { HeroSection } from "../landing/HeroSection";
import { FeaturesSection } from "../landing/FeaturesSection";

import { TestimonialsSection } from "../landing/TestimonialsSection";
import { PricingSection } from "../landing/PricingSection";
import { FAQSection } from "../landing/FAQSection";
import { Footer } from "../landing/Footer";
import { GuideModal } from "../landing/GuideModal";
import { LegalModal } from "../LegalModal";
import { trackOnce } from "@/lib/analytics";

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
    badge: "Persiapan SKD Sekolah Kedinasan",
    title: "Persiapan SKD | yang lebih terarah.",
    subtitle: "Latihan TWK, TIU, dan TKP lewat tryout CAT. Tinjau hasil dan pembahasan untuk menentukan fokus belajarmu berikutnya.",
    cta: "Mulai Sekarang",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [_testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([
    { q: "Materi apa yang bisa dilatih?", a: "Tryout yang tersedia mencakup latihan TWK, TIU, dan TKP. Isi dan jumlah tryout mengikuti detail masing-masing paket." },
    { q: "Bagaimana sistem belajarnya?", a: "Pilih tryout yang tersedia, kerjakan dalam batas waktu, lalu tinjau hasil dan pembahasan yang disediakan." },
    { q: "Apakah bisa diakses melalui ponsel?", a: "Platform dapat dibuka melalui browser ponsel, tablet, atau komputer. Untuk mengerjakan tryout, layar komputer atau laptop lebih disarankan." },
    { q: "Apa saja yang termasuk dalam paket?", a: "Isi paket berbeda-beda. Periksa daftar manfaat dan informasi akses di halaman paket sebelum melakukan pemesanan." }
  ]);
  const [features, setFeatures] = useState<any[]>([
    { title: "Latihan TWK, TIU, dan TKP", desc: "Pilih tryout SKD untuk berlatih sesuai materi yang sedang ingin kamu tingkatkan." },
    { title: "Simulasi Tryout CAT", desc: "Kerjakan soal dengan batas waktu dan tinjau hasilnya setelah tryout selesai." },
    { title: "Pembahasan untuk Evaluasi", desc: "Gunakan pembahasan yang tersedia untuk memahami soal dan merencanakan latihan berikutnya." },
    { title: "Pantau Hasil Tryout", desc: "Lihat skor tiap bagian sebagai salah satu cara mengevaluasi progres latihanmu." },
    { title: "Leaderboard Tryout", desc: "Bandingkan hasil pada tryout yang menyediakan leaderboard." },
    { title: "Akses dari Berbagai Perangkat", desc: "Buka platform melalui browser di ponsel, tablet, atau komputer." }
  ]);
  const [colors, setColors] = useState({
    badge: "#3b82f6",
    title: "#ffffff",
    subtitle: "#94a3b8",
    logo: "#3b82f6",
    cta: "#2563eb"
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [realPackages, setRealPackages] = useState<any[]>([]);

  useEffect(() => {
    fetchSiteSettings();
    fetchRealPackages();
  }, []);

  const fetchRealPackages = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('packages')
        .select('id, title, description, price, original_price, product_type, cover_image_url')
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (data && data.length > 0) setRealPackages(data);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  };

  const fetchSiteSettings = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) {
        console.error("[CMS ERROR] Gagal ambil data:", error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.key === 'hero_content') setHero(current => ({ ...current, ...item.value }));
          if (item.key === 'testimonials') setTestimonials(Array.isArray(item.value) ? item.value : []);
          if (item.key === 'faqs' && item.value?.length > 0) setFaqs(item.value);
          if (item.key === 'features') setFeatures(Array.isArray(item.value) ? item.value : []);
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

  const activePackages = useMemo(() => {
    if (!Array.isArray(packages)) return [];
    return packages.filter(p => p && p.name && p.name.trim() !== "");
  }, [packages]);

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
  const handlePackageSelect = useCallback((packageId: string) => {
    sessionStorage.setItem("fbk_selected_package", packageId);
    onRegister();
  }, [onRegister]);

  // Catat kunjungan landing page sekali per sesi.
  useEffect(() => {
    if (!loading) trackOnce("view_landing");
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0f2750] flex flex-col items-center justify-center">
        <FBKLoader text="Memuat..." dark />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f2750] text-white font-sans selection:bg-blue-400/40 overflow-x-hidden">
      <SEO
        title="Future Bimbel Kedinasan | Latihan Tryout SKD Online"
        description="Latihan TWK, TIU, dan TKP melalui tryout SKD online. Tinjau skor dan pembahasan yang tersedia untuk membantu merencanakan persiapan sekolah kedinasan."
        keywords="bimbel kedinasan, tryout skd online, simulasi cat bkn, soal twk tiu tkp, stmkg, ipdn, stan, stis, poltekip, poltekim, passing grade skd 2025 2026, bimbel online kedinasan, persiapan cpns kedinasan, ranking skd nasional"
        url="https://www.futurebimbelkedinasan.com"
        type="website"
      />
      <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />

      <div className="relative z-10">
        <Navbar onLogin={onLogin} onRegister={onRegister} hasPackages={realPackages.length > 0 || activePackages.length > 0} onOpenGuide={() => setShowGuide(true)} onOpenCatalog={() => document.getElementById("paket")?.scrollIntoView({ behavior: "smooth" })} />

        <HeroSection 
          hero={hero} 
          colors={colors} 
          onEnter={onRegister}
          onLogin={onLogin}
          containerVariants={containerVariants} 
          itemVariants={itemVariants} 
        />

        <FeaturesSection features={features} />
        {(realPackages.length > 0 || activePackages.length > 0) && (
          <PricingSection
            packages={realPackages.length > 0 ? realPackages : activePackages}
            isRealPackages={realPackages.length > 0}
            onEnter={onRegister}
            onPackageSelect={handlePackageSelect}
          />
        )}
        <TestimonialsSection testimonials={_testimonials} />
        <FAQSection faqs={faqs} />
        <Footer onLegalClick={handleLegalClick} hasPackages={activePackages.length > 0} />
      </div>

      <LegalModal 
        isOpen={showLegal} 
        onClose={handleCloseLegal} 
        type={legalType} 
      />
    </div>
  );
}
