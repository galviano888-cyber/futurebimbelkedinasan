import { memo } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { AccordionItem } from "./AccordionItem";

interface FAQSectionProps {
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

export const FAQSection = memo(function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <section id="faq" className="py-20 lg:py-32 bg-[#0a1425] relative overflow-hidden content-auto">
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
       
       <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 mb-6"
             >
               <HelpCircle className="w-3.5 h-3.5" />
               <span>FAQ</span>
             </motion.div>
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="text-3xl lg:text-5xl font-black text-white mb-6 tracking-tight"
             >
               Pertanyaan yang <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Sering Diajukan</span>
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="text-sm lg:text-base text-slate-400 font-medium max-w-2xl mx-auto"
             >
               Temukan jawaban untuk pertanyaan umum seputar program belajar, sistem ujian, dan pendaftaran di Future Bimbel Kedinasan.
             </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] lg:rounded-[3rem] border border-white/5 p-4 lg:p-8 shadow-2xl"
          >
             <div className="divide-y divide-white/5">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} question={f.q} answer={f.a} />
                ))}
             </div>
          </motion.div>
       </div>
    </section>
  );
});
