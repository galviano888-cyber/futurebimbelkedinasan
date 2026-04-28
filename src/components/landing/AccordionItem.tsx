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
    <div className="group">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-8 flex items-center justify-between text-left transition-all"
      >
        <span className={`text-base lg:text-lg font-black tracking-tight transition-all duration-300 ${isOpen ? 'text-blue-400 translate-x-2' : 'text-white'}`}>
          {question}
        </span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-blue-500 text-white rotate-45' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
          <Plus className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-8 pl-2 pr-4 text-slate-400 text-sm lg:text-base leading-relaxed text-justify font-medium">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
