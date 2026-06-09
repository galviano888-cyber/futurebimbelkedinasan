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

interface ChartDataPoint {
  name: string;
  TWK: number;
  TIU: number;
  TKP: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const { passingScore } = TRYOUT_CONFIG;
const PASSING_GRADES: Record<string, number> = {
  TWK: passingScore.twk,
  TIU: passingScore.tiu,
  TKP: passingScore.tkp,
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const totalScore = payload.reduce(
    (sum: number, e: TooltipPayloadEntry) => sum + (e.value ?? 0),
    0
  );

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white min-w-[200px]">
      <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
        {label}
      </p>
      <div className="space-y-3">
        {payload.map((entry: TooltipPayloadEntry) => {
          const passing = PASSING_GRADES[entry.name] ?? 0;
          const isPassing = entry.value >= passing;
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 text-sm font-black">
                  {entry.value}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    isPassing
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {isPassing ? "PASSED" : "FAILED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
           <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Skor</span>
           <span className="text-blue-600 font-black text-sm">{totalScore}</span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData: ChartDataPoint[] = data.map((record) => ({
    name: new Date(record.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    TWK: record.twk,
    TIU: record.tiu,
    TKP: record.tkp,
  }));

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
          <div>
            <h2 className="text-slate-900 font-black text-xl tracking-tight">
              Grafik Perkembangan Skor
            </h2>
            <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">
              Tren Nilai Per Sesi Tryout
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
            {[
              { label: "TWK", color: "#3b82f6" },
              { label: "TIU", color: "#10b981" },
              { label: "TKP", color: "#f59e0b" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-2">
                <span
                  className="w-3 h-3 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                dy={12}
              />
              <YAxis
                domain={[0, 250]}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickCount={6}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#f1f5f9", strokeWidth: 2 }}
              />

              <ReferenceLine
                y={65}
                stroke="#3b82f6"
                strokeDasharray="5 4"
                strokeWidth={1}
                opacity={0.3}
              />
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="5 4"
                strokeWidth={1}
                opacity={0.3}
              />
              <ReferenceLine
                y={166}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                strokeWidth={1}
                opacity={0.3}
              />

              <Line
                type="monotone"
                dataKey="TWK"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ fill: "#fff", stroke: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, stroke: "#fff", strokeWidth: 3, fill: "#3b82f6" }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="TIU"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ fill: "#fff", stroke: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, stroke: "#fff", strokeWidth: 3, fill: "#10b981" }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="TKP"
                stroke="#f59e0b"
                strokeWidth={4}
                dot={{ fill: "#fff", stroke: "#f59e0b", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, stroke: "#fff", strokeWidth: 3, fill: "#f59e0b" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
