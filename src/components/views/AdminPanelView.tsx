import { useState, useRef, useEffect } from "react";
import { Lock, LogIn, LogOut, Upload, Database, Settings, Users, AlertCircle, FileJson, CheckCircle2, ArrowLeft, Plus, ShoppingCart, Edit2, Check, X, Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { AdminPackageEditorView } from "./AdminPackageEditorView";
import { AdminProductEditorView } from "./AdminProductEditorView";
import { AdminTransactionManager } from "./AdminTransactionManager";
import { AdminUserManager } from "./AdminUserManager";

export function AdminPanelView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // App State
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'manual' | 'edit-package' | 'sales-packages' | 'edit-product' | 'transactions' | 'users'>('dashboard');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPackages: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [salesPackages, setSalesPackages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cek sesi otomatis saat komponen dimuat
  useEffect(() => {
    fetchPackages();
    fetchStats();
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email) {
        if (session.user.email === "admin.utama@fbk-kedinasan.com" || session.user.email === "admin.soal@fbk-kedinasan.com") {
          setEmail(session.user.email);
          setIsLoggedIn(true);
          fetchPackages();
          fetchSalesPackages();
        }
      }
    };
    checkSession();
  }, []);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tryout_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setPackages(data);
    }
  };

  const fetchStats = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pkgCount } = await supabase.from('tryout_packages').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('transactions').select('amount').eq('status', 'success');
      
      const totalSales = salesData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalPackages: pkgCount || 0,
        totalSales: totalSales
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateName = async (id: string) => {
    if (!supabase || !newName.trim()) return;
    const { error } = await supabase
      .from('tryout_packages')
      .update({ name: newName })
      .eq('id', id);
    
    if (error) {
      alert("Gagal update nama: " + error.message);
    } else {
      setRenamingId(null);
      fetchPackages();
    }
  };

  const fetchSalesPackages = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      const filtered = data.filter((p: any) => 
        p.id !== '11111111-1111-1111-1111-111111111111' && 
        p.title !== 'Program Intensif SKD Batch 1'
      );
      setSalesPackages(filtered);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsUploading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsUploading(false);

    if (signInError) {
      setError("Gagal login: " + signInError.message);
    } else if (data.user?.email) {
      // Validasi tambahan untuk memastikan hanya email admin yang bisa masuk
      const adminEmails = ["admin.utama@fbk-kedinasan.com", "admin.soal@fbk-kedinasan.com"];
      if (adminEmails.includes(data.user.email)) {
        setIsLoggedIn(true);
        setError("");
        fetchPackages();
        fetchSalesPackages();
      } else {
        await supabase.auth.signOut();
        setError("Kredensial tidak valid atau tidak memiliki akses superadmin.");
      }
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // 1. Validasi Struktur Dasar JSON
      if (!json.package_name || !json.questions || !Array.isArray(json.questions)) {
        throw new Error("Format JSON tidak valid. Pastikan menggunakan template yang benar.");
      }

      // 2. Insert Package
      const { data: packageData, error: packageError } = await supabase
        .from('tryout_packages')
        .insert({
          name: json.package_name,
          duration_minutes: json.duration_minutes || 100,
          status: 'Draft'
        })
        .select()
        .single();

      if (packageError) throw packageError;
      
      // 3. Siapkan Array Soal (110 Soal)
      const questionsToInsert = json.questions.map((q: any) => ({
        package_id: packageData.id,
        number: q.number,
        category: q.category,
        question_text: q.question_text,
        question_image_url: q.question_image_url,
        options: q.options,
        options_image_url: q.options_image_url,
        correct_answer: q.correct_answer,
        tkp_scores: q.tkp_scores,
        explanation: q.explanation,
        fast_tips: q.fast_tips
      }));

      // 4. Bulk Insert Soal ke Supabase
      const { error: questionsError } = await supabase
        .from('tryout_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        // Rollback (Hapus paket jika gagal insert soal)
        await supabase.from('tryout_packages').delete().eq('id', packageData.id);
        throw questionsError;
      }

      setUploadSuccess(true);
      fetchPackages(); // Segarkan daftar paket di dashboard
    } catch (err: any) {
      alert("Gagal import: " + (err.message || "Pastikan file JSON valid"));
      console.error(err);
    } finally {
      setIsUploading(false);
      // Reset input agar bisa upload file yang sama lagi jika perlu
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Secure Admin Login</h1>
          <p className="text-slate-400 text-center text-sm mb-8">Portal khusus pengelola Future Bimbel Kedinasan.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 block">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold text-base mt-4 shadow-lg shadow-blue-900/20 disabled:opacity-50">
              <LogIn className="w-5 h-5 mr-2" />
              {isUploading ? "Memverifikasi..." : "Masuk Portal"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Premium Sidebar Admin */}
      <div className="w-72 bg-[#0a1120] text-white flex flex-col hidden lg:flex relative overflow-hidden shrink-0 shadow-[10px_0_40px_rgba(0,0,0,0.1)]">
        {/* Sidebar Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] -ml-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mb-32 pointer-events-none" />

        <div className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Database className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="font-black text-xl tracking-tight text-white leading-tight">FBK <span className="text-blue-500">Admin</span></h2>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Superadmin Access</p>
                </div>
             </div>
          </div>
        </div>

        <div className="px-4 py-2 space-y-1.5 flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 mb-2">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Manajemen Utama</p>
          </div>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
              currentView === 'dashboard' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {currentView === 'dashboard' && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full -ml-0" />}
            <Database className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-bold text-sm tracking-tight">Bank Soal</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('users')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
              currentView === 'users' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {currentView === 'users' && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full -ml-0" />}
            <Users className={`w-5 h-5 ${currentView === 'users' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-bold text-sm tracking-tight">Manajemen User</span>
          </button>

          <button 
            onClick={() => setCurrentView('sales-packages')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
              currentView === 'sales-packages' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {currentView === 'sales-packages' && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full -ml-0" />}
            <ShoppingCart className={`w-5 h-5 ${currentView === 'sales-packages' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-bold text-sm tracking-tight">Paket Belajar</span>
          </button>

          <button 
            onClick={() => setCurrentView('transactions')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
              currentView === 'transactions' 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {currentView === 'transactions' && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full -ml-0" />}
            <FileJson className={`w-5 h-5 ${currentView === 'transactions' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="font-bold text-sm tracking-tight">Transaksi</span>
          </button>

          <div className="pt-8 px-4 py-2">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Konfigurasi</p>
          </div>

          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-300 group">
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
            <span className="font-bold text-sm tracking-tight">Pengaturan</span>
          </button>
        </div>

        <div className="p-6 relative z-10">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 rounded-[2rem] font-bold text-sm hover:bg-red-500 hover:text-white transition-all duration-500 border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center px-10 justify-between shrink-0 sticky top-0 z-40">
          <div>
             <h1 className="font-black text-slate-900 text-xl tracking-tight">
                {currentView === 'dashboard' && 'Manajemen Bank Soal'}
                {currentView === 'users' && 'Manajemen User'}
                {currentView === 'sales-packages' && 'Paket Belajar & Produk'}
                {currentView === 'transactions' && 'Verifikasi Transaksi'}
             </h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control Center • Future Bimbel Kedinasan</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-black text-slate-900 leading-none">{email.split('@')[0]}</span>
               <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter mt-1">Superadmin Access</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-black border border-slate-300 shadow-sm group hover:scale-105 transition-transform cursor-pointer">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {currentView === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${loading ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                  {/* Total Sales Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                        {loading ? <RotateCw className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                      </div>
                      <h3 className="text-blue-100 font-black text-[10px] uppercase tracking-[0.2em]">Total Penjualan</h3>
                      <p className="text-3xl font-black mt-1 tracking-tighter">
                        {loading ? '...' : `Rp ${stats.totalSales.toLocaleString()}`}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-200 bg-white/10 w-fit px-3 py-1 rounded-full">
                         <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Syncing...' : 'Real-time Sync'}
                      </div>
                    </div>
                  </div>

                  {/* Total Users Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-all" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {loading ? <RotateCw className="w-6 h-6 animate-spin" /> : <Users className="w-6 h-6" />}
                      </div>
                      <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Total Siswa</h3>
                      <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
                        {loading ? '...' : stats.totalUsers}
                      </p>
                      <p className="mt-4 text-[10px] font-bold text-slate-400">Siswa Terdaftar Aktif</p>
                    </div>
                  </div>

                  {/* Total Packages Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        {loading ? <RotateCw className="w-6 h-6 animate-spin" /> : <Database className="w-6 h-6" />}
                      </div>
                      <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Total Paket</h3>
                      <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
                        {loading ? '...' : stats.totalPackages}
                      </p>
                      <p className="mt-4 text-[10px] font-bold text-slate-400">Produk Aktif di Katalog</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                    <Database className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-lg">Modul Terhubung dengan Database Supabase (Live)</h3>
                    <p className="text-emerald-800 text-sm mt-1">
                      Fase 2 Selesai. Fitur Bulk Import JSON sekarang akan mengunggah data secara real-time ke tabel <code>tryout_packages</code> dan <code>tryout_questions</code>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Daftar Draft SKD</h2>
                  <div className="flex gap-3">
                    <Button variant="outline" className="font-semibold text-slate-700 border-slate-300 hover:bg-slate-50" onClick={() => setCurrentView('manual')}>
                      <Plus className="w-4 h-4 mr-2" /> Buat Manual
                    </Button>
                    <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setCurrentView('import'); setUploadSuccess(false); }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import JSON
                    </Button>
                    <a 
                      href="/template-soal-skd.json" 
                      download="template-soal-skd.json"
                      className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Template
                    </a>
                  </div>
                </div>

                {packages.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden text-center p-20">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <Database className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Database Masih Kosong</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto mb-8 font-medium leading-relaxed">
                      Anda belum memiliki paket soal. Gunakan fitur Bulk Import menggunakan template JSON yang telah disediakan untuk mengunggah 110 soal sekaligus.
                    </p>
                    <a href="/template-soal-skd.json" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-8 py-4 border border-slate-200 shadow-sm text-sm font-black rounded-2xl text-slate-700 bg-white hover:bg-slate-50 transition-all">
                      Download Template JSON
                    </a>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/50 backdrop-blur-sm">
                        <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Tryout</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tgl Dibuat</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {packages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-blue-50/30 transition-colors group">
                             <td className="px-8 py-5 whitespace-nowrap">
                               {renamingId === pkg.id ? (
                                 <div className="flex items-center gap-2">
                                   <input 
                                     value={newName} 
                                     onChange={(e) => setNewName(e.target.value)}
                                     className="bg-white border-2 border-blue-500 rounded-xl px-4 py-2 text-sm font-black text-slate-900 shadow-lg shadow-blue-500/10 outline-none w-64 animate-in zoom-in-95 duration-200"
                                     autoFocus
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter') handleUpdateName(pkg.id);
                                       if (e.key === 'Escape') setRenamingId(null);
                                     }}
                                   />
                                   <button 
                                     onClick={() => handleUpdateName(pkg.id)} 
                                     className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                   >
                                     <Check className="w-4 h-4" />
                                   </button>
                                   <button 
                                     onClick={() => setRenamingId(null)} 
                                     className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"
                                   >
                                     <X className="w-4 h-4" />
                                   </button>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                      <Database className="w-5 h-5" />
                                   </div>
                                   <div className="flex items-center gap-2 group/text">
                                     <div className="font-black text-slate-900 tracking-tight">{pkg.name}</div>
                                     <button 
                                       onClick={() => {
                                         setRenamingId(pkg.id);
                                         setNewName(pkg.name);
                                       }}
                                       className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover/text:opacity-100 transition-all"
                                     >
                                       <Edit2 className="w-3 h-3" />
                                     </button>
                                   </div>
                                 </div>
                               )}
                             </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                                {pkg.category}
                              </span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-[11px] font-bold text-slate-400">
                              {new Date(pkg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${pkg.status === 'Published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${pkg.status === 'Published' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {pkg.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black transition-all"
                                    onClick={() => {
                                      setSelectedPackageId(pkg.id);
                                      setCurrentView('edit-package');
                                    }}
                                  >
                                    Edit Soal
                                  </button>
                                  <button 
                                    className="px-4 py-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-xs font-black transition-all"
                                    onClick={async () => {
                                      if (!supabase) return;
                                      if(confirm('Yakin ingin menghapus paket ini?')) {
                                        await supabase.from('tryout_packages').delete().eq('id', pkg.id);
                                        fetchPackages();
                                      }
                                    }}
                                  >
                                    Hapus
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {currentView === 'import' && (
              <div className="animate-in fade-in duration-300">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Bulk Import JSON</h2>
                <p className="text-slate-500 mb-8">Unggah file template JSON yang telah diisi untuk memasukkan ratusan soal dalam sekali klik ke database live.</p>

                {!uploadSuccess ? (
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-bold text-slate-700">Memproses & Menyimpan ke Database...</h3>
                        <p className="text-slate-500 mt-2">Mohon tunggu, sedang memasukkan 110 butir soal ke tabel Supabase.</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileJson className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Pilih File JSON</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          Pastikan file sesuai dengan template yang diunduh. Ukuran maksimal 5MB.
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg">
                          Jelajahi File Komputer
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Import Berhasil!</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                      Paket ujian dan seluruh soal telah berhasil disimpan secara permanen di database Supabase Anda.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => setUploadSuccess(false)}>
                        Upload File Lain
                      </Button>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setCurrentView('dashboard')}>
                        Lihat Daftar Paket
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'manual' && (
              <div className="animate-in fade-in duration-300">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                  <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Form Buat Manual (Segera Hadir)</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Antarmuka pembuat soal interaktif sedang dirancang untuk Fase 3. Silakan gunakan fitur Bulk Import JSON untuk saat ini.
                  </p>
                </div>
              </div>
            )}

            {currentView === 'sales-packages' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Manajemen Produk & Paket Belajar</h2>
                  <Button 
                    onClick={() => {
                      setSelectedProductId(null);
                      setCurrentView('edit-product');
                    }}
                    className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Paket Baru
                  </Button>
                </div>
                
                {salesPackages.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Belum Ada Produk</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                      Klik "Buat Paket Baru" untuk mulai menjual paket tryout atau program intensif.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Judul Paket</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Harga</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {salesPackages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{pkg.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                pkg.product_type === 'INTENSIF' ? 'bg-purple-100 text-purple-800' : 
                                pkg.product_type === 'BUNDLE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {pkg.product_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                              Rp {pkg.price.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`w-3 h-3 rounded-full inline-block mr-2 ${pkg.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className="text-sm text-slate-600">{pkg.is_active ? 'Aktif' : 'Nonaktif'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => {
                                  setSelectedProductId(pkg.id);
                                  setCurrentView('edit-product');
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4 font-bold"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!supabase) return;
                                  if(confirm('Hapus produk ini?')) {
                                    await supabase.from('packages').delete().eq('id', pkg.id);
                                    fetchSalesPackages();
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {currentView === 'transactions' && (
              <AdminTransactionManager />
            )}

            {currentView === 'users' && (
              <AdminUserManager />
            )}

            {currentView === 'edit-product' && (
              <div className="absolute inset-0 bg-white z-50">
                <AdminProductEditorView 
                  packageId={selectedProductId}
                  onBack={() => {
                    setCurrentView('sales-packages');
                    setSelectedProductId(null);
                    fetchSalesPackages();
                  }}
                />
              </div>
            )}

            {currentView === 'edit-package' && selectedPackageId && (
              <div className="absolute inset-0 bg-white z-50">
                <AdminPackageEditorView 
                  packageId={selectedPackageId} 
                  onBack={() => {
                    setCurrentView('dashboard');
                    setSelectedPackageId(null);
                    fetchPackages();
                  }} 
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
