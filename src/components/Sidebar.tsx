import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
  { label: "Tryout SKD", icon: BookOpen, href: "#" },
  { label: "Materi Belajar", icon: GraduationCap, href: "#" },
  { label: "Jadwal Ujian", icon: Calendar, href: "#" },
  { label: "Pembahasan Soal", icon: MessageSquare, href: "#" },
  { label: "Peringkat", icon: Award, href: "#" },
  { label: "Pengaturan", icon: Settings, href: "#" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
  onPageChange?: (page: string) => void;
  currentUser?: string;
}

export function Sidebar({ isOpen, onClose, activePage = "Dashboard", onPageChange, currentUser = "Siswa FBK" }: SidebarProps) {

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a192f]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
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
        {navItems.slice(0, 6).map((item) => {
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
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
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

        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Sistem
          </p>
          <button
            onClick={() => {
              onPageChange?.("Pengaturan");
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
              activePage === "Pengaturan"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings
              className={cn(
                "flex-shrink-0 transition-colors",
                activePage === "Pengaturan"
                  ? "text-white"
                  : "text-slate-500 group-hover:text-slate-300"
              )}
              size={18}
            />
            Pengaturan
          </button>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{currentUser.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {currentUser}
            </p>
            <p className="text-slate-500 text-[10px] truncate">
              Paket Premium Aktif
            </p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
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
