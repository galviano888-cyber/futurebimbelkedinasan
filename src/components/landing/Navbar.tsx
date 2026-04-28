import { memo } from "react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onEnter: () => void;
}

export const Navbar = memo(function Navbar({ onEnter }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b18]/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 px-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20 text-white font-black text-sm">FBK</div>
          <span className="text-xl font-black tracking-tighter text-white">Future Bimbel Kedinasan</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <a href="#fitur" className="hover:text-blue-500 transition-colors">Fitur</a>
          <a href="#paket" className="hover:text-blue-500 transition-colors">Paket SKD</a>
          <a href="#testimoni" className="hover:text-blue-500 transition-colors">Testimoni</a>
          <a href="#faq" className="hover:text-blue-500 transition-colors">FAQ</a>
        </div>
        <Button onClick={onEnter} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-blue-600/20 text-[11px] uppercase tracking-widest">MASUK SEKARANG</Button>
      </div>
    </nav>
  );
});
