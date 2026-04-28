import { memo } from "react";

interface FooterProps {
  onLegalClick: (type: 'terms' | 'privacy') => void;
}

export const Footer = memo(function Footer({ onLegalClick }: FooterProps) {
  return (
    <footer className="py-20 bg-[#0a1425] border-t border-white/5">
       <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="flex items-center gap-3">
             <div className="h-10 px-3 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center shadow-lg shadow-blue-600/20">FBK</div>
             <span className="text-xl font-black text-white tracking-tight">Future Bimbel Kedinasan</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
             <div className="flex gap-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <button 
                  onClick={() => onLegalClick('terms')} 
                  className="hover:text-blue-400 transition-colors"
                >
                  Syarat & Ketentuan
                </button>
                <button 
                  onClick={() => onLegalClick('privacy')} 
                  className="hover:text-blue-400 transition-colors"
                >
                  Kebijakan Privasi
                </button>
             </div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">© 2026 Future Bimbel Kedinasan</p>
          </div>
       </div>
    </footer>
  );
});
