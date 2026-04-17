import { StatCards } from "@/components/StatCards";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ActivePackage } from "@/components/ActivePackage";
import { HistoryTable } from "@/components/HistoryTable";
import type { TryoutRecord } from "@/types";
import { ChartLine as LineChart } from "lucide-react";

interface DashboardViewProps {
  data: TryoutRecord[];
  userName?: string;
}

export function DashboardView({ data, userName = "Siswa FBK" }: DashboardViewProps) {
  const isEmpty = data.length === 0;

  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Selamat Datang, {userName}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau perkembangan belajarmu dan raih hasil terbaik di ujian kedinasan.
        </p>
      </div>

      <div className="mb-6">
        <StatCards data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {isEmpty ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 flex flex-col items-center justify-center h-96">
              <LineChart className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-500 text-center font-medium">
                Belum ada data grafik. Ayo kerjakan tryout pertamamu!
              </p>
            </div>
          ) : (
            <PerformanceChart data={data} />
          )}
        </div>
        <div>
          <ActivePackage packageData={null} />
        </div>
      </div>

      <HistoryTable data={data} />
    </div>
  );
}
