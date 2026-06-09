import { useState, useEffect } from "react";
import { Lock, LogOut, Upload, Database, Users, FileJson, ShoppingCart, Edit2, Search, Filter, SortAsc, Globe, Plus, Trash2, Check, X, Loader2, Bell, ChevronRight, LayoutDashboard, Package, MessageSquare, CreditCard, BookOpen, Download, Info, Copy, CheckCheck, Eye, EyeOff, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { AdminPackageEditorView } from "./AdminPackageEditorView";
import { AdminQuestionEditorView } from "./AdminQuestionEditorView";
import { AdminProductEditorView } from "./AdminProductEditorView";
import { AdminTransactionManager } from "./AdminTransactionManager";
import { AdminUserManager } from "./AdminUserManager";
import { AdminBroadcastView } from "./AdminBroadcastView";
import { AdminLandingPageEditorView } from "./AdminLandingPageEditorView";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { id: 'dashboard', label: 'Bank Soal', icon: Database, group: 'Konten' },
  { id: 'sales-packages', label: 'Produk', icon: ShoppingCart, group: 'Konten' },
  { id: 'landing-page', label: 'Edit Website', icon: Globe, group: 'Konten' },
  { id: 'users', label: 'Siswa', icon: Users, group: 'Data' },
  { id: 'transactions', label: 'Transaksi', icon: CreditCard, group: 'Data' },
  { id: 'broadcast', label: 'Pengumuman', icon: Bell, group: 'Data' },
];

export function AdminPanelView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'manual' | 'edit-package' | 'edit-questions' | 'sales-packages' | 'edit-product' | 'transactions' | 'users' | 'broadcast' | 'landing-page'>('dashboard');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  const [loading, setLoading] = useState(true);
  const [salesPackages, setSalesPackages] = useState<any[]>([]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const templateJSON = JSON.stringify({
    name: "Tryout SKD Seri 1 - 2026",
    category: "SKD",
    questions: [
      {
        number: 1,
        category: "TWK",
        question_text: "Pancasila sebagai dasar negara mengandung makna bahwa...",
        options: {
          A: "Pancasila menjadi sumber dari segala sumber hukum",
          B: "Pancasila hanya berlaku untuk aparatur negara",
          C: "Pancasila bersifat statis dan tidak dapat dikembangkan",
          D: "Pancasila hanya berlaku di lingkungan pemerintahan",
          E: "Pancasila merupakan ideologi tertutup"
        },
        correct_answer: "A",
        explanation: "Pancasila sebagai dasar negara berarti Pancasila menjadi sumber dari segala sumber hukum yang berlaku di Indonesia (Tap MPR No. III/MPR/2000).",
        fast_tips: "Ingat: Dasar Negara = Sumber Hukum Tertinggi"
      },
      {
        number: 2,
        category: "TIU",
        question_text: "Jika 2x + 3 = 11, maka nilai x adalah...",
        options: {
          A: "2",
          B: "3",
          C: "4",
          D: "5",
          E: "6"
        },
        correct_answer: "C",
        explanation: "2x + 3 = 11 → 2x = 8 → x = 4",
        fast_tips: "Pindahkan konstanta ke kanan, lalu bagi koefisien x"
      },
      {
        number: 3,
        category: "TKP",
        question_text: "Ketika rekan kerja Anda melakukan kesalahan yang berulang, sikap Anda adalah...",
        options: {
          A: "Melaporkan langsung ke atasan tanpa memberi tahu rekan tersebut",
          B: "Menegur dengan keras di depan rekan lain agar jera",
          C: "Mendiamkan karena bukan urusan Anda",
          D: "Memberitahu secara personal dengan sopan dan menawarkan bantuan",
          E: "Membicarakan dengan rekan lain untuk mencari solusi bersama"
        },
        correct_answer: "D",
        tkp_scores: { A: 1, B: 2, C: 1, D: 5, E: 3 },
        explanation: "Sikap profesional yang tepat adalah komunikasi langsung secara personal dengan sopan.",
        fast_tips: "TKP: Prioritaskan komunikasi langsung, sopan, dan konstruktif"
      }
    ]
  }, null, 2);

  const handleDownloadTemplate = () => {
    const blob = new Blob([templateJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-soal-fbk.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template berhasil didownload!');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(templateJSON);
    setCopiedTemplate(true);
    toast.success('Template disalin ke clipboard!');
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  useEffect(() => {
    fetchPackages();
    const checkSession = async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const isAdmin = session.user.app_metadata?.role === 'admin' ||
            session.user.email?.endsWith('@fbk-kedinasan.com');
          if (isAdmin) {
            setEmail(session.user.email || "");
            setIsLoggedIn(true);
            fetchPackages();
            fetchSalesPackages();
          }
        }
      } catch (err) {
        console.error("Check session error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    let result = [...packages];
    if (searchQuery) result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory !== "Semua") result = result.filter(p => p.category === selectedCategory);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else result.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredPackages(result);
  }, [searchQuery, selectedCategory, sortBy, packages]);

  const fetchPackages = async () => {
    if (!supabase) return;
    // Ambil jumlah soal per paket sekaligus
    const { data, error } = await supabase
      .from('tryout_packages')
      .select('*, tryout_questions(count)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const enriched = data.map((p: any) => ({
        ...p,
        question_count: p.tryout_questions?.[0]?.count ?? 0
      }));
      setPackages(enriched);
      setFilteredPackages(enriched);
    }
  };

  const handleTogglePublish = async (pkg: any) => {
    if (!supabase) return;
    const newStatus = pkg.status === 'Published' ? 'Draft' : 'Published';
    const { error } = await supabase
      .from('tryout_packages')
      .update({ status: newStatus })
      .eq('id', pkg.id);
    if (!error) {
      setPackages(packages.map(p => p.id === pkg.id ? { ...p, status: newStatus } : p));
      toast.success(`Paket ${newStatus === 'Published' ? 'dipublish' : 'dijadikan draft'}`);
    } else {
      toast.error('Gagal mengubah status: ' + error.message);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    setConfirmDialog({ open: true, title: 'Hapus Paket Tryout', message: `Hapus paket "${name}" dan semua soalnya secara permanen?`, onConfirm: async () => {
      if (!supabase) return;
      await supabase.from('tryout_questions').delete().eq('package_id', id);
      const { error } = await supabase.from('tryout_packages').delete().eq('id', id);
      if (!error) { toast.success('Paket berhasil dihapus'); fetchPackages(); }
      else toast.error('Gagal hapus: ' + error.message);
    }});
  };

  const handleUpdatePackageName = async (id: string, newName: string) => {
    if (!newName.trim()) { setEditingPackageId(null); return; }
    const { error } = await supabase!.from('tryout_packages').update({ name: newName }).eq('id', id);
    if (!error) {
      setPackages(packages.map(p => p.id === id ? { ...p, name: newName } : p));
      toast.success("Nama tryout berhasil diubah");
      setEditingPackageId(null);
    } else {
      toast.error("Gagal mengubah nama: " + error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supabase) return;
    setConfirmDialog({
      open: true,
      title: 'Hapus Produk',
      message: 'Hapus produk ini secara permanen? Tindakan ini tidak bisa dibatalkan.',
      onConfirm: async () => {
        try {
          setLoading(true);
          const { error } = await supabase!.from('packages').delete().eq('id', id);
          if (error) throw error;
          toast.success("Produk berhasil dihapus");
          await fetchSalesPackages();
        } catch (err: any) {
          toast.error("Gagal menghapus: " + (err.message || "Unknown error"));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const fetchSalesPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase!.from('packages').select('*').order('created_at', { ascending: false });
    if (data) setSalesPackages(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: loginData, error: loginError } = await supabase!.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const user = loginData.user;
      const isAdmin = user?.app_metadata?.role === 'admin' || user?.email?.endsWith('@fbk-kedinasan.com');
      if (isAdmin) {
        setIsLoggedIn(true);
        fetchPackages();
        fetchSalesPackages();
      } else {
        await supabase!.auth.signOut();
        setError("Akses ditolak. Bukan admin.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // ─── LOGIN PAGE ───────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-indigo-500/25">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">FBK Admin</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Control Center</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-bold text-center">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  placeholder="admin@fbk-kedinasan.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm mt-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk ke Dashboard'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN LAYOUT ──────────────────────────────────────────────
  const groups = ['Konten', 'Data'];

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Toaster theme="dark" position="top-right" />

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col h-full bg-[#0d0d14] border-r border-white/5">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">FBK Admin</p>
              <p className="text-[10px] text-indigo-400 font-bold mt-0.5">Control Center</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-2">{group}</p>
              <div className="space-y-0.5">
                {navItems.filter(i => i.group === group).map(item => {
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as any)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group',
                        active
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      )}
                    >
                      <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400')} />
                      <span>{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/20">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{email.split('@')[0]}</p>
              <p className="text-[9px] text-slate-500 font-bold">Superadmin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-white/5 bg-[#0d0d14] flex items-center px-8 justify-between">
          <div>
            <h1 className="text-base font-black text-white tracking-tight">
              {navItems.find(i => i.id === currentView)?.label || 'Dashboard'}
            </h1>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
              Future Bimbel Kedinasan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto">

            {/* ── BANK SOAL ─── */}
            {currentView === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Bank Soal Tryout</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">{filteredPackages.length} paket tersedia</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentView('manual')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/8 text-slate-300 rounded-xl font-bold text-xs hover:bg-white/10 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat Manual
                    </button>
                    <button
                      onClick={() => setCurrentView('import')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Upload className="w-3.5 h-3.5" /> Import JSON
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <input
                      type="text"
                      placeholder="Cari nama paket..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                    >
                      <option className="bg-slate-900">Semua</option>
                      <option className="bg-slate-900">SKD</option>
                      <option className="bg-slate-900">TIU</option>
                      <option className="bg-slate-900">TWK</option>
                      <option className="bg-slate-900">TKP</option>
                    </select>
                  </div>
                  <div className="relative">
                    <SortAsc className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="newest" className="bg-slate-900">Terbaru</option>
                      <option value="name" className="bg-slate-900">Nama A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#0d0d14] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Nama Tryout</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Kategori</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Soal</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {filteredPackages.map((pkg) => (
                        <tr key={pkg.id} className="group hover:bg-white/[0.02] transition-colors">
                          {/* Nama */}
                          <td className="px-6 py-4">
                            {editingPackageId === pkg.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdatePackageName(pkg.id, editingName);
                                    if (e.key === 'Escape') setEditingPackageId(null);
                                  }}
                                  className="bg-white/5 border border-indigo-500/40 rounded-lg px-3 py-1.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[200px]"
                                />
                                <button onClick={() => handleUpdatePackageName(pkg.id, editingName)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingPackageId(null)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{pkg.name}</span>
                                <button
                                  onClick={() => { setEditingPackageId(pkg.id); setEditingName(pkg.name); }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                          {/* Kategori */}
                          <td className="px-6 py-4">
                            <select
                              value={pkg.category || 'SKD'}
                              onChange={async (e) => {
                                const newCat = e.target.value;
                                const { error } = await supabase!.from('tryout_packages').update({ category: newCat }).eq('id', pkg.id);
                                if (!error) {
                                  setPackages(packages.map(p => p.id === pkg.id ? { ...p, category: newCat } : p));
                                  toast.success("Kategori diubah");
                                }
                              }}
                              className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black outline-none cursor-pointer hover:bg-indigo-500/20 transition-colors"
                            >
                              {['SKD','TIU','TWK','TKP'].map(c => <option key={c} className="bg-slate-900 text-white">{c}</option>)}
                            </select>
                          </td>
                          {/* Jumlah Soal */}
                          <td className="px-6 py-4">
                            <span className={cn(
                              'px-2.5 py-1 rounded-lg text-[11px] font-black border',
                              pkg.question_count > 0
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            )}>
                              {pkg.question_count} soal
                            </span>
                          </td>
                          {/* Status toggle */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleTogglePublish(pkg)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all',
                                pkg.status === 'Published'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              )}
                            >
                              {pkg.status === 'Published'
                                ? <><Eye className="w-3 h-3" /> Published</>
                                : <><EyeOff className="w-3 h-3" /> Draft</>}
                            </button>
                          </td>
                          {/* Aksi */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 rounded-lg text-xs font-black transition-all"
                                onClick={() => { setSelectedPackageId(pkg.id); setCurrentView('edit-questions'); }}
                              >
                                Edit Soal
                              </button>
                              <button
                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPackages.length === 0 && (
                    <div className="py-20 text-center">
                      <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-600 font-bold text-sm">Tidak ada data ditemukan</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PRODUK ─── */}
            {currentView === 'sales-packages' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Katalog Produk</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">{salesPackages.length} produk aktif</p>
                  </div>
                  <button
                    onClick={() => { setSelectedProductId(null); setCurrentView('edit-product'); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Produk
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {salesPackages.map(pkg => (
                    <div key={pkg.id} className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6 group hover:border-indigo-500/20 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedProductId(pkg.id); setCurrentView('edit-product'); }}
                            className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(pkg.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{pkg.product_type}</span>
                        <h3 className="text-base font-black text-white mt-1 leading-tight">{pkg.title}</h3>
                        <p className="text-lg font-black text-white mt-3">
                          {pkg.price === 0 ? <span className="text-emerald-400">Gratis</span> : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                        </p>
                        {pkg.original_price > 0 && pkg.original_price > pkg.price && (
                          <p className="text-xs text-slate-600 line-through">Rp {pkg.original_price.toLocaleString('id-ID')}</p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg', pkg.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20')}>
                          {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button
                          onClick={() => { setSelectedProductId(pkg.id); setCurrentView('edit-product'); }}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Edit →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BUAT MANUAL ─── */}
            {currentView === 'manual' && (
              <div className="max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-black text-white tracking-tight">Buat Paket Baru</h2>
                    <p className="text-sm text-slate-500 mt-1">Siapkan wadah untuk bank soal baru.</p>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Paket</label>
                      <input
                        id="new-pkg-name"
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm font-medium placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        placeholder="Contoh: Tryout Akbar SKD 2026"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kategori</label>
                      <select
                        id="new-pkg-cat"
                        className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm font-bold outline-none appearance-none"
                      >
                        {['SKD','TIU','TWK','TKP'].map(c => <option key={c} className="bg-slate-900">{c}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="flex-1 h-11 rounded-xl font-bold text-slate-400 border-white/8 bg-transparent hover:bg-white/5">
                        Batal
                      </Button>
                      <Button
                        className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20"
                        onClick={async () => {
                          const name = (document.getElementById('new-pkg-name') as HTMLInputElement).value;
                          const cat = (document.getElementById('new-pkg-cat') as HTMLSelectElement).value;
                          if (!name) return toast.error("Nama paket harus diisi!");
                          const { data, error } = await supabase!.from('tryout_packages').insert({ name, category: cat, status: 'Draft' }).select().single();
                          if (error) return toast.error(error.message);
                          setSelectedPackageId(data.id);
                          setCurrentView('edit-questions');
                        }}
                      >
                        Buat Paket
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── IMPORT JSON ─── */}
            {currentView === 'import' && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">Import JSON</h2>
                      <p className="text-sm text-slate-500 mt-1">Upload file JSON untuk bulk import soal.</p>
                    </div>
                    <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="rounded-xl font-bold text-slate-400 border-white/8 bg-transparent hover:bg-white/5 text-sm">Kembali</Button>
                  </div>

                  {/* Template Section */}
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-black text-amber-400">Penting:</span> Unduh template di bawah sebagai panduan format yang benar. Isi dengan soal-soal yang tersedia, lalu upload di sini. Jangan ubah nama field (<code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">number</code>, <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">category</code>, <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">options</code>, dll).
                      </div>
                    </div>

                    {/* Field guide */}
                    <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Panduan Field</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { field: 'name', desc: 'Nama paket tryout', required: true },
                          { field: 'category', desc: 'SKD / TIU / TWK / TKP', required: true },
                          { field: 'number', desc: 'Nomor urut soal (1, 2, 3...)', required: true },
                          { field: 'category (soal)', desc: 'TWK / TIU / TKP per soal', required: true },
                          { field: 'question_text', desc: 'Teks pertanyaan', required: true },
                          { field: 'options', desc: 'Pilihan A, B, C, D, E', required: true },
                          { field: 'correct_answer', desc: 'Kunci jawaban (A/B/C/D/E)', required: true },
                          { field: 'explanation', desc: 'Pembahasan jawaban', required: false },
                          { field: 'fast_tips', desc: 'Tips cepat mengerjakan', required: false },
                          { field: 'tkp_scores', desc: 'Skor per opsi khusus TKP', required: false },
                          { field: 'question_image_url', desc: 'URL gambar soal (opsional)', required: false },
                        ].map(({ field, desc, required }) => (
                          <div key={field} className="flex items-start gap-2">
                            <code className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">{field}</code>
                            <span className="text-[11px] text-slate-500">{desc}</span>
                            {required && <span className="text-[9px] font-black text-red-400 shrink-0">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Template preview + actions */}
                    <div className="bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-black text-white">template-soal-fbk.json</span>
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">3 contoh soal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyTemplate}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all"
                          >
                            {copiedTemplate ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedTemplate ? 'Disalin!' : 'Salin'}
                          </button>
                          <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black transition-all shadow-lg shadow-indigo-500/20"
                          >
                            <Download className="w-3 h-3" />
                            Download Template
                          </button>
                        </div>
                      </div>
                      <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto p-4 max-h-64">
                        {templateJSON}
                      </pre>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div className={cn(
                    'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group',
                    selectedJsonFile ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/8 hover:border-indigo-500/30 hover:bg-white/[0.02]'
                  )}>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setSelectedJsonFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <FileJson className={cn('w-10 h-10 mx-auto mb-3 transition-colors', selectedJsonFile ? 'text-indigo-400' : 'text-slate-700 group-hover:text-slate-600')} />
                    {selectedJsonFile ? (
                      <>
                        <p className="text-sm font-black text-white">{selectedJsonFile.name}</p>
                        <p className="text-xs text-indigo-400 font-bold mt-1">{(selectedJsonFile.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-400">Klik atau drag & drop file JSON</p>
                        <p className="text-xs text-slate-600 mt-1">Hanya file .json yang diterima</p>
                      </>
                    )}
                  </div>

                  <Button
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 disabled:opacity-40"
                    disabled={!selectedJsonFile || loading}
                    onClick={async () => {
                      if (!selectedJsonFile) return;
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        try {
                          const raw = e.target?.result as string;
                          const data = JSON.parse(raw);
                          setLoading(true);
                          const packageName = data.name || data.title || selectedJsonFile.name.replace('.json', '');
                          const { data: pkgData, error: pkgError } = await supabase!.from('tryout_packages').insert({
                            name: packageName, category: data.category || 'SKD', status: 'Draft'
                          }).select().single();
                          if (pkgError) throw pkgError;
                          const questionsToInsert = data.questions.map((q: any) => ({ ...q, package_id: pkgData.id }));
                          const { error: qError } = await supabase!.from('tryout_questions').insert(questionsToInsert);
                          if (qError) throw qError;
                          toast.success(`Import berhasil! ${questionsToInsert.length} soal ditambahkan.`);
                          setCurrentView('dashboard');
                          fetchPackages();
                          setSelectedJsonFile(null);
                        } catch (err: any) {
                          toast.error("Gagal import: " + err.message);
                        } finally {
                          setLoading(false);
                        }
                      };
                      reader.readAsText(selectedJsonFile);
                    }}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Proses Import'}
                  </Button>
                </div>
              </div>
            )}

            {currentView === 'users' && <AdminUserManager />}
            {currentView === 'broadcast' && <AdminBroadcastView />}
            {currentView === 'landing-page' && <AdminLandingPageEditorView />}
            {currentView === 'transactions' && <AdminTransactionManager />}

            {currentView === 'edit-package' && selectedPackageId && (
              <AdminPackageEditorView packageId={selectedPackageId} onBack={() => { setCurrentView('sales-packages'); fetchSalesPackages(); }} />
            )}
            {currentView === 'edit-questions' && selectedPackageId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => { setCurrentView('dashboard'); fetchPackages(); }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Bank Soal
                  </button>
                  <span className="text-slate-700">/</span>
                  <span className="text-white font-black">
                    {packages.find(p => p.id === selectedPackageId)?.name || 'Edit Soal'}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black">
                    {packages.find(p => p.id === selectedPackageId)?.question_count ?? 0} soal
                  </span>
                </div>
                <AdminQuestionEditorView packageId={selectedPackageId} onBack={() => { setCurrentView('dashboard'); fetchPackages(); }} />
              </div>
            )}
            {currentView === 'edit-product' && (
              <AdminProductEditorView packageId={selectedProductId} onBack={() => { setCurrentView('sales-packages'); setSelectedProductId(null); fetchSalesPackages(); }} />
            )}

          </div>
        </main>
      </div>

      {/* ── CONFIRM DIALOG ─────────────────────────────── */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-black text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 mb-7">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, open: false }));
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-all shadow-lg shadow-red-500/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
