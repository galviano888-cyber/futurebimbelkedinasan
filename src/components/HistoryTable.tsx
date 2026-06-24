import { Download, FileX, Trophy, FileText } from "lucide-react";
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

function ScoreCell({ value, passing }: { value: number; passing: number }) {
  const pass = value >= passing;
  return (
    <span className={cn(
      "inline-flex items-center font-medium text-[12px] px-2.5 py-1 rounded-lg",
      pass
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
    )}>
      {value}
    </span>
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
    <div className="bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.05]">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Riwayat Tryout</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[12px] mt-0.5">5 sesi tryout terbaru</p>
        </div>
        <button
          onClick={() => handleExport(data)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[12px] font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <FileX className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Belum ada data tryout</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-600 mt-1">Selesaikan tryout pertamamu untuk melihat riwayat nilai di sini.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                  {["Paket Tryout", "TWK", "TIU", "TKP", "Total", "Status", ""].map((h, i) => (
                    <th key={i} className={cn(
                      "px-5 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500",
                      i === 0 ? "text-left" : i === 6 ? "text-right" : "text-center"
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                {recent.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isLulus(record)
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                        )}>
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-900 dark:text-white line-clamp-1">{record.packageName}</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                            {new Date(record.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center"><ScoreCell value={record.twk} passing={TWK_PASSING} /></td>
                    <td className="px-5 py-3.5 text-center"><ScoreCell value={record.tiu} passing={TIU_PASSING} /></td>
                    <td className="px-5 py-3.5 text-center"><ScoreCell value={record.tkp} passing={TKP_PASSING} /></td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{record.total}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium",
                        isLulus(record)
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isLulus(record) ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        {isLulus(record) ? "Lulus" : "Tidak Lulus"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onReview?.(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
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
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
            {recent.map((record) => (
              <div
                key={record.id}
                className="p-5 space-y-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => onReview?.(record)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      isLulus(record)
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                    )}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                    <p className="text-[13px] font-medium text-slate-900 dark:text-white line-clamp-1">{record.packageName}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(record.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0",
                    isLulus(record)
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                  )}>
                    {isLulus(record) ? "Lulus" : "Gagal"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl">
                  {[
                    { label: "TWK", value: record.twk, passing: TWK_PASSING },
                    { label: "TIU", value: record.tiu, passing: TIU_PASSING },
                    { label: "TKP", value: record.tkp, passing: TKP_PASSING },
                    { label: "Total", value: record.total, passing: 0 },
                  ].map(({ label, value, passing }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{label}</span>
                      <span className={cn(
                        "text-[12px] font-semibold",
                        label === "Total"
                          ? "text-slate-800 dark:text-white"
                          : value >= passing
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                      )}>{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onReview?.(record); }}
                  className="w-full py-2.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Lihat Analisis Lengkap
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
