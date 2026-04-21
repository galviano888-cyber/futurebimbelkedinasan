import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyViewProps {
  title: string;
}

export function EmptyView({ title }: EmptyViewProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
          Halaman ini sedang dalam tahap pengembangan.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-20 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 dark:bg-blue-900/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
            Belum Ada Event Aktif
          </h3>
          <p className="text-slate-400 dark:text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">
            Kami sedang menyiapkan event spesial untuk membantu persiapan belajarmu. Cek kembali nanti ya!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
