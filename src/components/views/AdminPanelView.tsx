import { useState, useEffect } from "react";
import { Lock, LogOut, Upload, Database, Users, FileJson, ShoppingCart, Edit2, Search, Filter, SortAsc, Globe, Plus, Trash2, Check, X, Loader2 } from "lucide-react";
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

export function AdminPanelView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // App State
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'manual' | 'edit-package' | 'edit-questions' | 'sales-packages' | 'edit-product' | 'transactions' | 'users' | 'broadcast' | 'landing-page'>('dashboard');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  const [loading, setLoading] = useState(true);
  const [salesPackages, setSalesPackages] = useState<any[]>([]);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPackages();
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // Check if user has admin role in app_metadata or matches admin criteria
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

  // Filter Logic for Table
  useEffect(() => {
    let result = [...packages];

    // Search
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Category
    if (selectedCategory !== "Semua") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredPackages(result);
  }, [searchQuery, selectedCategory, sortBy, packages]);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tryout_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPackages(data);
      setFilteredPackages(data);
    }
  };

  const handleUpdatePackageName = async (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingPackageId(null);
      return;
    }
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
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus produk ini secara permanen? Data konten di dalamnya juga akan terhapus.");
    if (!isConfirmed) return;

    try {
      setLoading(true);
      console.log("Deleting product:", id);
      const { error } = await supabase.from('packages').delete().eq('id', id);
      
      if (error) {
        console.error("Supabase Delete Error:", error);
        throw error;
      }

      toast.success("Produk berhasil dihapus");
      await fetchSalesPackages();
    } catch (err: any) {
      console.error("Delete Catch Error:", err);
      toast.error("Gagal menghapus produk: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
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
      const isAdmin = user?.app_metadata?.role === 'admin' || 
                      user?.email?.endsWith('@fbk-kedinasan.com');

      if (isAdmin) {
        setIsLoggedIn(true);
        fetchPackages();
        fetchSalesPackages();
      } else {
        await supabase!.auth.signOut();
        setError("Akses ditolak. Anda bukan admin.");
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_50%)]" />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-900/50 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-white" /></div>
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Control</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold text-center animate-shake">{error}</div>}
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" placeholder="admin@fbk.com" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" placeholder="••••••••" />
              <Button type="submit" disabled={loading} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black">MASUK</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster theme="dark" position="top-right" />
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 shrink-0 flex flex-col h-full relative">
        <div className="p-8 border-b border-white/5">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Database className="w-5 h-5 text-white" /></div>
             <div><h2 className="font-black text-white text-lg tracking-tight">FBK Admin</h2><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Superadmin</span></div>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 py-8 space-y-2">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><Database className="w-5 h-5" /><span className="font-bold text-sm">Bank Soal</span></button>
          <button onClick={() => setCurrentView('landing-page')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'landing-page' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><Globe className="w-5 h-5" /><span className="font-bold text-sm">Edit Website</span></button>
          <button onClick={() => setCurrentView('broadcast')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'broadcast' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><Upload className="w-5 h-5" /><span className="font-bold text-sm">Pengumuman</span></button>
          <button onClick={() => setCurrentView('users')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'users' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><Users className="w-5 h-5" /><span className="font-bold text-sm">Siswa</span></button>
          <button onClick={() => setCurrentView('sales-packages')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'sales-packages' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><ShoppingCart className="w-5 h-5" /><span className="font-bold text-sm">Produk</span></button>
          <button onClick={() => setCurrentView('transactions')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentView === 'transactions' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}><FileJson className="w-5 h-5" /><span className="font-bold text-sm">Transaksi</span></button>
        </div>
        <div className="p-6"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 rounded-[2rem] font-bold text-sm hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><LogOut className="w-4 h-4" /> Logout</button></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center px-10 justify-between shrink-0 sticky top-0 z-40">
          <div><h1 className="font-black text-slate-900 text-xl tracking-tight">FBK Control Center</h1></div>
          <div className="flex items-center gap-6"><div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black">{email.charAt(0).toUpperCase()}</div></div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {currentView === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* ADVANCED FILTERING SECTION */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Bank Soal Tryout</h2>
                     <div className="flex gap-4">
                        <button onClick={() => setCurrentView('manual')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all"><Plus className="w-4 h-4" /> Buat Manual</button>
                        <button onClick={() => setCurrentView('import')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"><Upload className="w-4 h-4" /> Import JSON</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text"
                         placeholder="Cari nama paket soal..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                       />
                    </div>
                    <div className="md:col-span-3 relative">
                       <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <select 
                         value={selectedCategory}
                         onChange={(e) => setSelectedCategory(e.target.value)}
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none appearance-none"
                       >
                         <option className="text-slate-900">Semua</option>
                         <option className="text-slate-900">SKD</option>
                         <option className="text-slate-900">TIU</option>
                         <option className="text-slate-900">TWK</option>
                         <option className="text-slate-900">TKP</option>
                       </select>
                    </div>
                    <div className="md:col-span-3 relative">
                       <SortAsc className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <select 
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value as any)}
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none appearance-none"
                       >
                         <option value="newest" className="text-slate-900">Terbaru</option>
                         <option value="name" className="text-slate-900">Nama A-Z</option>
                       </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                      <tr>
                        <th className="px-8 py-5 text-left">Nama Tryout</th>
                        <th className="px-8 py-5 text-left">Kategori</th>
                        <th className="px-8 py-5 text-left">Status</th>
                        <th className="px-8 py-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {filteredPackages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-8 py-5 whitespace-nowrap">
                             {editingPackageId === pkg.id ? (
                               <div className="flex items-center gap-2 animate-in fade-in duration-300">
                                 <input 
                                   autoFocus
                                   type="text" 
                                   value={editingName}
                                   onChange={(e) => setEditingName(e.target.value)}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') handleUpdatePackageName(pkg.id, editingName);
                                     if (e.key === 'Escape') setEditingPackageId(null);
                                   }}
                                   className="bg-white border border-blue-500 rounded-lg px-3 py-1 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 min-w-[200px]"
                                 />
                                 <button onClick={() => handleUpdatePackageName(pkg.id, editingName)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"><Check className="w-4 h-4" /></button>
                                 <button onClick={() => setEditingPackageId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                               </div>
                             ) : (
                               <div className="flex items-center gap-3 group/name">
                                 <div className="font-black text-slate-900 tracking-tight">{pkg.name}</div>
                                 <button 
                                   onClick={() => { setEditingPackageId(pkg.id); setEditingName(pkg.name); }}
                                   className="opacity-0 group-hover/name:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                 >
                                   <Edit2 className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                             )}
                           </td>
                           <td className="px-8 py-5 whitespace-nowrap">
                             <select 
                               value={pkg.category || 'SKD'}
                               onChange={async (e) => {
                                 const newCat = e.target.value;
                                 const { error } = await supabase!.from('tryout_packages').update({ category: newCat }).eq('id', pkg.id);
                                 if (!error) {
                                   setPackages(packages.map(p => p.id === pkg.id ? { ...p, category: newCat } : p));
                                   toast.success("Kategori berhasil diubah");
                                 }
                               }}
                               className="px-3 py-1 bg-indigo-50 text-indigo-900 rounded-lg text-[10px] font-black border-none outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
                             >
                               <option className="text-slate-900">SKD</option>
                               <option className="text-slate-900">TIU</option>
                               <option className="text-slate-900">TWK</option>
                               <option className="text-slate-900">TKP</option>
                             </select>
                           </td>
                           <td className="px-8 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${pkg.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                <span className={`text-[11px] font-black uppercase ${pkg.status === 'Published' ? 'text-emerald-600' : 'text-amber-600'}`}>{pkg.status}</span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-right"><button className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black transition-all" onClick={() => { setSelectedPackageId(pkg.id); setCurrentView('edit-questions'); }}>Edit Soal</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPackages.length === 0 && (
                    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Data tidak ditemukan</div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'users' && <AdminUserManager />}
            {currentView === 'broadcast' && <AdminBroadcastView />}
            {currentView === 'landing-page' && <AdminLandingPageEditorView />}
            {currentView === 'transactions' && <AdminTransactionManager />}
            {currentView === 'sales-packages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">Katalog Produk Jualan</h2><button onClick={() => setCurrentView('edit-product')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs">+ Tambah Produk</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {salesPackages.map(pkg => (
                     <div key={pkg.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-between group">
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{pkg.product_type}</p>
                          <h3 className="text-lg font-black text-slate-900">{pkg.title}</h3>
                          <p className="text-sm font-bold text-slate-500">Rp {pkg.price.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setSelectedProductId(pkg.id); setCurrentView('edit-product'); }} 
                            className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(pkg.id)} 
                            className="p-4 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            
            {currentView === 'manual' && (
              <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Buat Paket Baru 📝</h2>
                  <p className="text-slate-500 font-medium text-sm">Siapkan wadah untuk bank soal terbaikmu.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Paket</label>
                    <input id="new-pkg-name" type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold" placeholder="Contoh: Tryout Akbar SKD 2026" />
                  </div>
                   <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Utama</label>
                    <select id="new-pkg-cat" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900">
                      <option className="text-slate-900">SKD</option>
                      <option className="text-slate-900">TIU</option>
                      <option className="text-slate-900">TWK</option>
                      <option className="text-slate-900">TKP</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="flex-1 h-14 rounded-2xl font-bold">Batal</Button>
                    <Button className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black" onClick={async () => {
                      const name = (document.getElementById('new-pkg-name') as HTMLInputElement).value;
                      const cat = (document.getElementById('new-pkg-cat') as HTMLSelectElement).value;
                      if (!name) return toast.error("Nama paket harus diisi!");
                      const { data, error } = await supabase!.from('tryout_packages').insert({ name, category: cat, status: 'Draft' }).select().single();
                      if (error) return toast.error(error.message);
                      setSelectedPackageId(data.id);
                      setCurrentView('edit-questions');
                    }}>Gas Buat Paket</Button>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'import' && (
              <div className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Import JSON 🚀</h2>
                  <Button variant="outline" onClick={() => setCurrentView('dashboard')} className="rounded-xl font-bold">Kembali</Button>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 leading-relaxed uppercase tracking-wider mb-2">💡 Petunjuk Format JSON:</p>
                  <pre className="text-[10px] text-blue-600/80 font-mono bg-white/50 p-4 rounded-xl overflow-x-auto">
                    {`{
  "name": "Nama Paket",
  "category": "SKD",
  "questions": [
    { "number": 1, "category": "TWK", "question_text": "...", "options": {"A": "...", "B": "..."}, "correct_answer": "A", "explanation": "..." }
  ]
}`}
                  </pre>
                </div>
                <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center space-y-4 hover:border-blue-200 transition-all group relative">
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={(e) => setSelectedJsonFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <FileJson className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{selectedJsonFile ? selectedJsonFile.name : "Pilih File JSON"}</p>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedJsonFile ? `${(selectedJsonFile.size / 1024).toFixed(2)} KB` : "Drag & drop atau klik untuk upload"}</p>
                  </div>
                </div>

                <Button 
                  className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!selectedJsonFile || loading}
                  onClick={async () => {
                    if (!selectedJsonFile) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      try {
                        const raw = e.target?.result as string;
                        const data = JSON.parse(raw);
                        setLoading(true);
                        
                        // 1. Insert Package
                        const packageName = data.name || data.title || selectedJsonFile.name.replace('.json', '');
                        const { data: pkgData, error: pkgError } = await supabase!.from('tryout_packages').insert({
                          name: packageName,
                          category: data.category || 'SKD',
                          status: 'Draft'
                        }).select().single();
                        
                        if (pkgError) throw pkgError;
                        
                        // 2. Insert Questions
                        const questionsToInsert = data.questions.map((q: any) => ({
                          ...q,
                          package_id: pkgData.id
                        }));
                        
                        const { error: qError } = await supabase!.from('tryout_questions').insert(questionsToInsert);
                        if (qError) throw qError;
                        
                        toast.success("Import Berhasil! " + questionsToInsert.length + " soal ditambahkan.");
                        setCurrentView('dashboard');
                        fetchPackages();
                        setSelectedJsonFile(null);
                      } catch (err: any) {
                        toast.error("Gagal Import: " + err.message);
                      } finally {
                        setLoading(false);
                      }
                    };
                    reader.readAsText(selectedJsonFile);
                  }}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Proses Import Sekarang"}
                </Button>
              </div>
            )}

            {currentView === 'edit-package' && selectedPackageId && (
              <AdminPackageEditorView packageId={selectedPackageId} onBack={() => { setCurrentView('sales-packages'); fetchSalesPackages(); }} />
            )}
            {currentView === 'edit-questions' && selectedPackageId && (
              <AdminQuestionEditorView packageId={selectedPackageId} onBack={() => { setCurrentView('dashboard'); fetchPackages(); }} />
            )}
            {currentView === 'edit-product' && (
              <AdminProductEditorView packageId={selectedProductId} onBack={() => { setCurrentView('sales-packages'); setSelectedProductId(null); fetchSalesPackages(); }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
