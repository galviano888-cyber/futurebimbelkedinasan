import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  Trophy, 
  Calendar, 
  HelpCircle,
  Zap,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Menu" },
  { id: "Paket dan Tryout SKD", label: "Paket & Tryout", icon: Package, group: "Menu" },
  { id: "Paket Saya", label: "Paket Saya", icon: BookOpen, group: "Menu" },
  { id: "Ranking Nasional", label: "Ranking Nasional", icon: Trophy, group: "Menu" },
  { id: "Events", label: "Events", icon: Calendar, group: "Lainnya" },
  { id: "Pusat Bantuan", label: "Pusat Bantuan", icon: HelpCircle, group: "Lainnya" },
];

const groups = ["Menu", "Lainnya"];

export function Sidebar({ isOpen, onClose, activePage = "Dashboard", onPageChange }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 shrink-0 flex flex-col h-full z-50 transition-transform duration-300 ease-in-out",
        "bg-white dark:bg-[#0d0d14] border-r border-slate-200 dark:border-white/5",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">FBK</p>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold mt-0.5 tracking-widest uppercase">Bimbel Kedinasan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-11 h-11 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <p className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] mb-2">{group}</p>
              <div className="space-y-0.5">
                {menuItems.filter(i => i.group === group).map((item) => {
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onPageChange(item.id); onClose(); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group border",
                        active
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
                          : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border-transparent"
                      )}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                      )} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live indicator */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sistem Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
