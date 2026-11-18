import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AccordionItem } from "./AccordionItem";

interface FAQSectionProps {
  faqs: Array<{
    q: string;
    a: string;
  }>;
}

export const FAQSection = memo(function FAQSection({ faqs }: FAQSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="relative py-20 lg:py-28 bg-[#f3f5f7] border-t border-slate-200">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-[11px] font-bold text-blue-700 tracking-[0.16em] uppercase">Pertanyaan Umum</span>
          </div>
          <h2 className="text-[28px] lg:text-[38px] font-bold text-slate-900 tracking-[-0.04em] leading-[1.12]">
            Masih ada pertanyaan?
          </h2>
          <p className="text-[15px] lg:text-[16px] text-slate-700 mt-4">
            Informasi singkat tentang latihan dan paket FBK.
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border-y border-slate-300 divide-y divide-slate-300 px-1 sm:px-5 lg:px-7"
        >
          {faqs.map((f, i) => (
            <AccordionItem key={i} question={f.q} answer={f.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
});
