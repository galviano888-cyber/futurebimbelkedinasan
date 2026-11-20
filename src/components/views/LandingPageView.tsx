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
import { DEFAULT_LANDING_SECTIONS, mergeLandingSections, type LandingSections } from "@/lib/landingSections";

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
    badge: "Persiapan Masuk Sekolah Kedinasan",
    title: "Langkahmu menuju | sekolah kedinasan.",
    subtitle: "Temani persiapanmu dengan latihan terarah, simulasi seleksi, dan tinjauan hasil belajar di satu platform.",
    cta: "Lihat pilihan persiapan",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [_testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([
    { q: "Bagaimana FBK membantu persiapan masuk sekolah kedinasan?", a: "Kamu dapat berlatih dengan materi dan simulasi seleksi yang tersedia, meninjau hasilnya, lalu menentukan fokus belajar berikutnya." },
    { q: "Latihan apa saja yang tersedia?", a: "Paket tryout yang tersedia mencakup latihan SKD seperti TWK, TIU, dan TKP. Isi setiap paket dapat dilihat pada detail paket." },
    { q: "Bagaimana sistem belajarnya?", a: "Pilih paket yang sesuai, kerjakan latihan atau tryout, lalu tinjau hasil dan pembahasan yang tersedia." },
    { q: "Apakah bisa diakses melalui ponsel?", a: "Platform dapat dibuka melalui browser ponsel, tablet, atau komputer. Untuk mengerjakan tryout, layar komputer atau laptop lebih disarankan." },
    { q: "Apa saja yang termasuk dalam paket?", a: "Isi paket berbeda-beda. Periksa daftar manfaat dan informasi akses di halaman paket sebelum melakukan pemesanan." }
  ]);
  const [features, setFeatures] = useState<any[]>([
    { title: "Persiapan seleksi kedinasan", desc: "Gunakan latihan dan tryout yang tersedia untuk membangun rutinitas persiapan masuk sekolah kedinasan." },
    { title: "Latihan terarah", desc: "Mulai dari latihan SKD seperti TWK, TIU, dan TKP sesuai materi yang ingin kamu pelajari." },
    { title: "Simulasi dan tinjauan hasil", desc: "Kerjakan tryout dengan batas waktu, lalu tinjau skor dan pembahasan yang tersedia." },
    { title: "Pantau Hasil Tryout", desc: "Lihat skor tiap bagian sebagai salah satu cara melihat perkembangan latihanmu." },
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
  const [sections, setSections] = useState<LandingSections>(DEFAULT_LANDING_SECTIONS);

  useEffect(() => {
    fetchSiteSettings();
    fetchRealPackages();
  }, []);

  const fetchRealPackages = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('packages')
        .select('id, title, description, price, original_price, product_type, cover_image_url, sales_status')
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
          if (item.key === 'landing_sections') setSections(mergeLandingSections(item.value));
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
        title="Future Bimbel Kedinasan | Persiapan Sekolah Kedinasan"
        description="Persiapkan langkahmu menuju sekolah kedinasan bersama Future Bimbel Kedinasan. Temukan latihan seleksi, tryout SKD, tinjauan hasil, dan pembahasan belajar dalam satu platform."
        keywords="bimbel kedinasan, tryout skd online, simulasi cat bkn, soal twk tiu tkp, stmkg, ipdn, stan, stis, poltekip, poltekim, passing grade skd 2025 2026, bimbel online kedinasan, persiapan cpns kedinasan, ranking skd nasional"
        url="https://www.futurebimbelkedinasan.com"
        type="website"
      />
      <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />

      <div className="relative z-10">
        <Navbar onLogin={onLogin} onRegister={onRegister} onOpenGuide={() => setShowGuide(true)} onOpenCatalog={() => document.getElementById("paket")?.scrollIntoView({ behavior: "smooth" })} />

        <HeroSection 
          hero={hero} 
          colors={colors} 
          copy={sections.hero}
          onEnter={onRegister}
          onLogin={onLogin}
          containerVariants={containerVariants} 
          itemVariants={itemVariants} 
        />

        <FeaturesSection features={features} copy={sections.features} />
        {(realPackages.length > 0 || activePackages.length > 0) && (() => {
          const hasRealPackages = realPackages.length > 0;
          const sourcePackages = hasRealPackages
            ? realPackages.filter(pkg => pkg.sales_status !== 'COMING_SOON' && pkg.sales_status !== 'HIDDEN')
            : activePackages;
          const selectedIds = sections.pricing.packageIds;
          const visiblePackages = hasRealPackages && selectedIds !== null
            ? sourcePackages.filter(pkg => selectedIds.includes(pkg.id) && pkg.sales_status !== 'COMING_SOON' && pkg.sales_status !== 'HIDDEN')
            : sourcePackages;
          return visiblePackages.length > 0 ? (
            <PricingSection
              packages={visiblePackages}
              isRealPackages={hasRealPackages}
              copy={sections.pricing}
              onEnter={onRegister}
              onPackageSelect={handlePackageSelect}
            />
          ) : null;
        })()}
        <TestimonialsSection testimonials={_testimonials} copy={sections.plan} />
        <FAQSection faqs={faqs} copy={sections.faq} />
        <Footer onLegalClick={handleLegalClick} copy={sections.footer} />
      </div>

      <LegalModal 
        isOpen={showLegal} 
        onClose={handleCloseLegal} 
        type={legalType} 
      />
    </div>
  );
}
