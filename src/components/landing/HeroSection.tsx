import { memo } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  colors, 
  onEnter, 
  containerVariants, 
  itemVariants 
}: HeroSectionProps) {
  return (
    <section className="pt-36 lg:pt-24 pb-0 bg-[#0a1425] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 lg:pr-10">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase mb-4 mt-2 shadow-sm" style={{ color: colors.badge }}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{hero.badge}</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-[1.75rem] xs:text-[2rem] sm:text-[3rem] lg:text-[2.8rem] font-black tracking-tighter leading-[1.2] text-white" style={{ textWrap: 'balance' } as any}>
            {(() => {
              const lastComma = hero.title.lastIndexOf(',');
              const hasSplit = lastComma > 0;
              const firstPart = hasSplit ? hero.title.slice(0, lastComma) + ',' : hero.title;
              const secondPart = hasSplit ? hero.title.slice(lastComma + 1).trim() : '';
              return (
                <>
                  <span className="block text-white">{firstPart}</span>
                  {secondPart && (
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                      {secondPart}
                    </span>
                  )}
                </>
              );
            })()}
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-sm sm:text-base lg:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 text-slate-400 font-medium text-center lg:text-justify lg:-translate-y-4 px-2 sm:px-0">
            {hero.subtitle}
          </motion.p>

          {/* Mobile Image Display */}
          <motion.div 
            variants={itemVariants}
            className="lg:hidden relative py-8 max-w-xs mx-auto"
          >
            <div className="relative aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="/hero-squad.png" 
                alt="Squad Kedinasan" 
                className="w-full h-full object-cover brightness-110 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1425] via-transparent to-transparent" />
            </div>
            {/* Floating Stats for Mobile */}
            <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 bg-white/10 backdrop-blur-xl p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 shadow-xl z-20">
               <p className="text-[7px] sm:text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Target Skor</p>
               <p className="text-[10px] sm:text-xs font-black text-white">450+ SKD</p>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
            <Button onClick={onEnter} className="w-full sm:w-auto h-16 px-10 text-white font-black text-lg rounded-2xl shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all group shrink-0" style={{ backgroundColor: colors.cta }}>
              Mulai Belajar Sekarang 
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Desktop Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="hidden lg:block relative"
        >
           <div className="relative z-10 w-full h-[500px] lg:h-[620px] flex items-end justify-center lg:justify-end pr-4 lg:pr-10">
              <div className="relative h-full w-auto flex items-end justify-center w-full">
                <img 
                  src="/hero-squad.png" 
                  alt="Squad Kedinasan" 
                  className="h-[100%] w-auto max-w-none object-contain brightness-110 contrast-[1.05] origin-bottom animate-in fade-in zoom-in-95 duration-1000 translate-y-12 lg:translate-y-32 scale-[1.25] lg:scale-[1.72]"
                  style={{
                    maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 100%)',
                    willChange: 'transform'
                  }}
                  loading="eager"
                />
              </div>
              
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[120%] h-40 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
              
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ willChange: "transform" }}
                className="absolute bottom-[15%] left-0 lg:-left-40 bg-white/5 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                       <Trophy className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] leading-none mb-1.5">Target Skor</p>
                       <p className="text-xl font-black text-white tracking-tight">SKD 450+</p>
                    </div>
                 </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ willChange: "transform" }}
                className="absolute top-[30%] -right-4 lg:-right-32 bg-white/5 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                       <Zap className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em] leading-none mb-1.5">Simulasi CAT</p>
                       <p className="text-xl font-black text-white tracking-tight">Standar BKN</p>
                    </div>
                 </div>
              </motion.div>
           </div>
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-[80px] -z-10" />
        </motion.div>
      </div>
    </section>
  );
});
