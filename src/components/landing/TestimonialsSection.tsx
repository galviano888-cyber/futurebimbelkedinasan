import { memo } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialsSectionProps {
  testimonials: Array<{
    name: string;
    text: string;
    school: string;
  }>;
}

// Deterministic soft color based on name initial
function getAvatarStyle(name: string): { bg: string; text: string } {
  const palettes = [
    { bg: "#dbeafe", text: "#2563eb" },
    { bg: "#dcfce7", text: "#16a34a" },
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#ffedd5", text: "#ea580c" },
    { bg: "#cffafe", text: "#0891b2" },
    { bg: "#fce7f3", text: "#db2777" },
  ];
  const idx = name.charCodeAt(0) % palettes.length;
  return palettes[idx];
}

export const TestimonialsSection = memo(function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section id="testimoni" className="relative py-20 lg:py-28 border-t border-white/[0.07] overflow-hidden" style={{ backgroundColor: '#0c2148' }}>
      {/* Background image wallpaper transparan */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/bg-testimonials.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12,
        }}
      />
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-12 lg:mb-16 text-center mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-blue-400/50" />
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">Komitmen Kami</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12]">
            Mengapa memilih kami?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {testimonials.map((t, i) => {
            const avatar = getAvatarStyle(t.name);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative p-7 lg:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.12] hover:border-blue-400/35 hover:bg-white/[0.10] transition-all duration-300 shadow-lg shadow-black/10"
              >
                <Quote className="w-8 h-8 text-blue-400/40 mb-4" fill="currentColor" />

                {/* Quote */}
                <p className="text-[14.5px] leading-relaxed text-blue-100/80 mb-6 text-justify">
                  {t.text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ backgroundColor: avatar.bg, color: avatar.text }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-white leading-none">{t.name}</p>
                    <p className="text-[11.5px] text-blue-300 mt-1.5 font-medium">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
