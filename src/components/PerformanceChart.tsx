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

const LINES = [
  { key: "TWK", color: "#3b82f6" },
  { key: "TIU", color: "#10b981" },
  { key: "TKP", color: "#f59e0b" },
];

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const totalScore = payload.reduce((sum, e) => sum + (e.value ?? 0), 0);
  return (
    <div className="bg-white dark:bg-[#1c1c1c] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-4 shadow-xl shadow-black/8 dark:shadow-black/40 min-w-[170px]">
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => {
          const passing = PASSING_GRADES[entry.name] ?? 0;
          const isPassing = entry.value >= passing;
          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[12px] text-slate-500 dark:text-slate-400">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-800 dark:text-white">{entry.value}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  isPassing
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                }`}>
                  {isPassing ? "Pass" : "Fail"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Total</span>
          <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">{totalScore}</span>
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
    <div className="bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Grafik Perkembangan Skor</h2>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Tren nilai per sesi tryout</p>
        </div>
        <div className="flex items-center gap-4">
          {LINES.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{item.key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" className="dark:[stroke:rgba(255,255,255,0.04)]" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis domain={[0, 250]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickCount={6} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 1.5 }} />
            <ReferenceLine y={65} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1} opacity={0.25} />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1} opacity={0.25} />
            <ReferenceLine y={166} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1} opacity={0.25} />
            {LINES.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: "#fff", stroke: color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: "#fff" }}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
