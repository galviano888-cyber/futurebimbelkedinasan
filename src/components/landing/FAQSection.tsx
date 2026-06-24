import { memo } from "react";
import { motion } from "framer-motion";
import { AccordionItem } from "./AccordionItem";

interface FAQSectionProps {
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

export const FAQSection = memo(function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <section id="faq" className="relative py-20 lg:py-28 bg-[#0e2550] border-t border-white/[0.07]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-blue-400/50" />
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">FAQ</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[38px] font-extrabold text-white tracking-tight leading-[1.12]">
            Masih ada pertanyaan?
          </h2>
          <p className="text-[15px] lg:text-[16px] text-blue-100/70 mt-4">
            Hal-hal yang paling sering ditanyakan calon siswa kami.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.12] divide-y divide-white/10 px-5 lg:px-7 shadow-lg shadow-black/10"
        >
          {faqs.map((f, i) => (
            <AccordionItem key={i} question={f.q} answer={f.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
});
