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
    <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-4 lg:pb-6 overflow-hidden bg-gradient-to-b from-[#16315f] via-[#12294f] to-[#0f2750]">
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
              <span className="inline-flex items-center gap-3 border-l-2 border-blue-300 pl-3 py-1 text-[11px] font-semibold text-white mb-6 tracking-[0.12em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                {hero.badge}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={reduceMotion ? undefined : itemVariants}
              className="text-[2.2rem] sm:text-[3rem] lg:text-[3.65rem] font-bold tracking-[-0.04em] leading-[1.03] text-white mb-5"
            >
              {hero.title.includes("|") ? (
                <>
                  <span className="block">{hero.title.split("|")[0].trim()}</span>
                  <span className="block text-blue-300">{hero.title.split("|").slice(1).join("|").trim()}</span>
                </>
              ) : hero.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={reduceMotion ? undefined : itemVariants}
              className="text-[15px] lg:text-[17px] leading-[1.75] text-blue-50 max-w-xl mx-auto lg:mx-0 mb-8"
            >
              {hero.subtitle}
            </motion.p>

            {/* Mobile Image */}
            <motion.div
              variants={reduceMotion ? undefined : itemVariants}
              className="lg:hidden relative mb-8 max-w-[300px] mx-auto"
            >
              <div className="relative aspect-[4/4.4] overflow-hidden bg-gradient-to-b from-[#1b3968] to-[#10264a]">
                <img
                  src="/hero-squad.png"
                  alt="Squad Kedinasan"
                  className="absolute inset-x-0 bottom-0 w-full h-full object-contain object-bottom"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={onEnter}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-[15px] rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 active:scale-[0.98]"
              >
                <span>{hero.cta || 'Mulai Belajar Sekarang'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <a
                href="#paket"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-white hover:text-white rounded-xl border border-white/30 hover:border-white/60 hover:bg-white/[0.08] transition-all duration-200"
              >
                Lihat Paket
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={reduceMotion ? undefined : itemVariants}
              className="flex flex-wrap items-center gap-x-7 gap-y-3 justify-center lg:justify-start mt-8 pt-6 border-t border-white/[0.16]"
            >
              {[
                { label: "Materi", value: "TWK · TIU · TKP" },
                { label: "Latihan", value: "Tryout SKD" },
                { label: "Evaluasi", value: "Hasil & pembahasan" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-blue-100 uppercase tracking-[0.12em] mb-1">{item.label}</p>
                    <p className="text-[13px] font-semibold text-white leading-snug">{item.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
            <button
              type="button"
              onClick={onLogin}
              className="mt-5 text-[12px] font-medium text-blue-50 underline underline-offset-4 decoration-blue-100/70 hover:text-white transition-colors"
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
              <div className="absolute inset-x-[8%] bottom-[4%] top-[8%] bg-gradient-to-b from-[#1a3764] to-[#0c2144]" />
              <div className="absolute inset-x-[8%] bottom-[4%] top-[8%] border border-white/[0.08]" />
              <img
                src="/hero-squad.png"
                alt="Squad Kedinasan"
                className="relative z-10 h-[94%] w-full object-contain object-bottom"
                loading="eager"
              />
              <div className="absolute z-20 left-[8%] bottom-[4%] bg-[#0f2750] border-t border-r border-white/10 px-5 py-4 max-w-[250px]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100 mb-1">Future Bimbel Kedinasan</p>
                <p className="text-sm font-semibold text-white">Latihan SKD. Evaluasi. Ulangi.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
});
