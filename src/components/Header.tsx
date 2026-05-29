import { useState, useEffect } from "react";
import { 
  Search, 
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

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    
    fetchNotifications();
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="min-h-20 lg:min-h-24 flex items-center justify-between px-4 lg:px-8 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center gap-3 lg:gap-6 flex-1">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative group max-w-md w-full hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari materi, tryout, atau event..." 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm relative group"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute top-2.5 right-2.5 lg:top-3 lg:right-3 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed top-20 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-4 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white">Notifikasi</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                >
                  Tandai Semua Dibaca
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={cn(
                      "p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0",
                      !n.is_read && "bg-blue-50/30 dark:bg-blue-500/5"
                    )}>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{n.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Tidak ada notifikasi baru</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 lg:gap-4 p-1.5 lg:pl-2 lg:pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl hover:border-blue-500 transition-all duration-300 group"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs lg:text-sm overflow-hidden">
                {currentUser?.charAt(0) || "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">
                  {currentUser || "Siswa FBK"}
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  {isSiswaAktif ? "AKUN SISWA" : "SISWA GRATIS"}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="fixed top-20 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 mt-4 md:w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg overflow-hidden">
                      {currentUser?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px]">
                        {currentUser || "Siswa FBK"}
                      </h4>
                      <p className="text-[10px] font-black text-slate-500 tracking-widest mt-0.5">
                        {isSiswaAktif ? "SISWA AKTIF" : "SISWA GRATIS"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <button onClick={() => onNavigate?.("Profil Saya")} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors group">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 group-hover:text-blue-600" />
                      <span className="text-xs font-black uppercase tracking-widest">Edit Profil</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                  <button onClick={() => onNavigate?.("Riwayat Transaksi")} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors group">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 group-hover:text-blue-600" />
                      <span className="text-xs font-black uppercase tracking-widest">Riwayat Transaksi</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                  <button onClick={() => onNavigate?.("Pengaturan")} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 group-hover:text-blue-600" />
                      <span className="text-xs font-black uppercase tracking-widest">Pengaturan</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                  <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors group"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setIsLoginOpen?.(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Masuk Sekarang
          </button>
        )}
      </div>
    </header>
  );
}
