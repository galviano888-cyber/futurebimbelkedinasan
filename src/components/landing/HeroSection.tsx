import { memo } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

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
  containerVariants: Variants;
  itemVariants: Variants;
}

export const HeroSection = memo(function HeroSection({
  hero,
  onEnter,
  containerVariants,
  itemVariants
}: HeroSectionProps) {
  return (
    <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-4 lg:pb-6 overflow-hidden bg-gradient-to-b from-[#16315f] via-[#12294f] to-[#0f2750]">
      {/* Glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-[8%] w-[260px] h-[260px] bg-sky-400/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-16 left-[6%] w-[240px] h-[240px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 80%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Text Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 text-[12px] font-semibold text-blue-200 mb-6 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {hero.badge}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-[2rem] sm:text-[2.6rem] lg:text-[3.1rem] font-extrabold tracking-tight leading-[1.1] text-white mb-5"
            >
              {(() => {
                const lastComma = hero.title.lastIndexOf(',');
                const hasSplit = lastComma > 0;
                const firstPart = hasSplit ? hero.title.slice(0, lastComma) + ',' : hero.title;
                const secondPart = hasSplit ? hero.title.slice(lastComma + 1).trim() : '';
                return (
                  <>
                    <span className="block">{firstPart}</span>
                    {secondPart && (
                      <span className="block text-blue-300">
                        {secondPart}
                      </span>
                    )}
                  </>
                );
              })()}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-[15px] lg:text-[16px] leading-relaxed text-blue-100/70 max-w-lg mx-auto lg:mx-0 mb-8"
            >
              {hero.subtitle}
            </motion.p>

            {/* Mobile Image */}
            <motion.div
              variants={itemVariants}
              className="lg:hidden relative mb-8 max-w-[240px] mx-auto"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                <img
                  src="/hero-squad.png"
                  alt="Squad Kedinasan"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f2750]/60 to-transparent" />
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={onEnter}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-[15px] rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 active:scale-[0.98]"
              >
                <span>{hero.cta || 'Mulai Belajar Sekarang'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <a
                href="#paket"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-blue-100 hover:text-white rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-all duration-200"
              >
                Lihat Paket
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-x-7 gap-y-3 justify-center lg:justify-start mt-8 pt-7 border-t border-white/[0.1]"
            >
              {[
                { label: "Simulasi CAT", value: "Standar BKN" },
                { label: "Materi", value: "Selalu Terupdate" },
                { label: "Akses", value: "Multi Perangkat" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-blue-300" strokeWidth={3} />
                  </span>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-white leading-none">{item.value}</p>
                    <p className="text-[11px] text-blue-200/55 mt-0.5">{item.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Desktop Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
            className="hidden lg:block relative"
          >
            <div className="relative h-[600px] flex items-end justify-center">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-blue-500/20 rounded-full blur-[80px]" />

              <img
                src="/hero-squad.png"
                alt="Squad Kedinasan"
                className="relative h-full w-auto max-w-none object-contain origin-bottom scale-[1.85] translate-y-44"
                style={{ willChange: 'transform' }}
                loading="eager"
              />


            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
});
