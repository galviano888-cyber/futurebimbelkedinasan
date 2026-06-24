import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, BookOpen, Zap, FileText } from "lucide-react";

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
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF';
  cover_image_url?: string | null;
}

interface PricingSectionProps {
  packages: CMSPackage[] | RealPackage[];
  isRealPackages?: boolean;
  onEnter: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  SATUAN: 'Tryout Satuan',
  BUNDLE: 'Bundle Tryout',
  INTENSIF: 'Paket Intensif',
};

const TYPE_ICON: Record<string, any> = {
  SATUAN: Zap,
  BUNDLE: BookOpen,
  INTENSIF: FileText,
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
          <span className="text-[13px] text-blue-100/75 leading-snug">{item}</span>
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

export const PricingSection = memo(function PricingSection({ packages, isRealPackages = false, onEnter }: PricingSectionProps) {
  return (
    <section id="paket" className="relative py-20 lg:py-28 bg-[#0e2550] border-t border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative">
        {/* Section header */}
        <div className="max-w-2xl mb-12 lg:mb-16 text-center mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-blue-400/50" />
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">Pilihan Paket</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12]">
            Investasi terbaik untuk masa depanmu
          </h2>
          <p className="text-[15px] lg:text-[16px] text-blue-100/70 mt-4 leading-relaxed">
            Pilih paket yang paling sesuai dengan kebutuhan persiapanmu. Mulai gratis, naik kelas kapan saja.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isRealPackages
            ? (packages as RealPackage[]).map((pkg, i) => {
                const Icon = TYPE_ICON[pkg.product_type] || BookOpen;
                const isFree = pkg.price === 0;
                const isMiddle = i === 1 && packages.length === 3;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative flex flex-col rounded-2xl transition-all duration-300 ${
                      isMiddle
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 shadow-xl shadow-blue-600/25 ring-1 ring-blue-400'
                        : 'bg-white/[0.05] border border-white/10 hover:border-blue-400/30 hover:bg-white/[0.08]'
                    }`}
                  >
                    {isMiddle && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold tracking-wide shadow-lg">
                        PALING POPULER
                      </div>
                    )}

                    {/* Cover image */}
                    {pkg.cover_image_url && (
                      <div className="relative h-36 rounded-t-3xl overflow-hidden shrink-0">
                        <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display='none'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}

                    <div className="p-5 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isMiddle ? 'bg-white/20' : 'bg-blue-500/20'
                        }`}>
                          <Icon className={`w-4 h-4 ${isMiddle ? 'text-white' : 'text-blue-300'}`} />
                        </div>
                        <p className={`text-[11px] font-semibold tracking-wide ${isMiddle ? 'text-blue-100' : 'text-blue-200/70'}`}>{TYPE_LABEL[pkg.product_type]}</p>
                      </div>
                      <h3 className="text-[17px] font-extrabold text-white leading-snug mb-3 uppercase tracking-wide">{pkg.title}</h3>

                      {/* Price */}
                      <div className={`mb-4 pb-4 border-b ${isMiddle ? 'border-blue-500/50' : 'border-white/10'}`}>
                        {pkg.original_price && pkg.original_price > pkg.price && (
                          <span className={`text-[11px] line-through block mb-0.5 ${isMiddle ? 'text-blue-200/70' : 'text-blue-200/50'}`}>
                            Rp {pkg.original_price.toLocaleString('id-ID')}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[22px] font-extrabold tracking-tight leading-none text-white">
                            {isFree ? 'Gratis' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                          </span>
                          {!isFree && (
                            <span className={`text-[10px] ${isMiddle ? 'text-blue-200' : 'text-blue-200/60'}`}>/selamanya</span>
                          )}
                        </div>
                      </div>

                      {/* Description as checklist */}
                      {pkg.description && <DescChecklist text={pkg.description} />}
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        onClick={onEnter}
                        className={`w-full h-9 rounded-lg font-semibold text-[12px] transition-all duration-200 active:scale-[0.98] ${
                          isMiddle
                            ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-900/40'
                        }`}
                      >
                        {isFree ? 'Mulai Gratis' : 'Daftar & Dapatkan'}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            : (packages as CMSPackage[]).map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex flex-col rounded-3xl transition-all duration-300 ${
                    p.isRecommended
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl shadow-blue-600/25 md:-translate-y-4 ring-1 ring-blue-400'
                      : 'bg-white/[0.05] border border-white/10 hover:border-blue-400/30 hover:bg-white/[0.08]'
                  }`}
                >
                  {p.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold tracking-wide shadow-lg">
                      PALING POPULER
                    </div>
                  )}
                  <div className="p-7 lg:p-8 flex-1">
                    <h3 className="text-[16px] font-extrabold text-white mb-1 uppercase tracking-wide">{p.name}</h3>
                    <p className={`text-[13px] mb-6 ${p.isRecommended ? 'text-blue-100' : 'text-blue-100/60'}`}>
                      {p.isRecommended ? 'Pilihan terbaik calon abdi negara' : 'Cocok untuk memulai persiapan'}
                    </p>
                    <div className={`mb-7 pb-7 border-b ${p.isRecommended ? 'border-blue-500/50' : 'border-white/10'}`}>
                      {p.originalPrice && p.originalPrice !== "0" && (
                        <span className={`text-[13px] line-through block mb-0.5 ${p.isRecommended ? 'text-blue-200/70' : 'text-blue-200/50'}`}>{p.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[36px] font-extrabold tracking-tight leading-none text-white">{p.price}</span>
                        {p.price !== 'Gratis' && <span className={`text-[12px] ${p.isRecommended ? 'text-blue-200' : 'text-blue-200/60'}`}>/ selamanya</span>}
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      {p.benefits.map((b, bi) => (
                        <div key={bi} className="flex items-start gap-3">
                          <div className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 mt-px ${p.isRecommended ? 'bg-white/20' : 'bg-blue-500/20'}`}>
                            <Check className={`w-3 h-3 ${p.isRecommended ? 'text-white' : 'text-blue-300'}`} strokeWidth={3} />
                          </div>
                          <span className={`text-[14px] leading-snug ${p.isRecommended ? 'text-blue-50' : 'text-blue-100/75'}`}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-7 lg:px-8 pb-8">
                    <button onClick={onEnter} className={`w-full h-12 rounded-xl font-semibold text-[14px] transition-all duration-200 active:scale-[0.98] ${
                      p.isRecommended ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-900/40'
                    }`}>
                      {p.price === 'Gratis' ? 'Mulai Gratis' : 'Pilih Paket Ini'}
                    </button>
                  </div>
                </motion.div>
              ))
          }
        </div>

        <p className="text-center text-[13px] text-blue-200/60 mt-10">
          Daftar akun untuk mengakses paket &middot; Pembayaran aman &middot; Akses langsung aktif
        </p>
      </div>
    </section>
  );
});
