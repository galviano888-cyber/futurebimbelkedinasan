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
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync state when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
    }
  }, [initialMode, isOpen]);

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
          description: "Satu langkah lagi, Bro! Silakan cek email kamu dan klik link verifikasi untuk membuka akses penuh ke semua fitur FBK.",
          duration: 6000
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error.message === "Email not confirmed") {
        toast.error("Email Belum Terverifikasi", {
          description: "Silakan cek kotak masuk email Anda dan klik link konfirmasi untuk mengaktifkan akun, Bro!",
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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-slate-900 rounded-[2.5rem] max-h-[95vh] overflow-y-auto custom-scrollbar">
        <div className="relative p-6 lg:p-10">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
          
          <DialogHeader className="relative z-10 mb-4 lg:mb-6">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4 lg:mb-6 mx-auto">
              <ShieldCheck className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl lg:text-3xl font-black text-white text-center tracking-tight">
              {isLogin ? "Selamat Datang Kembali" : "Gabung Bersama Kami"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center font-medium mt-1 lg:mt-2 text-xs lg:text-sm">
              {isLogin 
                ? "Masuk untuk melanjutkan persiapan kedinasanmu." 
                : "Buat akun untuk mulai belajar dengan materi terbaik."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5 relative z-10">
            {!isLogin && (
              <div className="space-y-1 lg:space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    placeholder="Masukkan nama lengkap" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="bg-white/5 border-white/10 text-white pl-12 h-12 lg:h-14 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 lg:space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white pl-12 h-12 lg:h-14 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 lg:space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</Label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!supabase) return toast.error("Koneksi bermasalah, coba lagi nanti.");
                      if (!email) return toast.error("Masukkan email kamu dulu ya Bro!");
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast.success("Link reset password sudah dikirim ke email kamu!");
                      } catch (err: any) {
                        toast.error(err.message || "Gagal mengirim link reset password");
                      }
                    }}
                    className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white pl-12 pr-12 h-12 lg:h-14 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                  className="mt-1 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20" 
                />
                <label htmlFor="terms" className="text-[10px] lg:text-[11px] text-slate-400 leading-relaxed font-medium">
                  Saya setuju dengan <button type="button" onClick={() => { setLegalType('terms'); setIsLegalOpen(true); }} className="text-blue-500 hover:underline">Syarat & Ketentuan</button> serta <button type="button" onClick={() => { setLegalType('privacy'); setIsLegalOpen(true); }} className="text-blue-500 hover:underline">Kebijakan Privasi</button> Future Bimbel Kedinasan.
                </label>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 lg:h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 mt-2 lg:mt-4"
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

          <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-white/5 text-center relative z-10">
            <p className="text-slate-500 text-[10px] lg:text-xs font-medium">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                type="button"
                className="text-blue-500 font-black uppercase tracking-widest hover:text-blue-400 transition-colors ml-1"
              >
                {isLogin ? "Daftar Gratis" : "Masuk"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>

      <LegalModal 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
        type={legalType} 
      />
    </Dialog>
  );
}
