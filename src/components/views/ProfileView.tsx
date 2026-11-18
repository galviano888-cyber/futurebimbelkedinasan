import { useState, useEffect } from "react";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Package, 
  Award, 
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  phone_number: string;
  email: string;
  student_code?: string | null;
}

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ packages: 0, tryouts: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) setProfile({ ...profileData, email: user.email });

        // Fetch Stats
        const [pkgRes, recordRes] = await Promise.all([
          supabase.from('user_packages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('tryout_results').select('tryout_id, package_name').eq('user_id', user.id)
        ]);

        // Count unique tryout_ids or package_names
        const uniqueTryouts = new Set(
          recordRes.data?.map(r => r.tryout_id || r.package_name).filter(Boolean)
        ).size;

        setStats({
          packages: pkgRes.count || 0,
          tryouts: uniqueTryouts
        });

      } catch (err) {
        console.error("Gagal ambil profil:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdatePhone = async () => {
    if (!supabase || !profile) return;
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: tempPhone })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, phone_number: tempPhone });
      setIsEditingPhone(false);
      toast.success("Nomor WhatsApp berhasil diperbarui");
    } catch (err: any) {
      toast.error("Gagal memperbarui nomor: " + err.message);
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* HEADER SECTION */}
      <div className="relative">
        <div className="h-36 sm:h-40 bg-[#10264a] border-y border-slate-700 relative overflow-hidden">
          {/* Abstract pattern/gradient for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/40" />
        </div>
        
        <div className="absolute -bottom-10 left-5 sm:left-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-white/10 overflow-hidden relative">
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-4xl">
              {profile?.full_name?.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
        </div>
      </div>

      {/* Name and Status Section (Always Below Banner) */}
      <div className="px-5 sm:px-8 pt-12 sm:pt-12">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-[-0.03em]">
          {profile?.full_name}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="px-3 py-1 bg-blue-800 dark:bg-blue-700 text-[10px] font-semibold text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Siswa Aktif FBK
          </div>
          {profile?.student_code && (
            <div className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider">
              Kode Akun: <span className="font-mono">{profile.student_code}</span>
            </div>
          )}
        </div>

        {/* Penanda kelengkapan profil — tidak wajib, hanya pengingat. */}
        {!profile?.phone_number && (
          <div className="mt-4 inline-flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.06] px-4 py-3 max-w-md">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300">
                Nomor WhatsApp belum diisi
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5 leading-relaxed">
                Tidak wajib, tetapi membantu admin menghubungi Anda soal paket dan pembayaran.
              </p>
              <button
                onClick={() => setIsEditingPhone(true)}
                className="mt-2 text-[11px] font-bold text-amber-800 dark:text-amber-300 underline underline-offset-2 hover:no-underline"
              >
                Isi sekarang
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-16">
        {/* SIDEBAR STATS */}
        <div className="lg:col-span-1 space-y-6">
          {/* Activity Cards */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 border-y border-slate-200 dark:border-white/10 space-y-4">
             <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Aktivitas Belajar</h3>
              <div className="flex items-center gap-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-900/30">
                 <div className="w-11 h-11 bg-white dark:bg-slate-900 flex items-center justify-center text-blue-700 dark:text-blue-300"><Package className="w-5 h-5" /></div>
                <div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white leading-none">{stats.packages}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wide">Paket Belajar</div>
                </div>
             </div>
              <div className="flex items-center gap-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-900/30">
                 <div className="w-11 h-11 bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300"><Award className="w-5 h-5" /></div>
                <div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white leading-none">{stats.tryouts}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wide">Tryout Selesai</div>
                </div>
             </div>
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-y border-slate-200 dark:border-white/10 relative overflow-hidden">
             
             <div className="relative z-10">
               <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-8 flex items-center gap-3">
                 <User className="w-5 h-5 text-blue-700 dark:text-blue-300" /> Informasi Akun
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nama Lengkap</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    {profile?.full_name || "Belum diatur"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nomor WhatsApp</p>
                  <div className="flex items-center gap-3">
                    {isEditingPhone ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+</span>
                          <input 
                            type="text"
                            value={tempPhone}
                            onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-7 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
                            placeholder="62812345678"
                          />
                        </div>
                        <button 
                          onClick={handleUpdatePhone}
                          disabled={updating}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => setIsEditingPhone(false)}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-300" /> +{profile?.phone_number || "Belum diatur"}
                        </p>
                        <button 
                          onClick={() => {
                            setTempPhone(profile?.phone_number || "");
                            setIsEditingPhone(true);
                          }}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide hover:underline"
                        >
                          Ubah
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Alamat Email</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-300" /> {profile?.email || "Belum diatur"}
                  </p>
                </div>
              </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
