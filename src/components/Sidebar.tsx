import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  X,
  Library,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
  { label: "Paket dan Tryout SKD", icon: BookOpen, href: "#" },
  { label: "Paket Saya", icon: Library, href: "#" },
  { label: "Ranking Nasional", icon: Trophy, href: "#" },
  { label: "Events", icon: Calendar, href: "#" },
  { label: "Pusat Bantuan", icon: HelpCircle, href: "#" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
  onPageChange?: (page: string) => void;
  currentUser?: string;
  isAuthenticated?: boolean;
}

export function Sidebar({ isOpen, onClose, activePage = "Dashboard", onPageChange, currentUser = "Siswa FBK", isAuthenticated = false }: SidebarProps) {
  const [isSiswaAktif, setIsSiswaAktif] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      if (!supabase || !isAuthenticated) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userPkgs } = await supabase
        .from('user_packages')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (userPkgs && userPkgs.length > 0) {
        setIsSiswaAktif(true);
      }
    }
    fetchStatus();
  }, [isAuthenticated]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm leading-tight tracking-wide">
              FBK
            </p>
            <p className="text-slate-500 text-[10px] leading-tight font-medium uppercase tracking-widest">
              Future Bimbel Kedinasan
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Menu Utama
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.label;
          return (
            <button
              key={item.label}
              onClick={() => {
                onPageChange?.(item.label);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group mb-1",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-blue-600"
                )}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group border border-slate-200/50">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 p-[2px]",
            isSiswaAktif ? "bg-blue-600/20" : "bg-slate-200"
          )}>
            <div className={cn(
              "w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold",
              isSiswaAktif ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-md" : "bg-slate-400"
            )}>
              {currentUser?.slice(0, 2).toUpperCase() || "GA"}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 text-xs font-bold truncate">
              {isAuthenticated ? currentUser : "Guest"}
            </p>
            <p className={cn("text-[10px] truncate font-black uppercase tracking-widest mt-0.5", isSiswaAktif ? "text-blue-600" : "text-slate-400")}>
              {isAuthenticated ? (isSiswaAktif ? "Akun Siswa" : "Akun Gratis") : "Belum Login"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:flex-col">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-30 w-72 lg:hidden flex flex-col"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
