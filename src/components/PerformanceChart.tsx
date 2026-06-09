import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TryoutRecord } from "@/types";
import { TRYOUT_CONFIG } from "@/data/tryoutQuestions";

interface PerformanceChartProps {
  data: TryoutRecord[];
}

interface ChartDataPoint { name: string; TWK: number; TIU: number; TKP: number; }
interface TooltipPayloadEntry { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const { passingScore } = TRYOUT_CONFIG;
const PASSING_GRADES: Record<string, number> = { TWK: passingScore.twk, TIU: passingScore.tiu, TKP: passingScore.tkp };

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const totalScore = payload.reduce((sum, e) => sum + (e.value ?? 0), 0);
  return (
    <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/50 min-w-[180px]">
      <p className="text-indigo-500 dark:text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-3">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => {
          const passing = PASSING_GRADES[entry.name] ?? 0;
          const isPassing = entry.value >= passing;
          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white text-sm font-black">{entry.value}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                  isPassing
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                    : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                }`}>
                  {isPassing ? "PASS" : "FAIL"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 dark:text-slate-600 text-[9px] font-black uppercase tracking-widest">Total</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{totalScore}</span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData: ChartDataPoint[] = data.map((record) => ({
    name: new Date(record.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    TWK: record.twk,
    TIU: record.tiu,
    TKP: record.tkp,
  }));

  return (
    <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Analytics</p>
          <h2 className="text-slate-900 dark:text-white font-black text-lg tracking-tight">Grafik Perkembangan Skor</h2>
          <p className="text-slate-400 dark:text-slate-600 text-[10px] mt-1 font-bold uppercase tracking-widest">Tren Nilai Per Sesi Tryout</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-2 rounded-xl">
          {[
            { label: "TWK", color: "#6366f1" },
            { label: "TIU", color: "#10b981" },
            { label: "TKP", color: "#f59e0b" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-500 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:[stroke:rgba(255,255,255,0.04)]" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={12} />
            <YAxis domain={[0, 250]} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickCount={6} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 2 }} />
            <ReferenceLine y={65} stroke="#6366f1" strokeDasharray="5 4" strokeWidth={1} opacity={0.3} />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 4" strokeWidth={1} opacity={0.3} />
            <ReferenceLine y={166} stroke="#f59e0b" strokeDasharray="5 4" strokeWidth={1} opacity={0.3} />
            <Line type="monotone" dataKey="TWK" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#fff", stroke: "#6366f1", strokeWidth: 2, r: 3 }} activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }} animationDuration={1200} />
            <Line type="monotone" dataKey="TIU" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#fff", stroke: "#10b981", strokeWidth: 2, r: 3 }} activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }} animationDuration={1200} />
            <Line type="monotone" dataKey="TKP" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#fff", stroke: "#f59e0b", strokeWidth: 2, r: 3 }} activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2, fill: "#fff" }} animationDuration={1200} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
