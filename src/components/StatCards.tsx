import { motion } from "framer-motion";
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
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCards({ data }: StatCardsProps) {
  // Hanya hitung paket unik yang sudah dikerjakan
  const uniquePackages = new Set(data.map(item => item.packageName));
  const totalTryout = uniquePackages.size;

  const averageScore =
    data.length > 0
      ? Math.round(data.reduce((sum, r) => sum + r.total, 0) / data.length)
      : 0;

  const bestScore =
    data.length > 0 ? Math.max(...data.map((r) => r.total)) : 0;

  const cards: StatCardItem[] = [
    {
      title: "Total Tryout Dikerjakan",
      value: `${totalTryout}`,
      subtitle: "Sesi ujian selesai",
      icon: ClipboardList,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "+2 bulan ini",
      trendUp: true,
    },
    {
      title: "Rata-rata Skor SKD",
      value: averageScore.toLocaleString("id-ID"),
      subtitle: "Dari semua tryout",
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend:
        averageScore >= 300 ? "Di atas target" : "Perlu peningkatan",
      trendUp: averageScore >= 300,
    },
    {
      title: "Skor Terbaik",
      value: bestScore.toLocaleString("id-ID"),
      subtitle: "Nilai tertinggi dicapai",
      icon: Award,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: bestScore >= 350 ? "Luar biasa!" : "Terus tingkatkan",
      trendUp: bestScore >= 350,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
            className={cn(
              "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-7 shadow-sm relative overflow-hidden group",
              "hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-default"
            )}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-500" />
            
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  {card.title}
                </p>
                <p className="text-slate-900 dark:text-white text-4xl font-black tracking-tighter leading-none mb-1">
                  {card.value}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">{card.subtitle}</p>
              </div>
              <div
                className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-500",
                  card.iconBg === "bg-blue-50" ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200" : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-200"
                )}
              >
                <Icon className="w-7 h-7" />
              </div>
            </div>

            {card.trend && (
              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    card.trendUp
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {card.trend}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
