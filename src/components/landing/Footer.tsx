import { memo } from "react";
import { MessageCircle, MapPin, ArrowRight } from "lucide-react";
import { DEFAULT_LANDING_SECTIONS, type LandingSections } from "@/lib/landingSections";
import { TelegramIcon } from "./TelegramIcon";

const TELEGRAM_URL = "https://t.me/futurebimbelkedinasan";

interface FooterProps {
  onLegalClick: (type: 'terms' | 'privacy') => void;
  copy?: LandingSections["footer"];
}

export const Footer = memo(function Footer({ onLegalClick, copy }: FooterProps) {
  const footerCopy = copy ?? DEFAULT_LANDING_SECTIONS.footer;
  return (
    <footer className="bg-[#091b38] text-blue-100 border-t border-blue-300/20">
      {/* CTA strip */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 lg:pt-20">
        <div className="relative overflow-hidden border-y border-blue-300/20 bg-[#143768] px-6 py-8 sm:px-9 lg:px-12 lg:py-10">
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-[20px] lg:text-[24px] font-bold text-white tracking-tight leading-tight">
                {footerCopy.ctaTitle}
              </h3>
              <p className="text-[13px] lg:text-[14px] text-blue-100 mt-2 max-w-md leading-relaxed">
                {footerCopy.ctaText}
              </p>
            </div>
            <a
              href="#paket"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-800 font-semibold text-[14px] hover:bg-blue-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shrink-0"
            >
              {footerCopy.ctaButton}
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
            <p className="text-[13.5px] text-blue-100 leading-relaxed">
              {footerCopy.description}
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://wa.me/6287753646617"
                className="w-9 h-9 rounded-xl bg-blue-800/60 border border-blue-300/30 flex items-center justify-center text-blue-100 hover:text-white hover:bg-blue-600 hover:border-blue-400 transition-all duration-200"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-blue-800/60 border border-blue-300/30 flex items-center justify-center text-blue-100 hover:text-white hover:bg-blue-600 hover:border-blue-400 transition-all duration-200"
                aria-label="Grup Telegram Pejuang Kedinasan"
              >
                <TelegramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-10 lg:gap-16">
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-semibold text-white uppercase tracking-wide">Navigasi</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Persiapan', id: 'fitur' },
                  { name: 'FAQ', id: 'faq' }
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={`#${link.id}`}
                      className="text-[13.5px] text-blue-100 hover:text-white transition-colors"
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
                    className="text-[13.5px] text-blue-100 hover:text-white transition-colors"
                  >
                    Syarat &amp; Ketentuan
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onLegalClick('privacy')}
                    className="text-[13.5px] text-blue-100 hover:text-white transition-colors"
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
                  <span className="text-[13px] text-blue-100 leading-relaxed">
                    Komp Kehakiman Jl. Kumdang 3 No 4,<br />
                    Tanah Tinggi, Tangerang
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="https://wa.me/6287753646617" className="text-[13px] text-blue-100 hover:text-white transition-colors">
                    0877-5364-6617 (WhatsApp)
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <TelegramIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="text-[13px] text-blue-100 hover:text-white transition-colors">
                    Grup Pejuang Kedinasan (Telegram)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[12.5px] text-blue-200/80">
            © 2026 Future Bimbel Kedinasan. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
});
