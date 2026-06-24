import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface AccordionItemProps {
  question: string;
  answer: string;
}

export const AccordionItem = memo(function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-start justify-between text-left gap-6 group"
      >
        <span className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${
          isOpen ? 'text-blue-300' : 'text-blue-50 group-hover:text-blue-300'
        }`}>
          {question}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
          isOpen ? 'bg-blue-500 text-white rotate-45' : 'bg-white/10 text-blue-200 group-hover:bg-blue-500/20 group-hover:text-blue-300'
        }`}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-[14px] text-blue-100/70 leading-relaxed text-justify">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
