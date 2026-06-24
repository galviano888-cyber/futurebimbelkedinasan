import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
  hasPackages?: boolean;
}

export const Navbar = memo(function Navbar({ onLogin, onRegister, hasPackages }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: "Fitur", href: "#fitur" },
    { name: "Keunggulan", href: "#testimoni" },
    ...(hasPackages !== false ? [{ name: "Paket SKD", href: "#paket" }] : []),
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
      scrolled
        ? 'bg-[#0f2750]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
        : 'bg-[#0f2750]/70 backdrop-blur-md border-b border-white/[0.06]'
    }`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-[12px] tracking-tight shrink-0 shadow-sm shadow-blue-600/25 group-hover:scale-105 transition-transform">
            FBK
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Future Bimbel Kedinasan
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[13.5px] text-blue-100/70 hover:text-white hover:bg-white/10 transition-colors duration-200 font-medium px-3.5 py-2 rounded-lg"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onLogin}
              className="text-[13.5px] font-semibold text-white/80 hover:text-white transition-all duration-200 px-4 py-2 rounded-xl border border-white/20 hover:border-white/35 hover:bg-white/[0.08]"
            >
              Masuk
            </button>
            <Button
              onClick={onRegister}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2 h-auto rounded-xl text-[13.5px] transition-all duration-200 shadow-md shadow-blue-500/30 border border-blue-400/30"
            >
              Daftar Gratis
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden bg-[#0f2750] border-b border-white/10 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[15px] font-medium text-blue-100/80 hover:text-blue-300 transition-colors py-3 border-b border-white/10 last:border-0"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2.5 pt-4">
                <button
                  onClick={() => { onLogin(); setIsOpen(false); }}
                  className="w-full py-3.5 text-[14px] font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/35 rounded-xl hover:bg-white/[0.08] transition-all"
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
