import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AccordionItem } from "./AccordionItem";
import { DEFAULT_LANDING_SECTIONS, type LandingSections } from "@/lib/landingSections";

interface FAQSectionProps {
  faqs: Array<{
    q: string;
    a: string;
  }>;
  copy?: LandingSections["faq"];
}

export const FAQSection = memo(function FAQSection({ faqs, copy }: FAQSectionProps) {
  const reduceMotion = useReducedMotion();
  const heading = copy ?? DEFAULT_LANDING_SECTIONS.faq;

  return (
    <section id="faq" className="relative py-20 lg:py-28 bg-[#163b73] border-t border-blue-300/20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-[11px] font-bold text-sky-200 tracking-[0.16em] uppercase">{heading.eyebrow}</span>
          </div>
          <h2 className="text-[28px] lg:text-[38px] font-bold text-white tracking-[-0.04em] leading-[1.12]">
            {heading.title}
          </h2>
          <p className="text-[15px] lg:text-[16px] text-blue-50 mt-4">
            {heading.description}
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border-y border-white/25 divide-y divide-white/20 px-1 sm:px-5 lg:px-7"
        >
          {faqs.map((f, i) => (
            <AccordionItem key={i} question={f.q} answer={f.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
});
