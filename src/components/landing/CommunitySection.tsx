import { memo } from "react";
import { MessageCircle, ArrowRight, MessagesSquare } from "lucide-react";
import { TelegramIcon, TikTokIcon, InstagramIcon } from "./TelegramIcon";

const TELEGRAM_URL = "https://t.me/futurebimbelkedinasan";
const INSTAGRAM_URL = "https://instagram.com/futurebimbelkedinasan";
const TIKTOK_URL = "https://tiktok.com/@futurebimbelkedinasan";

interface Channel {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}

/**
 * Kanal komunitas yang tampil di landing page.
 *
 * Kanal tanpa `href` sengaja ditampilkan sebagai "Segera" agar tidak
 * mengarahkan siswa ke tautan yang belum aktif.
 */
const CHANNELS: Channel[] = [
  {
    icon: MessageCircle,
    title: "Grup WhatsApp Interaktif",
    description: "Grup untuk berdiskusi dan berbagi pengalaman.",
  },
  {
    icon: TelegramIcon,
    title: "Grup Pejuang Kedinasan",
    description: "Diskusi bersama calon abdi negara di Telegram.",
    href: TELEGRAM_URL,
    cta: "Gabung",
  },
  {
    icon: InstagramIcon,
    title: "Instagram @futurebimbelkedinasan",
    description: "Tips belajar, info seleksi, dan keseharian pejuang kedinasan.",
    href: INSTAGRAM_URL,
    cta: "Ikuti",
  },
  {
    icon: TikTokIcon,
    title: "TikTok @futurebimbelkedinasan",
    description: "Konten singkat seputar persiapan sekolah kedinasan.",
    href: TIKTOK_URL,
    cta: "Ikuti",
  },
];

export const CommunitySection = memo(function CommunitySection() {
  return (
    <section id="komunitas" className="relative bg-[#0f2750] py-16 lg:py-20 border-t border-blue-300/20">
      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-9">
          {/* Judul */}
          <div className="flex items-start gap-3 mb-5">
            <MessagesSquare className="w-6 h-6 text-sky-300 shrink-0 mt-0.5" strokeWidth={1.8} />
            <h2 className="text-[24px] sm:text-[28px] font-bold text-white tracking-[-0.03em] leading-tight">
              Komunitas Belajar
            </h2>
          </div>
          <p className="text-[14px] sm:text-[15px] text-blue-100 leading-relaxed max-w-2xl mb-8">
            Jangan berjuang sendirian! Bergabunglah dengan sesama pejuang untuk berbagi tips dan update terbaru.
          </p>

          {/* Kanal */}
          <div className="divide-y divide-white/10 border-t border-white/10">
            {CHANNELS.map(({ icon: Icon, title, description, href, cta }) => (
              <div key={title} className="flex flex-col sm:flex-row sm:items-center gap-4 py-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-white leading-snug">{title}</h3>
                    <p className="text-[13px] text-blue-100/80 mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>

                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex min-h-10 items-center justify-center gap-1.5 self-start sm:self-auto rounded-full bg-sky-500 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {cta ?? "Buka"}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-10 items-center justify-center self-start sm:self-auto rounded-full border border-white/25 px-6 py-2.5 text-[13px] font-semibold text-blue-100/70">
                    Segera
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
