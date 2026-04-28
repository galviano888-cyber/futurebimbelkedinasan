import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal = memo(function GuideModal({ isOpen, onClose }: GuideModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-[#050b18]/90 backdrop-blur-xl" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a1425] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-10 md:p-14">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Panduan Penggunaan</h2>
                  <p className="text-slate-400 font-medium text-sm">4 Langkah mudah mulai belajar di Future Bimbel Kedinasan.</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <Step number={1} title="Registrasi Akun" desc='Klik tombol "Masuk" dan isi data diri Anda untuk membuat akun baru.' />
                <Step number={2} title="Pilih Paket" desc="Pilih paket tryout atau bimbel yang sesuai di halaman Katalog Paket." />
                <Step number={3} title="Konfirmasi Pembayaran" desc="Lakukan transfer, lalu kirim bukti ke Admin via WhatsApp untuk aktivasi akun instan." />
                <Step number={4} title="Mulai Belajar" desc="Akses dashboard Anda untuk mengerjakan tryout, melihat ranking, dan materi belajar." />
              </div>

              <button onClick={onClose} className="w-full mt-12 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">
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
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
