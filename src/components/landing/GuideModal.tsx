import { memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal = memo(function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-[#050b18]/90 backdrop-blur-xl" onClick={onClose} />
          <motion.div 
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl max-h-[85dvh] overflow-y-auto bg-[#102b54] rounded-xl border border-blue-300/30 shadow-2xl"
          >
            <div className="p-6 sm:p-8 md:p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-blue-300 font-semibold mb-3">Panduan</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Mulai belajar di FBK</h2>
                  <p className="text-blue-100 font-medium text-sm">4 Langkah mudah mulai belajar di Future Bimbel Kedinasan.</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <Step number={1} title="Registrasi Akun" desc='Klik tombol "Masuk" dan isi data diri Anda untuk membuat akun baru.' />
                <Step number={2} title="Pilih Paket" desc="Pilih paket tryout atau bimbel yang sesuai di halaman Katalog Paket." />
                <Step number={3} title="Konfirmasi pembayaran" desc="Untuk paket berbayar, ikuti instruksi pemesanan dan konfirmasi kepada admin melalui WhatsApp." />
                <Step number={4} title="Mulai Belajar" desc="Akses dashboard Anda untuk mengerjakan tryout, melihat ranking, dan materi belajar." />
              </div>

              <button onClick={onClose} className="w-full mt-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Saya Mengerti
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

function Step({ number, title, desc }: { number: number, title: string, desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-blue-600/20">{number}</div>
      <div>
        <h4 className="text-white font-bold mb-1">{title}</h4>
        <p className="text-sm text-blue-100 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
