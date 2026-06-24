import { memo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Zap, BookOpen, ShieldCheck, Trophy, BarChart2 } from "lucide-react";

interface FeaturesSectionProps {
  features: Array<{ title: string; desc: string; }>;
}

const icons = [GraduationCap, Zap, BookOpen, ShieldCheck, Trophy, BarChart2];
const accents = [
  { bg: "bg-blue-500/15", ring: "ring-blue-400/20", icon: "text-blue-300", hover: "hover:border-blue-400/30" },
  { bg: "bg-sky-500/15", ring: "ring-sky-400/20", icon: "text-sky-300", hover: "hover:border-sky-400/30" },
  { bg: "bg-indigo-500/15", ring: "ring-indigo-400/20", icon: "text-indigo-300", hover: "hover:border-indigo-400/30" },
  { bg: "bg-rose-500/15", ring: "ring-rose-400/20", icon: "text-rose-300", hover: "hover:border-rose-400/30" },
  { bg: "bg-amber-500/15", ring: "ring-amber-400/20", icon: "text-amber-300", hover: "hover:border-amber-400/30" },
  { bg: "bg-emerald-500/15", ring: "ring-emerald-400/20", icon: "text-emerald-300", hover: "hover:border-emerald-400/30" },
];

export const FeaturesSection = memo(function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section id="fitur" className="relative py-20 lg:py-28 bg-[#0c2148] border-t border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-12 lg:mb-16 text-center mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-blue-400/50" />
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">Keunggulan Kami</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12] mb-4">
            Bukan sekadar belajar, tapi
            <span className="text-blue-300"> dirancang untuk lolos.</span>
          </h2>
          <p className="text-[15px] lg:text-[16px] text-blue-100/65 leading-relaxed">
            Setiap komponen kami susun berdasarkan pola seleksi sesungguhnya, agar setiap menit belajarmu benar-benar berdampak.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((f, i) => {
            const Icon = icons[i % icons.length];
            const a = accents[i % accents.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative p-6 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.12] ${a.hover} hover:bg-white/[0.10] hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/10`}
              >
                <div className={`w-11 h-11 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${a.icon}`} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 leading-snug">{f.title}</h3>
                <p className="text-[13px] text-blue-100/65 leading-relaxed text-justify">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
