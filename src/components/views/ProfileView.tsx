import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Camera, 
  ShieldCheck,
  Package,
  Award,
  Loader2,
  Save,
  CreditCard
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ProfileViewProps {
  onNavigate?: (page: string) => void;
}

export function ProfileView({ onNavigate }: ProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    packages: 0,
    tryouts: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil data profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Fallback jika belum ada baris di tabel profiles
        setProfile({
          full_name: user.user_metadata?.full_name || "Siswa FBK",
          email: user.email,
          whatsapp: "",
          school: ""
        });
      }

      // Ambil Stats
      const { count: pkgCount } = await supabase
        .from('user_packages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: tryoutCount } = await supabase
        .from('tryout_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        packages: pkgCount || 0,
        tryouts: tryoutCount || 0
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !profile) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          whatsapp: profile.whatsapp,
          school: profile.school
        });

      if (error) throw error;
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      toast.error("Gagal memperbarui profil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-tight">Menyiapkan profil Anda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl" />
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] p-1.5 shadow-xl border-4 border-white overflow-hidden">
               <div className="w-full h-full bg-slate-100 rounded-[2.2rem] flex items-center justify-center text-blue-600 font-black text-4xl">
                 {profile?.full_name?.charAt(0).toUpperCase() || "S"}
               </div>
            </div>
            <button className="absolute bottom-2 right-2 w-10 h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center transition-all active:scale-90">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div className="pb-4">
            <h1 className="text-2xl font-black text-white drop-shadow-sm">{profile?.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-300" /> Siswa Aktif FBK
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
        {/* STATS CARDS */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Aktivitas Belajar</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-800 leading-none">{stats.packages}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Paket Belajar</div>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-800 leading-none">{stats.tryouts}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Tryout Selesai</div>
                  </div>
               </div>
               <button 
                  onClick={() => onNavigate?.("Riwayat Transaksi")}
                  className="w-full mt-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Lihat Riwayat Transaksi
                </button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl -mr-10 -mt-10" />
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Target Kamu</h4>
            <p className="text-sm font-medium leading-relaxed">Terus asah kemampuanmu dan raih skor tertinggi di SKD 2026!</p>
            <div className="mt-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-400 w-[45%]" />
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400">45% Menuju Target SKD</div>
          </div>
        </div>

        {/* EDIT PROFILE FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Informasi Akun</h2>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SIMPAN PERUBAHAN
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative group opacity-60">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={profile?.full_name || ""}
                    readOnly
                    placeholder="Nama lengkap"
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={profile?.email || ""}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={profile?.whatsapp || ""}
                    onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asal Sekolah / Instansi</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={profile?.school || ""}
                    onChange={(e) => setProfile({...profile, school: e.target.value})}
                    placeholder="Contoh: SMAN 1 Jakarta"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Keamanan Akun</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Kelola akses dan kata sandi kamu</p>
                </div>
             </div>
             <div className="flex flex-col md:flex-row gap-4">
                <button className="px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider">
                   Ganti Kata Sandi
                </button>
                <button className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider">
                   Hapus Akun
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
