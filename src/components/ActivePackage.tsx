import { motion } from "framer-motion";
import { ArrowRight, BookMarked, Clock, FileText, Zap } from "lucide-react";
import type { ActivePackageData } from "@/types";

interface ActivePackageProps {
  packageData: ActivePackageData | null;
}

export function ActivePackage({ packageData }: ActivePackageProps) {
  if (!packageData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        className="h-full"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <BookMarked className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            Belum Ada Paket Aktif
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Tingkatkan peluang lulusmu dengan mengikuti program intensif kami.
          </p>
          <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-500 border border-slate-700 hover:border-blue-500/50 font-bold text-sm py-3 rounded-xl transition-all duration-300">
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
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 shadow-xl shadow-slate-900/20 h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <BookMarked className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                  Paket Aktif
                </p>
                <p className="text-blue-400 text-xs font-bold">
                  {packageData.category}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AKTIF
            </span>
          </div>

          <h3 className="text-white font-bold text-base leading-snug mb-3">
            {packageData.name}
          </h3>

          <p className="text-slate-400 text-xs leading-relaxed mb-5 flex-1">
            {packageData.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">
                  Total Soal
                </span>
              </div>
              <p className="text-white font-bold text-lg leading-none">
                {packageData.totalSoal}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">
                  Durasi
                </span>
              </div>
              <p className="text-white font-bold text-lg leading-none">
                {packageData.duration}
                <span className="text-xs text-slate-400 font-normal ml-1">
                  mnt
                </span>
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Berlaku hingga{" "}
              <span className="text-blue-400 font-semibold">{expiresDate}</span>
            </span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm py-3 rounded-xl transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 group">
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Kerjakan Sekarang
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
