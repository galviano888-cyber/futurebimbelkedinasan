import { memo } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  number: string;
}

export const FloatingWhatsApp = memo(function FloatingWhatsApp({ number }: FloatingWhatsAppProps) {
  const waNumber = number.replace(/[^0-9]/g, '');
  const finalNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber;

  return (
    <motion.a 
      href={`https://wa.me/${finalNumber}?text=${encodeURIComponent("Halo Admin FBK, saya ingin bertanya seputar paket bimbel...")}`}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-8 right-8 z-[100] group"
    >
      <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
      <div className="relative bg-green-500 p-4 md:p-5 rounded-full shadow-2xl flex items-center justify-center border border-white/20">
        <MessageCircle className="w-6 h-6 md:w-8 h-8 text-white fill-white" />
        <div className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl border border-slate-100 translate-x-2 group-hover:translate-x-0">
          Tanya Admin FBK 💬
        </div>
      </div>
    </motion.a>
  );
});
