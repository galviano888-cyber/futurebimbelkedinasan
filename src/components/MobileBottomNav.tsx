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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-sm border-t border-slate-200/80 dark:border-white/[0.07] flex items-center pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 relative transition-colors duration-150",
              active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
            <item.icon className="w-[18px] h-[18px]" />
            <span className={cn(
              "text-[10px] font-medium leading-none",
              active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 text-slate-400 dark:text-slate-600 transition-colors duration-150"
      >
        <MoreHorizontal className="w-[18px] h-[18px]" />
        <span className="text-[10px] font-medium leading-none">Lainnya</span>
      </button>
    </nav>
  );
}
