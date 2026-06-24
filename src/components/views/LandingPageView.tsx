import { useState, useEffect, useCallback, useMemo } from "react";
import type { Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";
import { FBKLoader } from "@/components/ui/skeleton";

// Landing Sub-components
import { Navbar } from "../landing/Navbar";
import { HeroSection } from "../landing/HeroSection";
import { FeaturesSection } from "../landing/FeaturesSection";
import { TeamSection } from "../landing/TeamSection";
import { TestimonialsSection } from "../landing/TestimonialsSection";
import { PricingSection } from "../landing/PricingSection";
import { FAQSection } from "../landing/FAQSection";
import { Footer } from "../landing/Footer";
import { GuideModal } from "../landing/GuideModal";
import { LegalModal } from "../LegalModal";

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
  const [_testimonials, setTestimonials] = useState<any[]>([
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
    { title: "Bank Soal Prediksi Akurat", desc: "Berhenti membuang waktu dengan soal lama. Kami menyediakan ribuan bank soal terupdate yang diprediksi keluar di seleksi tahun ini." },
    { title: "Sistem Anti-Cheat Canggih", desc: "Tryout kami dilindungi sistem anti-cheat otomatis yang mendeteksi tab switching, copy-paste, dan aktivitas mencurigakan. Hasilmu murni kemampuan sendiri — valid dan bisa dipercaya sebagai tolak ukur kesiapan sesungguhnya." },
    { title: "Ranking Nasional Real-Time", desc: "Tahu persis di mana posisimu dibanding ribuan peserta seluruh Indonesia. Lihat persentil skormu, pantau perkembangan tiap tryout, dan jadikan ranking sebagai motivasi nyata untuk terus meningkat." },
    { title: "Akses Belajar Tanpa Batas", desc: "Belajar kapan saja, di mana saja, dari perangkat apa pun. Platform FBK dioptimalkan untuk HP, tablet, dan laptop — tanpa hambatan jarak dan waktu. Satu akun, akses penuh ke seluruh materi dan tryout yang kamu miliki." }
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
        title="Future Bimbel Kedinasan | Bimbel SKD CPNS & Sekolah Kedinasan Online"
        description="Bimbel persiapan SKD CPNS dan sekolah kedinasan (IPDN, STAN, STIS, POLTEKIP) online. Tryout CAT BKN interaktif, bank soal TWK, TIU, TKP terlengkap, dan pembahasan detail. Mulai belajar gratis!"
        keywords="bimbel kedinasan, tryout skd online, soal skd cpns, ipdn, stan, stis, poltekip, poltekim, bkn, cat bkn, twk, tiu, tkp, passing grade skd, bimbel online kedinasan, persiapan cpns 2026"
      />
      <GuideModal isOpen={showGuide} onClose={handleCloseGuide} />

      <div className="relative z-10">
        <Navbar onLogin={onLogin} onRegister={onRegister} hasPackages={activePackages.length > 0} />

        <HeroSection 
          hero={hero} 
          colors={colors} 
          onEnter={onLogin} 
          containerVariants={containerVariants} 
          itemVariants={itemVariants} 
        />

        <FeaturesSection features={features} />
        {(realPackages.length > 0 || activePackages.length > 0) && (
          <PricingSection
            packages={realPackages.length > 0 ? realPackages : activePackages}
            isRealPackages={realPackages.length > 0}
            onEnter={onRegister}
          />
        )}
        <TestimonialsSection testimonials={_testimonials} />
        <TeamSection />
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
