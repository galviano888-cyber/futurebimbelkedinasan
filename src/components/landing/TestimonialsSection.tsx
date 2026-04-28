import { memo } from "react";
import { motion } from "framer-motion";

interface TestimonialsSectionProps {
  testimonials: Array<{
    name: string;
    text: string;
    school: string;
  }>;
}

export const TestimonialsSection = memo(function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section id="testimoni" className="py-32 bg-[#0a1425]">
       <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-16">Apa Kata Mereka?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {testimonials.map((t, i) => (
               <motion.div key={i} whileHover={{ y: -5 }} className="p-10 bg-white/[0.03] rounded-[2.5rem] border border-white/5 text-left">
                  <p className="text-slate-400 italic mb-8 leading-relaxed text-justify">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs">{t.name.charAt(0)}</div>
                     <div>
                        <p className="font-black text-white text-sm">{t.name}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase">{t.school}</p>
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
       </div>
    </section>
  );
});
