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
  Download,
  Gift,
  X,
  Check
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminUserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [allPackages, setAllPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [_currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Assign modal state
  const [assignModal, setAssignModal] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  });
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    fetchAllPackages();
  }, []);

  const fetchCurrentUser = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserEmail(user.email || null);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchAllPackages = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('packages')
        .select('id, title, product_type')
        .eq('is_active', true)
        .order('title');
      setAllPackages(data || []);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: userPackagesData } = await supabase
        .from('user_packages')
        .select('id, user_id, package_id, packages (title, product_type)');

      const merged = (profilesData || []).map((profile: any) => ({
        ...profile,
        user_packages: (userPackagesData || []).filter((up: any) => up.user_id === profile.id)
      }));

      const studentsOnly = merged.filter(
        (u: any) => !['admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com'].includes(u.email)
      );
      setUsers(studentsOnly);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan tidak terduga");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPackage = async () => {
    if (!supabase || !assignModal.user || !selectedPackageId) return;
    setAssigning(true);
    try {
      const userId = assignModal.user.id;
      // Cek apakah sudah punya paket ini
      const already = assignModal.user.user_packages?.find((up: any) => up.package_id === selectedPackageId);
      if (already) {
        toast.error('Siswa sudah memiliki paket ini.');
        return;
      }
      const { error } = await supabase
        .from('user_packages')
        .insert([{ user_id: userId, package_id: selectedPackageId }]);
      if (error) throw error;
      toast.success('Paket berhasil diberikan ke siswa!');
      setAssignModal({ open: false, user: null });
      setSelectedPackageId('');
      await fetchUsers();
    } catch (err: any) {
      toast.error('Gagal memberikan paket: ' + (err.message || 'Coba lagi'));
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokePackage = async (userPackageId: string, userName: string, packageTitle: string) => {
    if (!supabase) return;
    if (!confirm(`Cabut paket "${packageTitle}" dari ${userName}?`)) return;
    setRevokingId(userPackageId);
    try {
      const { error } = await supabase
        .from('user_packages')
        .delete()
        .eq('id', userPackageId);
      if (error) throw error;
      toast.success('Paket berhasil dicabut.');
      await fetchUsers();
    } catch (err: any) {
      toast.error('Gagal mencabut paket: ' + err.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!supabase) return;
    if (!confirm(`Hapus akun "${fullName}"? Tindakan ini permanen.`)) return;
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Akun berhasil dihapus!');
    } catch (err: any) {
      toast.error('Gagal menghapus user: ' + err.message);
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

  // Packages user belum punya (untuk dropdown assign)
  const availablePackages = allPackages.filter(
    pkg => !assignModal.user?.user_packages?.find((up: any) => up.package_id === pkg.id)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#0d1929] border border-white/5 rounded-2xl">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-slate-600 font-bold mt-3 tracking-widest uppercase text-[10px]">Memuat Data Siswa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Manajemen Siswa</h2>
            <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold">
              {users.length} SISWA
            </div>
            <button onClick={fetchUsers} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
               <RotateCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">Pantau dan kelola paket setiap siswa secara langsung.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Cari Nama atau Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl w-72 font-bold text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button onClick={exportToCSV} disabled={filteredUsers.length === 0} className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> EXPORT
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm font-bold text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-[#0d1929] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Siswa</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Kontak</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Paket Aktif</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Bergabung</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-600 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {user.full_name}
                        {['admin.utama@fbk-kedinasan.com', 'admin.soal@fbk-kedinasan.com'].includes(user.email) && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Mail className="w-2.5 h-2.5" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-600" />
                      {user.whatsapp || <span className="text-slate-600 italic">Belum diisi</span>}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <GraduationCap className="w-3 h-3" />
                      {user.school || 'Instansi -'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.user_packages && user.user_packages.length > 0 ? (
                      user.user_packages.map((up: any) => (
                        <span key={up.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded-lg border border-emerald-500/20 group/pkg">
                          <Package className="w-2.5 h-2.5 shrink-0" />
                          <span className="max-w-[100px] truncate">{up.packages?.title}</span>
                          <button
                            onClick={() => handleRevokePackage(up.id, user.full_name, up.packages?.title)}
                            disabled={revokingId === up.id}
                            className="ml-0.5 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            title="Cabut paket ini"
                          >
                            {revokingId === up.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <X className="w-2.5 h-2.5" />}
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-slate-700 italic">Belum ada paket</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => { setAssignModal({ open: true, user }); setSelectedPackageId(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all"
                      title="Beri paket ke siswa ini"
                    >
                      <Gift className="w-3.5 h-3.5" /> Beri Paket
                    </button>
                    <button className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Tidak Ada Data</p>
          </div>
        )}
      </div>

      {/* ── ASSIGN PACKAGE MODAL ─────────────────────── */}
      {assignModal.open && assignModal.user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Beri Paket ke Siswa</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">{assignModal.user.full_name} &middot; {assignModal.user.email}</p>
              </div>
              <button onClick={() => setAssignModal({ open: false, user: null })} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paket yang sudah dimiliki */}
            {assignModal.user.user_packages?.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Paket Dimiliki</p>
                <div className="flex flex-wrap gap-1.5">
                  {assignModal.user.user_packages.map((up: any) => (
                    <span key={up.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
                      <Check className="w-3 h-3" /> {up.packages?.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdown pilih paket */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Paket yang Akan Diberikan</label>
              {availablePackages.length === 0 ? (
                <div className="py-4 text-center text-[12px] text-slate-500 bg-white/[0.03] rounded-xl border border-white/5">
                  Siswa ini sudah memiliki semua paket aktif.
                </div>
              ) : (
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none"
                >
                  <option value="" disabled className="bg-slate-900">-- Pilih paket --</option>
                  {availablePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id} className="bg-slate-900">
                      {pkg.title} ({pkg.product_type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal({ open: false, user: null })}
                className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-slate-400 font-bold text-sm rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleAssignPackage}
                disabled={!selectedPackageId || assigning || availablePackages.length === 0}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Memberikan...</> : <><Gift className="w-4 h-4" /> Beri Paket</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
