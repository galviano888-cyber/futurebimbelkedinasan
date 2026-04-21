import { motion } from "framer-motion";
import { ArrowRight, BookMarked, Clock, FileText, Zap } from "lucide-react";
import type { ActivePackageData } from "@/types";
import { cn } from "@/lib/utils";

interface ActivePackageProps {
  packageData: ActivePackageData | null;
  onNavigate?: (page: string) => void;
}

export function ActivePackage({ packageData, onNavigate }: ActivePackageProps) {
  if (!packageData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        className="h-full"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all hover:border-blue-500/20">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner relative z-10 group-hover:rotate-6 transition-transform">
            <BookMarked className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-slate-900 dark:text-white font-black text-xl mb-3 tracking-tight">
              Belum Ada Paket Aktif
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-8 leading-relaxed font-medium">
              Tingkatkan peluang lulusmu dengan mengikuti program intensif kami.
            </p>
            <button 
              onClick={() => onNavigate?.("Paket dan Tryout SKD")}
              className="w-full flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all duration-300 group/btn"
            >
              Katalog Paket
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/30 h-full flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none blur-2xl" />

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-6 h-6 text-yellow-300 fill-current" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                  {packageData.category}
                </p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-white text-[10px] font-black uppercase tracking-widest">AKTIF</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-white font-black text-2xl leading-tight mb-4 tracking-tight">
            {packageData.name}
          </h3>

          <p className="text-white/70 text-sm leading-relaxed mb-8 flex-1 font-medium">
            {packageData.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                  Konten
                </span>
              </div>
              <p className="text-white font-black text-2xl leading-none tracking-tighter">
                {packageData.totalSoal}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-colors hover:bg-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                  Akses
                </span>
              </div>
              <p className="text-white font-black text-xs leading-tight">
                Hingga {new Date(packageData.expiresAt).getFullYear()}
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate?.("Paket Saya")}
            className="w-full flex items-center justify-center gap-3 bg-white text-blue-700 font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all duration-300 shadow-xl hover:bg-blue-50 active:scale-95 group/btn"
          >
            Buka Paket Sekarang
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
