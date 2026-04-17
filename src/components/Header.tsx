import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabaseClient";

interface HeaderProps {
  onMenuToggle: () => void;
  currentUser?: string;
  isAuthenticated?: boolean;
}

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Tryout Nasional Gelombang II", message: "Pendaftaran telah dibuka. Segera daftar sebelum kuota penuh!", time: "10 menit yang lalu", read: false },
  { id: 2, title: "Nilai Tryout Keluar", message: "Nilai Tryout SKD Gelombang I kamu sudah bisa dilihat di halaman Dashboard.", time: "2 jam yang lalu", read: false },
  { id: 3, title: "Materi Baru Ditambahkan", message: "Modul TIU terbaru sudah tersedia di menu Materi Belajar.", time: "1 hari yang lalu", read: true },
];

export function Header({ onMenuToggle, currentUser = "Siswa FBK", isAuthenticated }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

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
          setIsLoginDialogOpen(false);
        }
      } else {
        // Coba register
        const { error: signUpError } = await supabase.auth.signUp({
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
                className="absolute right-[calc(100%-2rem)] sm:right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 z-50 flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
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
                        className={`p-3 rounded-lg mb-1 transition-colors ${notif.read ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'} cursor-pointer`}
                      >
                        <h4 className={`text-sm ${notif.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{notif.title}</h4>
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
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-100">
              <span className="text-white text-xs font-bold">{currentUser.slice(0, 2).toUpperCase()}</span>
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
            <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Masuk</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
                <div className="flex flex-col items-center justify-center mb-2 mt-2">
                  <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
                    <GraduationCap className="w-10 h-10 text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-center text-white tracking-tight mb-1">
                    {isLoginMode ? "Masuk Akun" : "Registrasi"}
                  </h1>
                  <p className="text-center text-slate-400 text-sm">
                    {isLoginMode ? "Selamat datang kembali di Future Bimbel Kedinasan" : "Mendaftar akun baru."}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {!isLoginMode && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white font-medium text-sm">Nama User :</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Masukan Nama Lengkap anda..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white text-slate-900 border-none focus-visible:ring-2 focus-visible:ring-blue-400 placeholder:text-slate-400 h-11"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium text-sm">Email :</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukan email anda..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white text-slate-900 border-none focus-visible:ring-2 focus-visible:ring-blue-400 placeholder:text-slate-400 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium text-sm">
                      {isLoginMode ? "Password :" : "Password (Min : 8) :"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white text-slate-900 border-none focus-visible:ring-2 focus-visible:ring-blue-400 placeholder:text-slate-400 h-11"
                    />
                  </div>

                  <div className="flex items-start gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="agreed" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />
                    <Label htmlFor="agreed" className="text-slate-300 text-sm leading-snug cursor-pointer">
                      Saya menyetujui <span className="text-white font-semibold underline decoration-blue-500 underline-offset-2">Kebijakan Layanan & Syarat Ketentuan</span>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-base py-6 rounded-lg transition-colors mt-4 shadow-lg shadow-blue-500/20"
                  >
                    {isLoading ? "Memproses..." : (isLoginMode ? "Masuk" : "Daftar")}
                  </Button>
                </form>
                
                <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                  <p className="text-slate-400 text-sm">
                    {isLoginMode ? "Belum memiliki akun?" : "Sudah memiliki akun?"}{" "}
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsLoginMode(!isLoginMode); }} 
                      className="text-blue-400 font-bold hover:underline"
                    >
                      {isLoginMode ? "Daftar" : "Login"}
                    </button>
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
