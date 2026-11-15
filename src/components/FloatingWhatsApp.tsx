import { memo } from "react";
import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  number: string;
}

// Memakai animasi CSS (bukan framer-motion) supaya library animasi tidak ikut
// termuat pada beban awal halaman.
export const FloatingWhatsApp = memo(function FloatingWhatsApp({ number }: FloatingWhatsAppProps) {
  const waNumber = number.replace(/[^0-9]/g, '');
  const finalNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber;

  return (
    <a
      href={`https://wa.me/${finalNumber}?text=${encodeURIComponent("Halo Admin FBK, saya ingin bertanya seputar paket bimbel...")}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[100] group touch-manipulation animate-in fade-in zoom-in duration-500"
    >
      <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />
      <div className="relative bg-green-500 p-3.5 sm:p-5 rounded-full shadow-2xl flex items-center justify-center border border-white/20 transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
        <div className="absolute right-full mr-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl border border-slate-100 dark:border-slate-800 translate-x-2 group-hover:translate-x-0 hidden sm:block">
          Tanya Admin FBK 💬
        </div>
      </div>
    </a>
  );
});
