import { memo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  colors: {
    badge: string;
    cta: string;
  };
  onEnter: () => void;
  onLogin: () => void;
  containerVariants: Variants;
  itemVariants: Variants;
}

export const HeroSection = memo(function HeroSection({
  hero,
  onEnter,
  onLogin,
  containerVariants,
  itemVariants
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-4 lg:pb-6 overflow-hidden bg-[#f7f9fc]">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-100/70 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-12 items-center min-h-[calc(100svh-4.5rem)] py-10 lg:py-8">

          {/* Text Content */}
          <motion.div
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="text-center lg:text-left max-w-2xl"
          >
            {/* Badge */}
            <motion.div variants={reduceMotion ? undefined : itemVariants}>
              <span className="inline-flex items-center gap-3 border-l-2 border-blue-700 pl-3 py-1 text-[11px] font-semibold text-blue-800 mb-6 tracking-[0.12em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                {hero.badge}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={reduceMotion ? undefined : itemVariants}
              className="text-[2.2rem] sm:text-[3rem] lg:text-[3.65rem] font-bold tracking-[-0.04em] leading-[1.03] text-[#102b54] mb-5"
            >
              {hero.title.includes("|") ? (
                <>
                  <span className="block">{hero.title.split("|")[0].trim()}</span>
                  <span className="block text-blue-700">{hero.title.split("|").slice(1).join("|").trim()}</span>
                </>
              ) : hero.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={reduceMotion ? undefined : itemVariants}
              className="text-[15px] lg:text-[17px] leading-[1.75] text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8"
            >
              {hero.subtitle}
            </motion.p>

            {/* Mobile Image */}
            <motion.div
              variants={reduceMotion ? undefined : itemVariants}
              className="lg:hidden relative mb-8 max-w-[300px] mx-auto"
            >
              <div className="relative aspect-[4/4.4] overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800">
                <div className="absolute -right-14 -top-12 w-56 h-56 rounded-full border border-white/20" />
                <div className="absolute -right-8 -top-6 w-44 h-44 rounded-full border border-white/15" />
                <img
                  src="/hero-syauqi.jpeg"
                  alt="Syauqi, siswa sekolah kedinasan"
                  className="absolute bottom-0 left-[4%] h-[88%] w-[58%] object-cover object-top"
                  loading="eager"
                />
                <img src="/hero-rhea.webp" alt="Rhea, siswi sekolah kedinasan" className="absolute bottom-0 right-[1%] h-[82%] w-[51%] object-cover object-top" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/45 via-transparent to-blue-900/10 pointer-events-none" />
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={onEnter}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[15px] rounded-lg transition-colors duration-200 shadow-md shadow-blue-900/15 active:scale-[0.98]"
              >
                <span>{hero.cta || 'Mulai Belajar Sekarang'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <a
                href="#paket"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-blue-800 hover:text-blue-950 rounded-lg border border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
              >
                Lihat Paket
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={reduceMotion ? undefined : itemVariants}
              className="flex flex-wrap items-center gap-x-7 gap-y-3 justify-center lg:justify-start mt-8 pt-6 border-t border-blue-200"
            >
              {[
                { label: "Materi", value: "TWK · TIU · TKP" },
                { label: "Latihan", value: "Tryout SKD" },
                { label: "Evaluasi", value: "Hasil & pembahasan" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-[0.12em] mb-1">{item.label}</p>
                    <p className="text-[13px] font-semibold text-[#102b54] leading-snug">{item.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
            <button
              type="button"
              onClick={onLogin}
              className="mt-5 text-[12px] font-medium text-blue-800 underline underline-offset-4 decoration-blue-400 hover:text-blue-950 transition-colors"
            >
              Sudah punya akun? Masuk
            </button>
          </motion.div>

          {/* Desktop Image */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
            className="hidden lg:block relative self-stretch min-h-[560px]"
          >
            <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
              <div className="absolute inset-x-[4%] bottom-[3%] top-[5%] bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800" />
              <div className="absolute right-[7%] top-[8%] w-[66%] aspect-square rounded-full border border-white/20" />
              <div className="absolute right-[12%] top-[13%] w-[56%] aspect-square rounded-full border border-white/15" />
              <div className="absolute inset-x-[4%] bottom-[3%] top-[5%] border border-blue-300/40" />
              <img src="/hero-syauqi.jpeg" alt="Syauqi, siswa sekolah kedinasan" className="absolute z-10 bottom-[5%] left-[7%] h-[84%] w-[50%] object-cover object-top drop-shadow-[0_18px_30px_rgba(7,31,75,0.2)]" loading="eager" />
              <img src="/hero-rhea.webp" alt="Rhea, siswi sekolah kedinasan" className="absolute z-10 bottom-[5%] right-[4%] h-[78%] w-[45%] object-cover object-top drop-shadow-[0_18px_30px_rgba(7,31,75,0.2)]" loading="eager" />
              <div className="absolute z-20 left-[4%] bottom-[3%] bg-white border-t border-r border-blue-100 px-5 py-4 max-w-[250px]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-700 mb-1">Future Bimbel Kedinasan</p>
                <p className="text-sm font-semibold text-[#102b54]">Latihan SKD. Evaluasi. Ulangi.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
});
