import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
  hasPackages?: boolean;
  onOpenGuide?: () => void;
  onOpenCatalog?: () => void;
}

export const Navbar = memo(function Navbar({ onLogin, onRegister, hasPackages, onOpenGuide, onOpenCatalog }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: "Fitur", href: "#fitur" },
    { name: "Alur Belajar", href: "#testimoni" },
    ...(hasPackages !== false ? [{ name: "Paket SKD", href: "#paket" }] : []),
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
      scrolled
        ? 'bg-white/95 backdrop-blur-xl border-b border-blue-100 shadow-[0_2px_12px_rgba(15,39,80,0.08)]'
        : 'bg-white/90 backdrop-blur-md border-b border-blue-100/80'
    }`}>
       <div className="max-w-7xl mx-auto px-5 sm:px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
           <div className="h-9 w-9 bg-blue-500 flex items-center justify-center text-white font-bold text-[12px] tracking-tight shrink-0 group-hover:bg-blue-400 transition-colors">
            FBK
          </div>
           <span className="text-[15px] font-medium text-[#102b54] tracking-tight">
            Future Bimbel Kedinasan
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[13.5px] text-blue-900 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200 font-medium px-3.5 py-2 rounded-lg"
            >
              {link.name}
            </a>
          ))}
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-[13.5px] text-blue-900 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200 font-medium px-3.5 py-2 rounded-lg"
            >
              Panduan
            </button>
          )}
          {onOpenCatalog && (
            <button
              type="button"
              onClick={onOpenCatalog}
              className="text-[13.5px] text-blue-900 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200 font-medium px-3.5 py-2 rounded-lg"
            >
              Lihat Paket
            </button>
          )}
        </div>

        {/* Desktop Actions & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onLogin}
              className="text-[13.5px] font-semibold text-blue-900 hover:text-blue-700 transition-colors duration-200 px-4 py-2 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-blue-50"
            >
              Masuk
            </button>
            <Button
                onClick={() => { onRegister(); setIsOpen(false); }}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2 h-auto rounded-xl text-[13.5px] transition-all duration-200 shadow-md shadow-blue-500/30 border border-blue-400/30"
            >
              Daftar Gratis
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-blue-900 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
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
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
            className="md:hidden bg-white border-b border-blue-100 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[15px] font-medium text-blue-900 hover:text-blue-700 transition-colors py-3 border-b border-blue-100 last:border-0"
                >
                  {link.name}
                </a>
              ))}
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={() => { onOpenGuide(); setIsOpen(false); }}
                  className="text-left text-[15px] font-medium text-blue-900 hover:text-blue-700 transition-colors py-3 border-b border-blue-100"
                >
                  Panduan
                </button>
              )}
              {onOpenCatalog && (
                <button
                  type="button"
                  onClick={() => { onOpenCatalog(); setIsOpen(false); }}
                  className="text-left text-[15px] font-medium text-blue-900 hover:text-blue-700 transition-colors py-3 border-b border-blue-100"
                >
                  Lihat Paket
                </button>
              )}
              <div className="flex flex-col gap-2.5 pt-4">
                <button
                  onClick={() => { onLogin(); setIsOpen(false); }}
                  className="w-full py-3.5 text-[14px] font-semibold text-blue-900 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Masuk
                </button>
                <button
                  onClick={() => { onRegister(); setIsOpen(false); }}
                  className="w-full py-3.5 text-[14px] font-bold bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all shadow-md shadow-blue-500/30 border border-blue-400/30"
                >
                  Daftar Gratis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});
