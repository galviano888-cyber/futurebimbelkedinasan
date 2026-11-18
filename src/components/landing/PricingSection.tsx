import { memo, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Check, ChevronDown, BookOpen, Zap, FileText, ArrowRight } from "lucide-react";
import { productTypeLabel } from "@/lib/packages";
import { trackOnce } from "@/lib/analytics";

interface CMSPackage {
  name: string;
  price: string;
  originalPrice: string;
  benefits: string[];
  isRecommended: boolean;
}

interface RealPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number | null;
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF' | 'KELAS' | 'PRIVAT_SATUAN' | 'PRIVAT_PAKET';
  cover_image_url?: string | null;
}

interface PricingSectionProps {
  packages: CMSPackage[] | RealPackage[];
  isRealPackages?: boolean;
  onEnter: () => void;
  onPackageSelect?: (packageId: string) => void;
}

const TYPE_ICON: Record<string, any> = {
  SATUAN: Zap,
  BUNDLE: BookOpen,
  INTENSIF: FileText,
  KELAS: BookOpen,
  PRIVAT_SATUAN: FileText,
  PRIVAT_PAKET: FileText,
};

function DescChecklist({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const items = text.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0);
  const isLong = items.length > 3;
  const visible = !expanded && isLong ? items.slice(0, 3) : items;
  return (
    <div className="space-y-2.5 mb-6">
      {visible.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="w-[18px] h-[18px] rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-px">
            <Check className="w-2.5 h-2.5 text-blue-300" strokeWidth={3} />
          </div>
      <span className="text-[13px] text-slate-700 leading-snug">{item}</span>
        </div>
      ))}
      {isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 font-medium transition-colors"
        >
          {expanded ? 'Sembunyikan' : `+${items.length - 3} lainnya`}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

export const PricingSection = memo(function PricingSection({ packages, isRealPackages = false, onEnter, onPackageSelect }: PricingSectionProps) {
  const reduceMotion = useReducedMotion();
  // Catat saat daftar harga benar-benar terlihat (bukan sekadar dirender).
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            trackOnce("view_pricing");
            observer.disconnect();
            break;
          }
        }
      },
      // Bagian harga lebih tinggi dari layar, terutama di ponsel. Ambang 35%
      // tidak pernah tercapai sehingga event tak pernah tercatat; 15% cukup
      // untuk menandai "pengunjung sudah melihat daftar harga".
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="paket" ref={sectionRef} className="relative py-20 lg:py-28 bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative">
        {/* Section header */}
        <div className="max-w-2xl mb-12 lg:mb-16 text-center mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-[11px] font-bold text-blue-700 tracking-[0.16em] uppercase">Pilihan Paket</span>
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-bold text-slate-900 tracking-[-0.04em] leading-[1.12]">
            Pilih paket sesuai tahap persiapanmu.
          </h2>
          <p className="text-[15px] lg:text-[16px] text-slate-700 mt-4 leading-relaxed">
            Bandingkan harga dan informasi tiap paket sebelum memilih.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-y border-slate-200">
          {isRealPackages
            ? (packages as RealPackage[]).map((pkg) => {
                const Icon = TYPE_ICON[pkg.product_type] || BookOpen;
                const isFree = pkg.price === 0;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col border-b sm:border-r sm:last:border-r-0 border-slate-200 bg-white transition-colors hover:bg-slate-50"
                  >
                    {/* Cover image */}
                    {pkg.cover_image_url && (
                      <div className="relative h-40 overflow-hidden shrink-0 bg-slate-100">
                        <img src={pkg.cover_image_url} alt={`Sampul ${pkg.title}`} className="w-full h-full object-cover" loading="lazy" onError={(e) => { const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.style.display='none'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}

                    <div className="p-5 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-blue-700" />
                        </div>
                        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-800">{productTypeLabel(pkg.product_type)}</p>
                      </div>
                      <h3 className="text-[18px] font-bold text-slate-900 leading-snug mb-4">{pkg.title}</h3>

                      {/* Price */}
                      <div className="mb-4 pb-4 border-b border-slate-200">
                        {pkg.original_price && pkg.original_price > pkg.price && (
                          <span className="text-[12px] line-through block mb-1 text-slate-500">
                            Rp {pkg.original_price.toLocaleString('id-ID')}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[24px] font-bold tracking-tight leading-none text-slate-900">
                            {isFree ? 'Gratis' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>

                      {/* Description as checklist */}
                      {pkg.description && <DescChecklist text={pkg.description} />}
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        onClick={() => onPackageSelect ? onPackageSelect(pkg.id) : onEnter()}
                        className="group w-full min-h-11 flex items-center justify-between px-4 border border-blue-800 bg-blue-800 font-semibold text-[13px] text-white transition-colors hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                      >
                        <span>{isFree ? 'Mulai gratis' : 'Daftar untuk melihat paket'}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            : (packages as CMSPackage[]).map((p) => (
                <motion.div
                  key={p.name}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex flex-col border-b sm:border-r sm:last:border-r-0 border-slate-200 transition-colors ${p.isRecommended ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'}`}
                >
                  {p.isRecommended && (
                    <div className="absolute top-0 right-5 -translate-y-1/2 px-3 py-1 bg-blue-800 text-white text-[10px] font-semibold tracking-wide">
                      DIREKOMENDASIKAN
                    </div>
                  )}
                  <div className="p-7 lg:p-8 flex-1">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-1">{p.name}</h3>
                    <p className="text-[13px] mb-6 text-slate-700">
                      Paket persiapan SKD
                    </p>
                    <div className="mb-7 pb-7 border-b border-slate-200">
                      {p.originalPrice && p.originalPrice !== "0" && (
                        <span className="text-[13px] line-through block mb-0.5 text-slate-500">{p.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] font-bold tracking-tight leading-none text-slate-900">{p.price}</span>
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      {p.benefits.map((b, bi) => (
                        <div key={bi} className="flex items-start gap-3">
                          <div className="w-[20px] h-[20px] border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0 mt-px">
                            <Check className="w-3 h-3 text-blue-700" strokeWidth={3} />
                          </div>
                          <span className="text-[14px] leading-snug text-slate-700">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-7 lg:px-8 pb-8">
                    <button onClick={onEnter} className="w-full h-11 border border-blue-800 bg-blue-800 font-semibold text-[13px] text-white transition-colors hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                      Daftar untuk melihat paket
                    </button>
                  </div>
                </motion.div>
              ))
          }
        </div>

        <p className="text-center text-[13px] text-slate-600 mt-8">
          Detail akses dan langkah pemesanan tersedia di halaman katalog paket.
        </p>
      </div>
    </section>
  );
});
