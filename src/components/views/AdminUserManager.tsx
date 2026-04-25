import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  GraduationCap, 
  ShieldCheck, 
  Loader2,
  Package,
  Trash2,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminUserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_packages (
            package_id,
            packages (title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan tidak terduga");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!supabase) return;
    if (!confirm(`Hapus akun "${fullName}"? Tindakan ini permanen.`)) return;

    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast.success("Akun berhasil dihapus!");
    } catch (err: any) {
      toast.error("Gagal menghapus user: " + err.message);
    }
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) return;
    
    const headers = ["ID", "Nama Lengkap", "Email", "WhatsApp", "Sekolah", "Paket Aktif", "Tgl Daftar"];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${u.full_name || 'N/A'}"`,
      `"${u.email || 'N/A'}"`,
      `"${u.whatsapp || 'N/A'}"`,
      `"${u.school || 'N/A'}"`,
      `"${u.user_packages?.map((up: any) => up.packages?.title).join(', ') || 'None'}"`,
      `"${new Date(u.created_at).toLocaleDateString('id-ID')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data-siswa-fbk-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-pulse">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-black mt-4 tracking-[0.2em] uppercase text-[10px]">Sinkronisasi Basis Data Siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen User</h2>
            <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black shadow-lg shadow-indigo-500/20">
              {users.length} SISWA
            </div>
            <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
               <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">Pantau perkembangan pendaftaran dan paket aktif setiap siswa.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Cari Nama atau Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800 shadow-sm"
            />
          </div>
          <Button onClick={exportToCSV} disabled={filteredUsers.length === 0} className="h-14 px-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs gap-2 shadow-lg shadow-indigo-500/20">
            <Download className="w-4 h-4" /> EXPORT CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-800">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Siswa</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kontak & Instansi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akses Produk</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registrasi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                          {user.full_name}
                          {user.email === 'admin.utama@fbk-kedinasan.com' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-700 font-black flex items-center gap-2">
                        <div className="p-1 bg-slate-100 rounded-lg"><Phone className="w-3 h-3 text-slate-500" /></div>
                        {user.whatsapp || "Belum Mengisi"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold flex items-center gap-2">
                        <div className="p-1 bg-slate-100 rounded-lg"><GraduationCap className="w-3 h-3 text-slate-500" /></div>
                        {user.school || "Instansi -"}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2 max-w-[200px]">
                      {user.user_packages && user.user_packages.length > 0 ? (
                        user.user_packages.map((up: any, idx: number) => (
                          <div 
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-xl border border-emerald-100 shadow-sm"
                          >
                            <Package className="w-2.5 h-2.5" />
                            {up.packages?.title}
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">User Baru</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-slate-700">
                          {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Bergabung</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <ExternalLink className="w-4 h-4" />
                       </button>
                       {user.email !== "admin.utama@fbk-kedinasan.com" && (
                         <button 
                           onClick={() => handleDeleteUser(user.id, user.full_name)}
                           className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <Users className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Pencarian Tidak Ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
