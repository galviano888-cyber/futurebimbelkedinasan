import { motion } from "framer-motion";
import { Download, FileX, Trophy, FileText, ChevronRight } from "lucide-react";
import type { TryoutRecord } from "@/types";
import { cn } from "@/lib/utils";
import { TRYOUT_CONFIG } from "@/data/tryoutQuestions";

interface HistoryTableProps {
  data: TryoutRecord[];
  onReview?: (record: TryoutRecord) => void;
}

const { twk: TWK_PASSING, tiu: TIU_PASSING, tkp: TKP_PASSING } = TRYOUT_CONFIG.passingScore;

function isLulus(record: TryoutRecord): boolean {
  return (
    record.twk >= TWK_PASSING &&
    record.tiu >= TIU_PASSING &&
    record.tkp >= TKP_PASSING
  );
}

function ScorePill({
  value,
  passing,
  label
}: {
  value: number;
  passing: number;
  label: string;
}) {
  const pass = value >= passing;
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      <span
        className={cn(
          "inline-flex items-center font-black text-xs px-2.5 py-1 rounded-lg border",
          pass
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30"
            : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function handleExport(data: TryoutRecord[]) {
  const headers = ["No", "Tanggal", "Paket", "TWK", "TIU", "TKP", "Total", "Status"];
  const rows = data.map((r, i) => [
    i + 1,
    new Date(r.date).toLocaleDateString("id-ID"),
    r.packageName,
    r.twk,
    r.tiu,
    r.tkp,
    r.total,
    isLulus(r) ? "LULUS" : "TIDAK LULUS",
  ]);
  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "riwayat-tryout-fbk.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function HistoryTable({ data, onReview }: HistoryTableProps) {
  const recent = data.slice(-5).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-slate-50 dark:border-slate-800">
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-base">
            Riwayat Tryout
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            5 sesi tryout terbaru
          </p>
        </div>
        <button
          onClick={() => handleExport(data)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Nilai
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            <FileX className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
            Belum ada data tryout
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            Selesaikan tryout pertamamu untuk melihat riwayat nilai di sini.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Paket Tryout</th>
                  <th className="px-6 py-4 text-center">TWK</th>
                  <th className="px-6 py-4 text-center">TIU</th>
                  <th className="px-6 py-4 text-center">TKP</th>
                  <th className="px-6 py-4 text-center font-bold">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recent.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          isLulus(record) ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        )}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold leading-tight line-clamp-1">
                            {record.packageName}
                          </p>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-wider">
                            {new Date(record.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <ScorePill value={record.twk} passing={TWK_PASSING} label="TWK" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <ScorePill value={record.tiu} passing={TIU_PASSING} label="TIU" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <ScorePill value={record.tkp} passing={TKP_PASSING} label="TKP" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-slate-900 dark:text-white font-black text-sm">
                        {record.total}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {isLulus(record) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-100 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          LULUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-full border border-red-100 dark:border-red-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          TIDAK LULUS
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => onReview?.(record)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 group/btn"
                      >
                        <FileText className="w-3.5 h-3.5 group-hover:rotate-6 transition-transform" />
                        Detail
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((record) => (
              <div 
                key={record.id} 
                className="p-6 space-y-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                onClick={() => onReview?.(record)}
              >
                <div className="flex items-start justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        isLulus(record) ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-red-500 text-white shadow-red-500/20"
                      )}>
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-slate-900 dark:text-white font-black leading-tight text-base sm:text-lg line-clamp-1">{record.packageName}</h4>
                        <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1">{new Date(record.date).toLocaleDateString("id-ID")}</p>
                      </div>
                   </div>
                   <div className={cn(
                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                     isLulus(record) ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                   )}>
                     {isLulus(record) ? "LULUS" : "GAGAL"}
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                   <ScorePill value={record.twk} passing={TWK_PASSING} label="TWK" />
                   <ScorePill value={record.tiu} passing={TIU_PASSING} label="TIU" />
                   <ScorePill value={record.tkp} passing={TKP_PASSING} label="TKP" />
                   <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{record.total}</span>
                   </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview?.(record);
                  }}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-slate-200 dark:shadow-none"
                >
                   <FileText className="w-4 h-4" />
                   LIHAT ANALISIS LENGKAP
                   <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
