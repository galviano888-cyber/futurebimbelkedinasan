import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const Navbar = memo(function Navbar({ onLogin, onRegister }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Fitur", href: "#fitur" },
    { name: "Paket SKD", href: "#paket" },
    { name: "Testimoni", href: "#testimoni" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#050b18]/80 backdrop-blur-xl border-b border-white/5 transform-gpu will-change-[backdrop-filter]">
      <div className="max-w-7xl mx-auto px-6 h-24 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white font-black text-[10px] sm:text-sm shrink-0">
            FBK
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-xs sm:text-lg font-black tracking-tighter text-white whitespace-nowrap">
              Future Bimbel
            </span>
            <span className="text-xs sm:text-lg font-black tracking-tighter text-blue-500 whitespace-nowrap">
              Kedinasan
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="hover:text-blue-500 transition-colors">
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions & Mobile Toggle */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={onLogin} 
              className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 transition-colors"
            >
              Masuk
            </button>
            <Button 
              onClick={onRegister} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-blue-600/20 text-[11px] uppercase tracking-widest"
            >
              DAFTAR SEKARANG
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1.5 text-white hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-[#050b18]/95 border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-slate-300 hover:text-blue-500 transition-colors py-2 flex items-center justify-between"
                >
                  {link.name}
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                </a>
              ))}
              <div className="h-px bg-white/5 my-2" />
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { onLogin(); setIsOpen(false); }}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border border-blue-500/30 rounded-2xl hover:bg-blue-500/5 transition-all"
                >
                  MASUK
                </button>
                <button 
                  onClick={() => { onRegister(); setIsOpen(false); }}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Rocket className="w-3 h-3" />
                  DAFTAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});
