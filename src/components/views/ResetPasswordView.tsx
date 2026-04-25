import { useState } from "react";
import { Lock, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function ResetPasswordView() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useState(() => {
    // Check for error in hash (Supabase puts errors in hash fragment)
    const hash = window.location.hash;
    if (hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const errorMsg = params.get("error_description")?.replace(/\+/g, " ") || "Link tidak valid atau sudah kedaluwarsa.";
      setUrlError(errorMsg);
      toast.error(errorMsg);
    }
  });

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Konformasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      if (!supabase) throw new Error("Koneksi database tidak tersedia.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      toast.success("Kata sandi berhasil diperbarui!");
      
      // Tunggu sebentar lalu redirect ke home
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err: any) {
      toast.error("Gagal memperbarui kata sandi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Berhasil!</h2>
          <p className="text-slate-500 font-medium">Kata sandi Anda telah diperbarui. Menghubungkan kembali ke Dashboard...</p>
          <Button onClick={() => window.location.href = "/"} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
            MASUK SEKARANG <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-xl shadow-blue-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Atur Ulang Sandi</h1>
            <p className="text-slate-500 text-sm font-medium">Buat kata sandi baru yang kuat untuk akun FBK Anda.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold text-xs uppercase tracking-wider ml-1">Kata Sandi Baru</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Minimal 8 karakter"
                  className="bg-slate-50 border-slate-200 h-14 rounded-2xl pr-12 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold text-xs uppercase tracking-wider ml-1">Konfirmasi Kata Sandi</Label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Ulangi kata sandi"
                  className="bg-slate-50 border-slate-200 h-14 rounded-2xl pr-12 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading || !!urlError} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (urlError ? "LINK TIDAK VALID" : "SIMPAN KATA SANDI")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
