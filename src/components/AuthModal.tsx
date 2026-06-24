import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { LegalModal } from "./LegalModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  forceNameModal?: boolean;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', forceNameModal = false }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Modal nama lengkap setelah Google login
  const [showNameModal, setShowNameModal] = useState(forceNameModal);
  const [googleName, setGoogleName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Sync state when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      if (forceNameModal) setShowNameModal(true);
    }
  }, [initialMode, isOpen, forceNameModal]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}?google_callback=true`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      // Browser akan redirect ke Google, tidak perlu setLoading(false)
    } catch (err: any) {
      toast.error(err.message || "Gagal login dengan Google");
      setGoogleLoading(false);
    }
  };

  const handleSaveGoogleName = async () => {
    if (!supabase || !googleName.trim()) return;
    setSavingName(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");
      await supabase.from('profiles').upsert({ id: user.id, full_name: googleName.trim() }, { onConflict: 'id' });
      await supabase.auth.updateUser({ data: { full_name: googleName.trim() } });
      toast.success("Selamat datang, " + googleName.trim() + "!");
      setShowNameModal(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nama");
    } finally {
      setSavingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!isLogin && !agreed) {
      toast.error("Anda harus menyetujui Syarat & Ketentuan");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Berhasil masuk!");
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}?verified=true`,
          },
        });
        if (error) throw error;
        toast.success("Akun Berhasil Dibuat!", {
          description: "Satu langkah lagi. Silakan cek email Anda dan klik link verifikasi untuk mengaktifkan akun.",
          duration: 6000
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error.message === "Email not confirmed") {
        toast.error("Email Belum Terverifikasi", {
          description: "Silakan cek kotak masuk email Anda dan klik link konfirmasi untuk mengaktifkan akun.",
          duration: 5000
        });
      } else {
        toast.error(error.message || "Terjadi kesalahan");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border border-slate-200 bg-white rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-slate-900/10">
        <div className="relative p-6 lg:p-9">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
          
          <DialogHeader className="relative z-10 mb-5 lg:mb-7">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/25 mb-4 lg:mb-5 mx-auto">
              <ShieldCheck className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl lg:text-[28px] font-extrabold text-slate-900 text-center tracking-tight">
              {isLogin ? "Selamat Datang Kembali" : "Gabung Bersama Kami"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center font-medium mt-1.5 lg:mt-2 text-xs lg:text-sm">
              {isLogin 
                ? "Masuk untuk melanjutkan persiapan kedinasanmu." 
                : "Buat akun untuk mulai belajar dengan materi terbaik."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5 relative z-10">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-600 ml-1">Nama Lengkap</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    placeholder="Masukkan nama lengkap" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="bg-slate-50 border-slate-200 text-slate-900 pl-12 h-12 lg:h-13 rounded-xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-600 ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 pl-12 h-12 lg:h-13 rounded-xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[11px] font-semibold text-slate-600">Password</Label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!supabase) return toast.error("Koneksi bermasalah, coba lagi nanti.");
                      if (!email) return toast.error("Silakan masukkan alamat email Anda terlebih dahulu.");
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast.success("Link reset password telah dikirim ke email Anda.");
                      } catch (err: any) {
                        toast.error(err.message || "Gagal mengirim link reset password");
                      }
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 pl-12 pr-12 h-12 lg:h-13 rounded-xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 px-1 py-1">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20" 
                />
                <label htmlFor="terms" className="text-[11px] lg:text-[12px] text-slate-500 leading-relaxed">
                  Saya setuju dengan <button type="button" onClick={() => { setLegalType('terms'); setIsLegalOpen(true); }} className="text-blue-600 font-medium hover:underline">Syarat & Ketentuan</button> serta <button type="button" onClick={() => { setLegalType('privacy'); setIsLegalOpen(true); }} className="text-blue-600 font-medium hover:underline">Kebijakan Privasi</button> Future Bimbel Kedinasan.
                </label>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 lg:h-13 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Masuk Sekarang" : "Daftar Sekarang"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-5 relative z-10">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium">atau</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="relative z-10 mt-3 w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-[14px] rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Lanjutkan dengan Google
              </>
            )}
          </button>

          <div className="mt-5 lg:mt-6 pt-5 lg:pt-6 border-t border-slate-100 text-center relative z-10">
            <p className="text-slate-500 text-[12px] lg:text-sm">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                type="button"
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors ml-1"
              >
                {isLogin ? "Daftar Gratis" : "Masuk"}
              </button>
            </p>
          </div>
        </div>

        {/* Modal nama lengkap untuk Google login */}
        {showNameModal && (
          <div className="absolute inset-0 bg-white rounded-3xl flex flex-col items-center justify-center p-8 z-20">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-600/25">
              <User className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-1">Satu langkah lagi!</h3>
            <p className="text-slate-500 text-sm text-center mb-6">Masukkan nama lengkapmu untuk melengkapi profil.</p>
            <div className="w-full space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGoogleName()}
                  autoFocus
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button
                onClick={handleSaveGoogleName}
                disabled={!googleName.trim() || savingName}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Simpan & Masuk</>}
              </button>
            </div>
          </div>
        )}
      </DialogContent>

      <LegalModal 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
        type={legalType} 
      />
    </Dialog>
  );
}
