import { useState, useEffect } from "react";
import { 
  Bell, 
  LogOut, 
  User, 
  ChevronRight,
  CreditCard,
  Settings,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

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
    <header className="h-16 shrink-0 flex items-center px-6 justify-between sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)] bg-white dark:bg-[#0d0d14] border-b border-slate-200 dark:border-white/5">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:block">
          <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {activePage || 'Dashboard'}
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest mt-0.5">
            Future Bimbel Kedinasan
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Live badge */}
        <div className="hidden sm:flex h-7 px-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 flex items-center justify-center text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0d0d14] animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed top-16 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-2 md:w-96 bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Notifikasi</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors"
                >
                  Tandai Semua Dibaca
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={cn(
                      "p-4 border-b border-slate-50 dark:border-white/[0.03] last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]",
                      !n.is_read && "bg-indigo-50/50 dark:bg-indigo-500/5"
                    )}>
                      <div className="flex items-start gap-3">
                        {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" />}
                        <div className={!n.is_read ? "" : "ml-4"}>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-0.5">{n.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-700 mt-1.5 font-bold">
                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-bold">Tidak ada notifikasi baru</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-2.5 px-2.5 py-2.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
                {currentUser?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                  {currentUser || "Siswa FBK"}
                </p>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">
                  {isSiswaAktif ? "Siswa Aktif" : "Siswa Gratis"}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="fixed top-16 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-2 md:w-64 bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-base">
                      {currentUser?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[140px]">{currentUser || "Siswa FBK"}</h4>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mt-1 inline-block",
                        isSiswaAktif
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-slate-100 dark:bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-500/20"
                      )}>
                        {isSiswaAktif ? "Siswa Aktif" : "Siswa Gratis"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {[
                    { label: "Edit Profil", icon: User, page: "Profil Saya" },
                    { label: "Riwayat Transaksi", icon: CreditCard, page: "Riwayat Transaksi" },
                    { label: "Pengaturan", icon: Settings, page: "Pengaturan" },
                  ].map((item) => (
                    <button
                      key={item.page}
                      onClick={() => { onNavigate?.(item.page); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                    </button>
                  ))}
                  <div className="my-1.5 border-t border-slate-100 dark:border-white/5" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-bold">Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLoginOpen?.(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}
