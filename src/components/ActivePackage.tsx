import { motion } from "framer-motion";
import { ArrowRight, BookMarked, Clock, FileText, Zap } from "lucide-react";
import type { ActivePackageData } from "@/types";

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
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <BookMarked className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg mb-2">
            Belum Ada Paket Aktif
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Tingkatkan peluang lulusmu dengan mengikuti program intensif kami.
          </p>
          <button 
            onClick={() => onNavigate?.("Paket dan Tryout SKD")}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold text-sm py-3 rounded-xl transition-all duration-300"
          >
            Lihat Katalog Paket
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }
  const expiresDate = new Date(packageData.expiresAt).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-xl shadow-blue-500/20 h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                <BookMarked className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                  Paket Aktif
                </p>
                <p className="text-white text-xs font-bold">
                  {packageData.category}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 bg-white/20 border border-white/30 text-white text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AKTIF
            </span>
          </div>

          <h3 className="text-white font-bold text-base leading-snug mb-3">
            {packageData.name}
          </h3>

          <p className="text-white/70 text-xs leading-relaxed mb-5 flex-1">
            {packageData.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">
                  Total Soal
                </span>
              </div>
              <p className="text-white font-bold text-lg leading-none">
                {packageData.totalSoal}
              </p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">
                  Durasi
                </span>
              </div>
              <p className="text-white font-bold text-lg leading-none">
                {packageData.duration}
                <span className="text-xs text-white/60 font-normal ml-1">
                  mnt
                </span>
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 text-xs text-white/60">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Berlaku hingga{" "}
              <span className="text-white font-semibold">{expiresDate}</span>
            </span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-slate-50 font-bold text-sm py-3 rounded-xl transition-all duration-300 hover:brightness-110 hover:shadow-lg group">
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Kerjakan Sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
