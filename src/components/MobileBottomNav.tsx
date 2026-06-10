import { LayoutDashboard, Package, BookOpen, Trophy, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onMoreClick: () => void;
}

const navItems = [
  { id: "Dashboard", label: "Beranda", icon: LayoutDashboard },
  { id: "Paket dan Tryout SKD", label: "Paket", icon: Package },
  { id: "Paket Saya", label: "Paket Saya", icon: BookOpen },
  { id: "Ranking Nasional", label: "Ranking", icon: Trophy },
];

export function MobileBottomNav({ activePage, onPageChange, onMoreClick }: MobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0d0d14] border-t border-slate-200 dark:border-white/5 flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 transition-all",
              active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"
            )}
          >
            <item.icon className={cn("w-5 h-5", active && "scale-110")} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider leading-none",
              active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"
            )}>
              {item.label}
            </span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        );
      })}
      {/* More button — buka sidebar */}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 text-slate-400 dark:text-slate-600 transition-all"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-wider leading-none">Lainnya</span>
      </button>
    </nav>
  );
}
