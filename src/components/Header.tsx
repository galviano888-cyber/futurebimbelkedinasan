import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  CreditCard,
  GraduationCap,
  LogOut,
  Menu,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabaseClient";

interface HeaderProps {
  onMenuToggle: () => void;
  currentUser?: string;
  isAuthenticated?: boolean;
  onNavigate?: (page: string) => void;
  isLoginOpen?: boolean;
  setIsLoginOpen?: (open: boolean) => void;
}



export function Header({ onMenuToggle, currentUser = "Siswa FBK", isAuthenticated, onNavigate, isLoginOpen, setIsLoginOpen }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    async function fetchNotifications() {
      if (!supabase) return;

      try {
        // 1. Fetch Latest Package
        const { data: latestPkgs } = await supabase
          .from('packages')
          .select('id, title, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        const newNotifs: any[] = [];
        let latestPkgDate = new Date(0);

        if (latestPkgs && latestPkgs.length > 0) {
          latestPkgDate = new Date(latestPkgs[0].created_at);
          newNotifs.push({
            id: `pkg-${latestPkgs[0].id}`,
            title: "Paket Belajar Baru!",
            message: `Paket "${latestPkgs[0].title}" kini tersedia di Katalog. Cek sekarang!`,
            time: latestPkgDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            read: false
          });
        }

        // 3. Fetch Events (Placeholder check for now)
        // Kita bisa tambahkan tabel events nanti, untuk sekarang kita buat 1 yang "Real" 
        // tapi hanya muncul jika ada info event mendatang.
        newNotifs.push({
          id: 'event-welcome',
          title: "Selamat Datang!",
          message: "Pendaftaran Batch 1 FBK resmi dibuka. Mari mulai belajar!",
          time: "Baru saja",
          read: false
        });

        setNotifications(newNotifs);
      } catch (err) {
        console.error("Gagal ambil notifikasi:", err);
      }
    }

    fetchNotifications();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !supabase) {
      alert("Harap isi email dan password.");
      return;
    }

    if (!isLoginMode && !name) {
      alert("Harap isi Nama User.");
      return;
    }
    
    if (!agreed) {
      alert("Anda harus menyetujui Kebijakan Layanan & Syarat Ketentuan.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLoginMode) {
        // Coba login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          alert("Gagal masuk: Email atau password salah.");
        } else {
          setIsLoginOpen?.(false);
        }
      } else {
        // Coba register
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        
        if (signUpError) {
          alert("Gagal mendaftar: " + signUpError.message);
        } else if (!data.user || !data.user.identities || data.user.identities.length === 0) {
          // Supabase returns a fake user (with empty identities) or null if the email already exists
          alert("Gagal mendaftar: Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.");
        } else {
          // Keluar dari sesi otomatis yang dibuat saat daftar
          await supabase.auth.signOut();
          alert("Pendaftaran berhasil! Silakan login dengan email dan password Anda.");
          setIsLoginMode(true);
          setEmail("");
          setPassword("");
          setName("");
          setAgreed(false);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setDropdownOpen(false);
  };

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 lg:px-8 gap-4 shadow-sm">
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
            <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
            )}
          </button>

          <AnimatePresence>
            {notificationOpen && (
                <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-[calc(100%-2rem)] sm:right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 flex flex-col"
              >
                <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-3 rounded-lg mb-1 transition-colors ${notif.read ? 'hover:bg-slate-50' : 'bg-blue-50 hover:bg-blue-100'} cursor-pointer`}
                      >
                        <h4 className={`text-sm ${notif.read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>{notif.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Tidak ada notifikasi
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-all duration-200 group"
          >
            <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 ring-2", isSiswaAktif ? "from-blue-400 to-blue-600 ring-blue-50" : "from-slate-400 to-slate-600 ring-slate-50")}>
              <span className="text-white text-xs font-bold">{currentUser?.slice(0, 2).toUpperCase() || "GA"}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-slate-900 text-xs font-bold leading-tight truncate max-w-[120px]">
                {currentUser}
              </span>
              <span className={cn("text-[10px] font-black uppercase tracking-widest leading-tight truncate", isSiswaAktif ? "text-blue-600" : "text-slate-500")}>
                {isSiswaAktif ? "Akun Siswa" : "Akun Gratis"}
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
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-1">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate?.("Profil Saya");
                    }}
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    Profil Saya
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate?.("Riwayat Transaksi");
                    }}
                  >
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    Riwayat Transaksi
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </>
          ) : (
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button data-login-trigger className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">Masuk</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 text-white shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] rounded-[2rem] overflow-hidden p-0 gap-0">
                <div className="relative p-8 md:p-10">
                  {/* Decorative Background Elements */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                  <div className="flex flex-col items-center justify-center mb-8 relative z-10">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                        <GraduationCap className="w-9 h-9 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h1 className="text-3xl font-black text-center text-white tracking-tight mb-2">
                      {isLoginMode ? "Masuk Akun" : "Registrasi"}
                    </h1>
                    <p className="text-center text-slate-400 text-sm font-medium">
                      {isLoginMode ? "Masuk untuk melanjutkan perjuanganmu menuju Kedinasan." : "Jadilah bagian dari angkatan pertama yang sukses bersama FBK."}
                    </p>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-5 relative z-10">
                    {!isLoginMode && (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300 font-semibold text-xs uppercase tracking-wider ml-1">Nama Lengkap</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Budi Santoso"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-slate-800/50 text-white border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-500 h-12 rounded-xl backdrop-blur-sm transition-all"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 font-semibold text-xs uppercase tracking-wider ml-1">Email Anda</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="siswa@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-800/50 text-white border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-500 h-12 rounded-xl backdrop-blur-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300 font-semibold text-xs uppercase tracking-wider ml-1">
                        {isLoginMode ? "Kata Sandi" : "Kata Sandi (Min 8 Karakter)"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-800/50 text-white border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-500 h-12 rounded-xl backdrop-blur-sm transition-all"
                      />
                    </div>

                    <div className="flex items-start gap-3 mt-2 px-1">
                      <div className="relative flex items-center h-5">
                        <input 
                          type="checkbox" 
                          id="agreed" 
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="w-4.5 h-4.5 rounded-md border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/30 transition-all cursor-pointer"
                        />
                      </div>
                      <Label htmlFor="agreed" className="text-slate-400 text-[13px] leading-snug cursor-pointer select-none">
                        Saya menyetujui <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsTermsDialogOpen(true); }}
                        className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline underline-offset-4 decoration-blue-500/30"
                      >
                        Kebijakan Layanan & Syarat Ketentuan
                      </button>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-base py-7 rounded-2xl transition-all duration-300 mt-6 shadow-xl shadow-blue-500/25 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Memproses...
                        </div>
                      ) : (isLoginMode ? "Masuk Sekarang" : "Buat Akun")}
                    </Button>
                  </form>
                  
                  <div className="mt-8 pt-6 border-t border-slate-800/50 text-center relative z-10">
                    <p className="text-slate-400 text-sm font-medium">
                      {isLoginMode ? "Belum menjadi anggota?" : "Sudah memiliki akun?"}{" "}
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsLoginMode(!isLoginMode); }} 
                        className="text-blue-400 font-black hover:text-blue-300 transition-colors"
                      >
                        {isLoginMode ? "Daftar Disini" : "Login Sekarang"}
                      </button>
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Dialog Kebijakan Layanan */}
          <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white text-slate-900 rounded-3xl p-0 border-none shadow-2xl">
              <div className="sticky top-0 bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Kebijakan Layanan</h2>
                </div>
              </div>
              
              <div className="p-8 space-y-6 text-sm leading-relaxed text-slate-600">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Selamat datang di Future Bimbel Kedinasan!</h3>
                  <p>
                    Syarat dan ketentuan ini menguraikan peraturan dan ketentuan penggunaan Situs Web Future Bimbel Kedinasan (FBK). Dengan mengakses situs web ini, kami menganggap Anda menerima syarat dan ketentuan ini secara penuh.
                  </p>
                </div>

                <section>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">1. Ketentuan Umum</h4>
                  <p>
                    Pengguna wajib memberikan data yang valid saat registrasi. Akun yang telah dibuat bersifat personal dan tidak diperbolehkan untuk dipindahtangankan atau digunakan secara bersama-sama oleh lebih dari satu orang.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">2. Akses Materi & Tryout</h4>
                  <p>
                    Akses materi, video, dan tryout hanya akan diberikan setelah pembayaran dikonfirmasi oleh sistem. Materi yang ada di platform FBK dilindungi hak cipta dan dilarang keras untuk digandakan atau disebarluaskan tanpa izin tertulis.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">3. Kebijakan Pembayaran</h4>
                  <p>
                    Semua transaksi dilakukan melalui Payment Gateway resmi kami. Pembelian paket yang sudah berhasil tidak dapat dibatalkan atau di-refund dengan alasan apapun, kecuali terdapat kesalahan sistem fatal dari pihak kami.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">4. Etika Pengguna</h4>
                  <p>
                    Siswa dilarang melakukan tindakan kecurangan saat tryout, melakukan spam di grup diskusi, atau mencoba meretas sistem keamanan platform kami. Pelanggaran terhadap poin ini dapat berakibat pada pemblokiran akun secara permanen.
                  </p>
                </section>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-blue-800 font-medium italic text-xs">
                    *Kebijakan ini dapat berubah sewaktu-waktu mengikuti perkembangan layanan kami. Siswa disarankan untuk memeriksa halaman ini secara berkala.
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end">
                <Button 
                  onClick={() => setIsTermsDialogOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl"
                >
                  Saya Mengerti
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
