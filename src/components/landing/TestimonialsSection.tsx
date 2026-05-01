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
    <section id="testimoni" className="py-20 lg:py-32 bg-[#050b18] relative overflow-hidden">
       {/* Background Orbs */}
       <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-600/5 blur-[120px] -z-10" />

       <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center lg:text-left">
             <h2 className="text-3xl lg:text-5xl font-black text-white mb-4 tracking-tight">Apa Kata Mereka?</h2>
             <p className="text-sm lg:text-base text-slate-400 font-medium max-w-lg mx-auto lg:mx-0">Mulai langkah pertamamu sekarang untuk meraih seragam impian bersama FBK.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
             {testimonials.map((t, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 lg:p-10 bg-white/[0.02] backdrop-blur-sm rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all duration-500"
               >
                  <p className="text-sm lg:text-base text-slate-300 leading-relaxed italic mb-8">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/20">
                        {t.name[0]}
                     </div>
                     <div>
                        <p className="text-sm font-black text-white">{t.name}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{t.school}</p>
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
       </div>
    </section>
  );
});
