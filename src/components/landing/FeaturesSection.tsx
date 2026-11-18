import { memo } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { BookOpenCheck, ClipboardList, Target, Trophy, BarChart2 } from "lucide-react";

interface FeaturesSectionProps {
  features: Array<{ title: string; desc: string; }>;
}

const icons = [Target, ClipboardList, BookOpenCheck, BarChart2, Trophy, ClipboardList];

export const FeaturesSection = memo(function FeaturesSection({ features }: FeaturesSectionProps) {
  const reduceMotion = useReducedMotion();
  return (
    <section id="fitur" className="relative py-20 lg:py-28 bg-[#f3f5f7] text-slate-900 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold text-blue-700 tracking-[0.16em] uppercase mb-4">Fitur Belajar</p>
            <h2 className="text-[30px] lg:text-[42px] font-bold tracking-[-0.04em] leading-[1.08] mb-4">
              Latihan yang berujung pada evaluasi.
            </h2>
            <p className="text-[15px] text-slate-600 leading-[1.75]">
              Gunakan tryout untuk melihat bagian yang sudah dikuasai dan yang masih perlu dilatih.
            </p>
          </div>

          <div className="divide-y divide-slate-300/80 border-y border-slate-300/80">
            {features.map((f, i) => {
              const Icon = icons[i % icons.length];
              return (
                <motion.article
                  key={`${f.title}-${i}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-[42px_1fr] sm:grid-cols-[54px_1fr] gap-4 sm:gap-6 py-6 sm:py-7"
                >
                  <div className="text-blue-700 pt-0.5"><Icon className="w-5 h-5" strokeWidth={1.7} /></div>
                  <div className="grid sm:grid-cols-[0.7fr_1.3fr] gap-2 sm:gap-8">
                    <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">{f.title}</h3>
                    <p className="text-[14px] text-slate-600 leading-[1.7]">{f.desc}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});
