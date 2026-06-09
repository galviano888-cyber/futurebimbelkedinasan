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
  return record.twk >= TWK_PASSING && record.tiu >= TIU_PASSING && record.tkp >= TKP_PASSING;
}

function ScorePill({ value, passing, label }: { value: number; passing: number; label: string }) {
  const pass = value >= passing;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{label}</span>
      <span className={cn(
        "inline-flex items-center font-black text-xs px-2.5 py-1 rounded-lg border",
        pass
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
          : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
      )}>
        {value}
      </span>
    </div>
  );
}

function handleExport(data: TryoutRecord[]) {
  const headers = ["No", "Tanggal", "Paket", "TWK", "TIU", "TKP", "Total", "Status"];
  const rows = data.map((r, i) => [i + 1, new Date(r.date).toLocaleDateString("id-ID"), r.packageName, r.twk, r.tiu, r.tkp, r.total, isLulus(r) ? "LULUS" : "TIDAK LULUS"]);
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
    <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-slate-100 dark:border-white/5">
        <div>
          <h2 className="text-slate-900 dark:text-white font-black text-base tracking-tight">Riwayat Tryout</h2>
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">5 sesi tryout terbaru</p>
        </div>
        <button
          onClick={() => handleExport(data)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-4">
            <FileX className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-slate-500 dark:text-slate-500 text-sm font-bold">Belum ada data tryout</p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Selesaikan tryout pertamamu untuk melihat riwayat nilai di sini.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Paket Tryout</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">TWK</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">TIU</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">TKP</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                {recent.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                          isLulus(record)
                            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400"
                            : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500 dark:text-red-400"
                        )}>
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold text-sm leading-tight line-clamp-1">{record.packageName}</p>
                          <p className="text-slate-400 dark:text-slate-600 text-[10px] mt-0.5 font-bold uppercase tracking-wider">
                            {new Date(record.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center"><ScorePill value={record.twk} passing={TWK_PASSING} label="TWK" /></td>
                    <td className="px-6 py-4 text-center"><ScorePill value={record.tiu} passing={TIU_PASSING} label="TIU" /></td>
                    <td className="px-6 py-4 text-center"><ScorePill value={record.tkp} passing={TKP_PASSING} label="TKP" /></td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-900 dark:text-white font-black text-sm">{record.total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLulus(record) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LULUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-lg border border-red-100 dark:border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> TIDAK LULUS
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onReview?.(record)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-xs font-black transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.03]">
            {recent.map((record) => (
              <div key={record.id} className="p-5 space-y-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors" onClick={() => onReview?.(record)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      isLulus(record)
                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400"
                        : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500 dark:text-red-400"
                    )}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-black text-sm leading-tight line-clamp-1">{record.packageName}</h4>
                      <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">{new Date(record.date).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0",
                    isLulus(record)
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                      : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                  )}>
                    {isLulus(record) ? "LULUS" : "GAGAL"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-4 rounded-xl">
                  <ScorePill value={record.twk} passing={TWK_PASSING} label="TWK" />
                  <ScorePill value={record.tiu} passing={TIU_PASSING} label="TIU" />
                  <ScorePill value={record.tkp} passing={TKP_PASSING} label="TKP" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">TOTAL</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{record.total}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onReview?.(record); }}
                  className="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4" /> Lihat Analisis Lengkap <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
