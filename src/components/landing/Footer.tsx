import { memo } from "react";
import { Mail, MessageCircle, MapPin, Phone, ArrowRight } from "lucide-react";

interface FooterProps {
  onLegalClick: (type: 'terms' | 'privacy') => void;
  hasPackages?: boolean;
}

export const Footer = memo(function Footer({ onLegalClick, hasPackages }: FooterProps) {
  return (
    <footer className="bg-[#091b38] text-slate-300 border-t border-white/[0.07]">
      {/* CTA strip */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 lg:pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-10 lg:px-12 lg:py-14">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-[20px] lg:text-[24px] font-extrabold text-white tracking-tight leading-tight">
                Siap raih seragam impianmu?
              </h3>
              <p className="text-[13px] lg:text-[14px] text-blue-100 mt-2 max-w-md">
                Gabung bersama ribuan calon abdi negara dan mulai persiapan terbaikmu hari ini.
              </p>
            </div>
            <a
              href="#paket"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-blue-700 font-semibold text-[15px] rounded-xl hover:bg-blue-50 transition-all shadow-lg active:scale-[0.98] shrink-0"
            >
              Mulai Sekarang
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 lg:py-16">
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-12">

          {/* Brand Column */}
          <div className="max-w-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center shadow-lg shadow-blue-600/25">
                FBK
              </div>
              <span className="text-[15px] font-semibold text-white tracking-tight">
                Future Bimbel Kedinasan
              </span>
            </div>
            <p className="text-[13.5px] text-slate-400 leading-relaxed text-justify">
              Partner strategis untuk raih kursi sekolah kedinasan impianmu. Simulasi CAT standar BKN dengan materi terakurat.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://wa.me/6287753646617"
                className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@futurebimbelkedinasan.com"
                className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-10 lg:gap-16">
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-semibold text-white uppercase tracking-wide">Navigasi</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Keunggulan', id: 'fitur' },
                  ...(hasPackages !== false ? [{ name: 'Paket SKD', id: 'paket' }] : []),
                  { name: 'FAQ', id: 'faq' }
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={`#${link.id}`}
                      className="text-[13.5px] text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-semibold text-white uppercase tracking-wide">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => onLegalClick('terms')}
                    className="text-[13.5px] text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Syarat &amp; Ketentuan
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onLegalClick('privacy')}
                    className="text-[13.5px] text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Kebijakan Privasi
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-semibold text-white uppercase tracking-wide">Kontak</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-[13px] text-slate-400 leading-relaxed">
                    Komp Kehakiman Jl. Kumdang 3 No 4,<br />
                    Tanah Tinggi, Tangerang
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[13px] text-slate-400">
                    support@futurebimbelkedinasan.com
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[13px] text-slate-400">0877-5364-6617</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[12.5px] text-slate-500">
            © 2026 Future Bimbel Kedinasan. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-[12.5px] text-slate-500">
            Dibuat untuk calon abdi negara terbaik.
          </p>
        </div>
      </div>
    </footer>
  );
});
