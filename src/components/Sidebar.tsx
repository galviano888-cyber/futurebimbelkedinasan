import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  Trophy, 
  Calendar, 
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function Sidebar({ isOpen, onClose, activePage = "Dashboard", onPageChange, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 shrink-0 flex flex-col h-full z-50 transition-all duration-300 ease-in-out",
        "bg-blue-950 dark:bg-[#1a1f2e] border-r border-blue-900/50 dark:border-white/[0.07]",
        collapsed ? "w-[68px]" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className={cn(
          "px-3 py-5 border-b border-blue-900/50 dark:border-white/[0.06] flex items-center justify-between",
          collapsed && "px-0 justify-center"
        )}>
          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center w-full")}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-[12px] tracking-tight shrink-0 shadow-sm shadow-blue-600/25">
              FBK
            </div>
            {!collapsed && (
              <div>
                <p className="text-[13px] font-semibold text-white leading-none">Future Bimbel</p>
                <p className="text-[11px] text-blue-300 mt-1 font-medium">Kedinasan</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-blue-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 custom-scrollbar">
          {groups.map(group => (
            <div key={group}>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-blue-400/60 dark:text-slate-600 mb-1.5">{group}</p>
              )}
              {collapsed && <div className="mb-1.5 border-t border-white/10" />}
              <div className="space-y-1">
                {menuItems.filter(i => i.group === group).map((item) => {
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onPageChange(item.id); onClose(); }}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative w-full flex items-center rounded-xl text-[13px] font-medium transition-all duration-150",
                        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                        active
                          ? "bg-white/15 text-white dark:bg-blue-500/20 dark:text-blue-300"
                          : "text-blue-200/70 dark:text-slate-400 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/[0.06]"
                      )}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white dark:bg-blue-400" />
                      )}
                      {active && collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-0.5 rounded-r-full bg-white dark:bg-blue-400" />
                      )}
                      <item.icon className={cn(
                        "shrink-0 transition-colors",
                        collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
                        active
                          ? "text-white dark:text-blue-400"
                          : "text-blue-300/60 dark:text-slate-500 group-hover:text-white dark:group-hover:text-slate-300"
                      )} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle Button (desktop only) */}
        <div className="hidden lg:flex px-2 pb-4 justify-center">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-blue-300/60 hover:text-white hover:bg-white/10 transition-all text-[12px] font-medium"
            title={collapsed ? "Perlebar sidebar" : "Lipat sidebar"}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span>Lipat</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
