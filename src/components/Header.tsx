import { useState, useEffect } from "react";
import {
  Bell,
  LogOut,
  User,
  CreditCard,
  Settings,
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  onNavigate?: (page: string) => void;
  isAuthenticated?: boolean;
  profile?: any;
  currentUser?: string | null;
  setIsLoginOpen?: (open: boolean) => void;
  isLoginOpen?: boolean;
  activePage?: string;
  onMenuToggle?: () => void;
}

export function Header({
  onNavigate,
  isAuthenticated = false,
  currentUser,
  setIsLoginOpen,
  activePage,
  onMenuToggle
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSiswaAktif, setIsSiswaAktif] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  useEffect(() => {
    async function checkStatus() {
      if (!supabase || !isAuthenticated) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_packages').select('id').eq('user_id', user.id).limit(1);
      if (data && data.length > 0) setIsSiswaAktif(true);
    }
    checkStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const subscription = supabase
        ?.channel('public:notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchNotifications)
        .subscribe();
      return () => {
        if (subscription) supabase?.removeChannel(subscription);
      };
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const markAllAsRead = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    fetchNotifications();
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-14 shrink-0 flex items-center px-5 justify-between sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] bg-blue-950 dark:bg-[#1a1f2e] backdrop-blur-sm border-b border-blue-900/50 dark:border-white/[0.07]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-blue-200 hover:text-white hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="hidden lg:block">
          <h1 className="text-[14px] font-semibold text-white">
            {activePage || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 dark:hover:bg-white/[0.05] transition-colors overflow-hidden"
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 transition-all duration-300 dark:opacity-0 dark:scale-0 dark:rotate-90" />
          <Moon className="w-4 h-4 absolute transition-all duration-300 opacity-0 scale-0 -rotate-90 dark:opacity-100 dark:scale-100 dark:rotate-0" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 dark:hover:bg-white/[0.05] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div             className="fixed top-14 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-2 md:w-80 bg-white dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl shadow-xl shadow-black/8 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white">Notifikasi</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-[12px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Tandai dibaca
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={cn(
                      "px-4 py-3 border-b border-slate-50 dark:border-white/[0.03] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors",
                      !n.is_read && "bg-blue-50/40 dark:bg-blue-500/[0.04]"
                    )}>
                      <div className="flex items-start gap-2.5">
                        {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                        <div className={!n.is_read ? "" : "ml-4"}>
                          <p className="text-[13px] font-medium text-slate-800 dark:text-white">{n.title}</p>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1.5">
                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <Bell className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400 dark:text-slate-600">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
          <div className="w-px h-5 bg-white/20 dark:bg-white/[0.07] mx-1" />

        {/* Profile */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-500/80 flex items-center justify-center text-white font-semibold text-[12px]">
                {currentUser?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-medium text-white leading-none">
                  {currentUser?.split(' ')[0] || "Siswa"}
                </p>
                <p className="text-[10px] text-blue-300 mt-px">
                  {isSiswaAktif ? "Siswa Aktif" : "Gratis"}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div             className="fixed top-14 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-2 md:w-56 bg-white dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-white/[0.08] rounded-xl shadow-xl shadow-black/8 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500/80 flex items-center justify-center text-white font-semibold text-[13px]">
                      {currentUser?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                        {currentUser || "Siswa FBK"}
                      </p>
                      <span className={cn(
                        "text-[11px] mt-px inline-block",
                        isSiswaAktif
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500"
                      )}>
                        {isSiswaAktif ? "Siswa Aktif" : "Gratis"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-1.5">
                  {[
                    { label: "Edit Profil", icon: User, page: "Profil Saya" },
                    { label: "Riwayat Transaksi", icon: CreditCard, page: "Riwayat Transaksi" },
                    { label: "Pengaturan", icon: Settings, page: "Pengaturan" },
                  ].map((item) => (
                    <button
                      key={item.page}
                      onClick={() => { onNavigate?.(item.page); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-blue-100 dark:border-blue-900/40" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLoginOpen?.(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] rounded-lg transition-colors shadow-sm shadow-blue-600/25"
          >
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}
