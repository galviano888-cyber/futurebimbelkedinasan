import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
  currentUser?: string;
  onLogout?: () => void;
}

export function Header({ onMenuToggle, currentUser = "Siswa FBK", onLogout }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const date = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDate(date);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 gap-4 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <h1 className="text-slate-900 font-semibold text-base leading-tight hidden sm:block">
            Dashboard Siswa
          </h1>
          {currentDate ? (
            <p className="text-slate-500 text-xs font-medium leading-tight">
              {currentDate}
            </p>
          ) : (
            <div className="h-3.5 w-32 bg-slate-200 rounded animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setHasNotification(false)}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-2 ring-amber-100">
              <span className="text-white text-xs font-bold">AR</span>
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-slate-900 text-xs font-semibold leading-tight">
                {currentUser}
              </span>
              <span className="text-slate-500 text-[10px] leading-tight truncate max-w-[100px]">
                Siswa Premium
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden z-50"
              >
                <div className="p-1">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    onClick={() => {
                      setDropdownOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    Profil Saya
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    onClick={() => {
                      setDropdownOpen(false);
                    }}
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    Pengaturan
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
