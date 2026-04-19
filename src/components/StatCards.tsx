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
              "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm",
              "hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className="text-slate-900 text-3xl font-bold tracking-tight leading-none mb-1">
                  {card.value}
                </p>
                <p className="text-slate-400 text-xs">{card.subtitle}</p>
              </div>
              <div
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  card.iconBg
                )}
              >
                <Icon className={cn("w-6 h-6", card.iconColor)} />
              </div>
            </div>

            {card.trend && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                    card.trendUp
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
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
