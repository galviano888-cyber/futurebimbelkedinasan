import { useState, useEffect } from "react";
import { 
  Moon, 
  Sun, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save, 
  Palette, 
  Shield 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_public')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setIsPublic(profileData.is_public !== false);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    toast.success(nextTheme === "dark" ? "Mode Gelap diaktifkan" : "Mode Terang diaktifkan");
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ is_public: isPublic })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Pengaturan berhasil disimpan!");
    } catch (error: any) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-tight">Memuat pengaturan...</p>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Pengaturan Akun</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Kustomisasi pengalaman belajar Anda di platform FBK.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Settings */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">Tampilan</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Mode Visual</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={toggleTheme}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 group",
                  isDark 
                    ? "bg-slate-800 border-slate-700" 
                    : "bg-slate-50 border-slate-100 hover:border-blue-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    isDark ? "bg-slate-700 text-yellow-400" : "bg-white text-blue-600 shadow-sm"
                  )}>
                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {isDark ? "Mode Gelap Aktif" : "Mode Terang Aktif"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Klik untuk beralih mode
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-colors duration-500",
                  isDark ? "bg-blue-600" : "bg-slate-200"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-md",
                    isDark ? "left-5" : "left-1"
                  )} />
                </div>
              </button>
            </div>
          </section>

          {/* Privacy Settings */}
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">Privasi</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ranking Nasional</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
                  !isPublic 
                    ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" 
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    !isPublic ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {isPublic ? "Profil Publik" : "Profil Privat"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {isPublic ? "Nama terlihat di ranking" : "Nama disembunyikan di ranking"}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-colors duration-500",
                  isPublic ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-md",
                    isPublic ? "left-5" : "left-1"
                  )} />
                </div>
              </button>
              <p className="text-[10px] text-slate-400 italic px-2 leading-relaxed">
                * Jika profil diseting Privat, nama Anda akan muncul sebagai "Siswa Privat" di leaderboard nasional untuk menjaga privasi Anda.
              </p>
            </div>
          </section>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            SIMPAN PERUBAHAN
          </button>
        </div>
      </motion.div>
    </div>
  );
}
