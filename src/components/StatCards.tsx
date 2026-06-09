import { Award, ClipboardList, TrendingUp } from "lucide-react";
import type { TryoutRecord } from "@/types";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  data: TryoutRecord[];
}

interface StatCardItem {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCards({ data }: StatCardsProps) {
  const uniquePackages = new Set(data.map(item => item.packageName));
  const totalTryout = uniquePackages.size;
  const averageScore = data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.total, 0) / data.length) : 0;
  const bestScore = data.length > 0 ? Math.max(...data.map((r) => r.total)) : 0;

  const cards: StatCardItem[] = [
    {
      title: "Total Tryout",
      value: `${totalTryout}`,
      subtitle: "Sesi ujian selesai",
      icon: ClipboardList,
      accent: "indigo",
      iconBg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      trend: "+2 bulan ini",
      trendUp: true,
    },
    {
      title: "Rata-rata Skor SKD",
      value: averageScore.toLocaleString("id-ID"),
      subtitle: "Dari semua tryout",
      icon: TrendingUp,
      accent: "blue",
      iconBg: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: averageScore >= 300 ? "Di atas target" : "Perlu peningkatan",
      trendUp: averageScore >= 300,
    },
    {
      title: "Skor Terbaik",
      value: bestScore.toLocaleString("id-ID"),
      subtitle: "Nilai tertinggi dicapai",
      icon: Award,
      accent: "emerald",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trend: bestScore >= 350 ? "Luar biasa!" : "Terus tingkatkan",
      trendUp: bestScore >= 350,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-6 group hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                card.iconBg
              )}>
                <Icon className={cn("w-5 h-5", card.iconColor)} />
              </div>
              {card.trend && (
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                  card.trendUp
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                )}>
                  {card.trend}
                </span>
              )}
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">
                {card.title}
              </p>
              <p className="text-slate-900 dark:text-white text-3xl font-black tracking-tighter leading-none mb-1.5">
                {card.value}
              </p>
              <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
