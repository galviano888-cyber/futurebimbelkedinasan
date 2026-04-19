import { motion } from "framer-motion";
import { Download, FileX, Trophy, FileText } from "lucide-react";
import type { TryoutRecord } from "@/types";
import { cn } from "@/lib/utils";

interface HistoryTableProps {
  data: TryoutRecord[];
  onReview?: (record: TryoutRecord) => void;
}

const TWK_PASSING = 65;
const TIU_PASSING = 80;
const TKP_PASSING = 166;

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
}: {
  value: number;
  passing: number;
}) {
  const pass = value >= passing;
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold text-xs px-2 py-0.5 rounded-md",
        pass
          ? "bg-blue-50 text-blue-700"
          : "bg-red-50 text-red-600"
      )}
    >
      {value}
    </span>
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
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-slate-900 font-bold text-base">
            Riwayat Tryout
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            5 sesi tryout terbaru
          </p>
        </div>
        <button
          onClick={() => handleExport(data)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 hover:brightness-110 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Nilai
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileX className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">
            Belum Ada Riwayat Tryout
          </p>
          <p className="text-slate-400 text-xs max-w-[260px]">
            Belum ada riwayat tryout. Ayo mulai ujian pertamamu!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["No", "Tanggal", "Paket Tryout", "TWK", "TIU", "TKP", "Total", "Status"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest first:pl-6 last:pr-6"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {recent.map((record, index) => {
                const lulus = isLulus(record);
                return (
                  <tr
                    key={record.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-4 pl-6 text-slate-400 text-xs font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-slate-700 text-xs font-medium max-w-[200px] truncate">
                          {record.packageName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ScorePill value={record.twk} passing={TWK_PASSING} />
                    </td>
                    <td className="px-4 py-4">
                      <ScorePill value={record.tiu} passing={TIU_PASSING} />
                    </td>
                    <td className="px-4 py-4">
                      <ScorePill value={record.tkp} passing={TKP_PASSING} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-900 text-sm font-bold">
                        {record.total.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="px-4 py-4 pr-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0",
                            lulus
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-red-100 text-red-600 border border-red-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              lulus ? "bg-emerald-500" : "bg-red-500"
                            )}
                          />
                          {lulus ? "LULUS" : "TIDAK LULUS"}
                        </span>
                        
                        <button
                          onClick={() => onReview?.(record)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Pembahasan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-slate-400 text-xs">
          Menampilkan {recent.length} dari {data.length} riwayat
        </p>
        <p className="text-xs text-slate-400 font-medium">
          Batas Lulus: TWK ≥65 | TIU ≥80 | TKP ≥166
        </p>
      </div>
    </motion.div>
  );
}
