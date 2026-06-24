import { Award, ClipboardList, TrendingUp } from "lucide-react";
import type { TryoutRecord } from "@/types";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  data: TryoutRecord[];
}

export function StatCards({ data }: StatCardsProps) {
  const uniquePackages = new Set(data.map(item => item.packageName));
  const totalTryout = uniquePackages.size;
  const averageScore = data.length > 0
    ? Math.round(data.reduce((sum, r) => sum + r.total, 0) / data.length)
    : 0;
  const bestScore = data.length > 0 ? Math.max(...data.map((r) => r.total)) : 0;

  const cards = [
    {
      title: "Total Tryout",
      value: totalTryout,
      desc: "Sesi ujian selesai",
      icon: ClipboardList,
      iconClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
      badge: "Aktif belajar",
      badgeClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Rata-rata Skor",
      value: averageScore.toLocaleString("id-ID"),
      desc: "Dari semua tryout",
      icon: TrendingUp,
      iconClass: "bg-violet-50 dark:bg-violet-500/10 text-violet-500 dark:text-violet-400",
      badge: averageScore >= 300 ? "Di atas target" : "Perlu peningkatan",
      badgeClass: averageScore >= 300
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Skor Terbaik",
      value: bestScore.toLocaleString("id-ID"),
      desc: "Nilai tertinggi",
      icon: Award,
      iconClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badge: bestScore >= 350 ? "Luar biasa" : "Terus tingkatkan",
      badgeClass: bestScore >= 350
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:shadow-sm hover:border-slate-300 dark:hover:border-white/12 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", card.iconClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-lg",
                card.badgeClass
              )}>
                {card.badge}
              </span>
            </div>

            <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-1.5">{card.title}</p>
            <p className="text-slate-900 dark:text-white text-[26px] font-bold tracking-tight leading-none mb-1">
              {card.value}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[11px]">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
