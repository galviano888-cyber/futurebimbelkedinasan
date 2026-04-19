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
    <div className="flex flex-col h-full bg-[#0a192f]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">
              FBK
            </p>
            <p className="text-slate-400 text-[10px] leading-tight font-medium uppercase tracking-widest">
              Future Bimbel Kedinasan
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                )}
                size={18}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 p-[2px]",
            isSiswaAktif ? "bg-blue-500/20" : "bg-white/5"
          )}>
            <div className={cn(
              "w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold",
              isSiswaAktif ? "bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-slate-700"
            )}>
              {currentUser?.slice(0, 2).toUpperCase() || "GA"}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
              {isAuthenticated ? currentUser : "Guest"}
            </p>
            <p className={cn("text-[10px] truncate font-black uppercase tracking-widest mt-0.5", isSiswaAktif ? "text-blue-400" : "text-slate-500")}>
              {isAuthenticated ? (isSiswaAktif ? "Akun Siswa" : "Akun Gratis") : "Belum Login"}
            </p>
          </div>
          <div className={cn(
            "ml-auto w-2 h-2 rounded-full flex-shrink-0",
            isAuthenticated ? (isSiswaAktif ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]" : "bg-emerald-400") : 'bg-slate-500'
          )} />
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
