import { memo } from "react";
import { 
  Mail, 
  MessageCircle, 
  MapPin, 
  Phone
} from "lucide-react";

interface FooterProps {
  onLegalClick: (type: 'terms' | 'privacy') => void;
  hasPackages?: boolean;
}

export const Footer = memo(function Footer({ onLegalClick, hasPackages }: FooterProps) {
  return (
    <footer className="py-20 lg:py-24 bg-[#0a0f1d] border-t border-white/5 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between gap-x-12 gap-y-16 mb-20 items-center lg:items-start text-center lg:text-left">
          
          {/* Brand Column */}
          <div className="flex-[1.5] space-y-6 flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xl shadow-blue-600/20">
                FBK
              </div>
              <div className="flex flex-col -space-y-1 text-left">
                <span className="text-lg font-black text-white tracking-tight">Future Bimbel</span>
                <span className="text-lg font-black text-blue-500 tracking-tight">Kedinasan</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-sm text-center lg:text-justify">
              Partner strategis nomor satu untuk raih kursi sekolah kedinasan impianmu. Kami fokus memberikan pendampingan intensif dengan materi terakurat dan sistem simulasi CAT yang presisi demi mencetak calon abdi negara terbaik.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <MessageCircle className="w-4 h-4" />, href: "https://wa.me/6287753646617", label: "WhatsApp" },
                { icon: <Mail className="w-4 h-4" />, href: "mailto:support@futurebimbelkedinasan.com", label: "Email" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex-1 space-y-6">
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Tautan Cepat</h4>
            <ul className="space-y-3 flex flex-col items-center lg:items-start">
              {[
                { name: 'Fitur', id: 'fitur' },
                ...(hasPackages !== false ? [{ name: 'Paket SKD', id: 'paket' }] : []),
                { name: 'FAQ', id: 'faq' }
              ].map((link) => (
                <li key={link.name}>
                  <a href={`#${link.id}`} className="group flex items-center justify-center lg:justify-start gap-2.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                    <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-blue-500 scale-0 group-hover:scale-100 transition-transform duration-300" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="flex-1 space-y-6">
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Bantuan & Legal</h4>
            <ul className="space-y-3 flex flex-col items-center lg:items-start">
              <li>
                <button onClick={() => onLegalClick('terms')} className="group flex items-center justify-center lg:justify-start gap-2.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                  <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-blue-500 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  Syarat & Ketentuan
                </button>
              </li>
              <li>
                <button onClick={() => onLegalClick('privacy')} className="group flex items-center justify-center lg:justify-start gap-2.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                  <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-blue-500 scale-0 group-hover:scale-100 transition-transform duration-300" />
                  Kebijakan Privasi
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex-[1.5] space-y-6">
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Hubungi Kami</h4>
            <div className="space-y-4 flex flex-col items-center lg:items-start">
              <div className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-400 leading-relaxed font-medium pt-1 text-center lg:text-left">
                  Komp Kehakiman Jl. Kumdang 3 No 4 <br />
                  Rt 05/13 Tanah Tinggi, Tangerang
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  support@futurebimbelkedinasan.com
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  0877-5364-6617
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center md:text-left">
            © 2026 <span className="text-white">Future Bimbel Kedinasan</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});
