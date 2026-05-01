import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  Trophy, 
  Calendar, 
  HelpCircle,
  Zap,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Paket dan Tryout SKD", label: "Paket dan Tryout SKD", icon: Package },
  { id: "Paket Saya", label: "Paket Saya", icon: BookOpen },
  { id: "Ranking Nasional", label: "Ranking Nasional", icon: Trophy },
  { id: "Events", label: "Events", icon: Calendar },
];

const bottomItems = [
  { id: "Pusat Bantuan", label: "Pusat Bantuan", icon: HelpCircle },
];

export function Sidebar({ isOpen, onClose, activePage = "Dashboard", onPageChange }: SidebarProps) {

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 z-50 transition-all duration-500 ease-in-out transform flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl tracking-tighter leading-none">FBK</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Future Bimbel Kedinasan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div>
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Menu Utama</p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    activePage === item.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3.5 relative z-10">
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      activePage === item.id ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="text-sm font-black tracking-tight">{item.label}</span>
                  </div>
                  {activePage === item.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="space-y-1">
              {bottomItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                    activePage === item.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-black tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
