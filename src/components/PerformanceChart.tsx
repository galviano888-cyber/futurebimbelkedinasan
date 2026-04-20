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

const PASSING_GRADES: Record<string, number> = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const totalScore = payload.reduce(
    (sum: number, e: TooltipPayloadEntry) => sum + (e.value ?? 0),
    0
  );

  return (
    <div className="bg-white rounded-xl p-4 shadow-xl border border-slate-100 min-w-[170px]">
      <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry: TooltipPayloadEntry) => {
          const passing = PASSING_GRADES[entry.name] ?? 0;
          const isPassing = entry.value >= passing;
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-400 text-xs font-medium">
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 text-sm font-bold">
                  {entry.value}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isPassing
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isPassing ? "✓" : "✗"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-slate-500 text-[10px]">
          Total:{" "}
          <span className="text-slate-900 font-bold">{totalScore}</span>
        </p>
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
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-slate-900 font-bold text-base">
            Grafik Perkembangan Skor
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Tren nilai TWK, TIU &amp; TKP per sesi tryout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "TWK", color: "#3b82f6" },
            { label: "TIU", color: "#10b981" },
            { label: "TKP", color: "#f59e0b" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-5 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-500 text-xs font-medium">
                {item.label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">- - Batas Lulus</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
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
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            domain={[0, 250]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
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
            strokeWidth={1.5}
            label={{
              value: "TWK 65",
              position: "insideTopLeft",
              fill: "#3b82f6",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <ReferenceLine
            y={80}
            stroke="#10b981"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: "TIU 80",
              position: "insideTopLeft",
              fill: "#10b981",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <ReferenceLine
            y={166}
            stroke="#f59e0b"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: "TKP 166",
              position: "insideTopLeft",
              fill: "#f59e0b",
              fontSize: 10,
              fontWeight: 600,
            }}
          />

          <Line
            type="monotone"
            dataKey="TWK"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4, stroke: "#fff" }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="TIU"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#fff" }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="TKP"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4, stroke: "#fff" }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
