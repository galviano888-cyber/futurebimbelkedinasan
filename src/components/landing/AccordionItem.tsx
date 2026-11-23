import { useState, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

interface AccordionItemProps {
  question: string;
  answer: string;
}

export const AccordionItem = memo(function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-start justify-between text-left gap-6 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <span className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${
           isOpen ? 'text-white' : 'text-white group-hover:text-sky-100'
        }`}>
          {question}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
           isOpen ? 'bg-sky-200 text-blue-950 rotate-45' : 'bg-white/15 text-white group-hover:bg-white/25 group-hover:text-white'
        }`}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-[14px] text-blue-50 leading-relaxed text-justify">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
