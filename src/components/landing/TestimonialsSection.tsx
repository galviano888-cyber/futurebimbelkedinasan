import { memo } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { BookOpenCheck, ClipboardList, Target } from "lucide-react";

interface TestimonialsSectionProps {
  testimonials: Array<{
    name: string;
    text: string;
    school: string;
  }>;
}

export const TestimonialsSection = memo(function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const reduceMotion = useReducedMotion();
  if (testimonials.length === 0) {
    const steps = [
      { number: "01", title: "Pilih tryout", text: "Pilih latihan SKD yang sesuai dengan kebutuhan dan paket yang kamu miliki.", icon: Target },
      { number: "02", title: "Kerjakan soal", text: "Latih TWK, TIU, dan TKP dalam sesi tryout dengan batas waktu.", icon: ClipboardList },
      { number: "03", title: "Tinjau hasil", text: "Periksa skor dan pembahasan yang tersedia untuk menentukan fokus latihan selanjutnya.", icon: BookOpenCheck },
    ];

    return (
      <section id="testimoni" className="relative py-20 lg:py-28 border-t border-white/[0.07] overflow-hidden bg-[#0c2148]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="text-[11px] font-bold text-blue-300 tracking-widest uppercase mb-4">Alur Belajar</p>
            <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12]">
              Dari latihan ke evaluasi.
            </h2>
            <p className="text-[15px] text-blue-100/65 leading-relaxed mt-4">
              Pilih latihan, kerjakan soal, lalu gunakan hasilnya untuk menentukan fokus belajar berikutnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map(({ number, title, text, icon: Icon }) => (
              <div key={number} className="relative border-t border-blue-300/25 pt-5">
                <div className="flex items-center justify-between mb-7">
                  <span className="text-xs font-semibold tracking-widest text-blue-300/70">{number}</span>
                  <Icon className="w-5 h-5 text-blue-300" strokeWidth={1.7} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-blue-100/65 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">Cerita Siswa</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12]">
            Pengalaman belajar di FBK.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {testimonials.map((t, i) => {
            return (
              <motion.div
                key={i}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative p-7 lg:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.12] hover:border-blue-400/35 hover:bg-white/[0.10] transition-all duration-300 shadow-lg shadow-black/10"
              >
                <p className="text-[14.5px] leading-relaxed text-blue-100/80 mb-6 text-justify">
                  {t.text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0 bg-blue-500/15 text-blue-200">
                    {t.name?.charAt(0)?.toUpperCase() || "S"}
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
