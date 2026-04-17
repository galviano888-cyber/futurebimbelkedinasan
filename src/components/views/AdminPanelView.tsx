import { useState, useRef, useEffect } from "react";
import { Lock, LogIn, Upload, Database, Settings, Users, AlertCircle, FileJson, CheckCircle2, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { AdminPackageEditorView } from "./AdminPackageEditorView";

export function AdminPanelView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // App State
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'manual' | 'edit-package'>('dashboard');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cek sesi otomatis saat komponen dimuat
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email) {
        if (session.user.email === "admin.utama@fbk-kedinasan.com" || session.user.email === "admin.soal@fbk-kedinasan.com") {
          setEmail(session.user.email);
          setIsLoggedIn(true);
          fetchPackages();
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
                placeholder="admin@fbk-kedinasan.com"
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Admin */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-xl text-blue-400">FBK Admin</h2>
          <p className="text-xs text-slate-400 mt-1">Superadmin Access</p>
        </div>
        <div className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-colors ${currentView === 'dashboard' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Database className="w-5 h-5" />
            Bank Soal
          </button>
          <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white p-3 rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" />
            Manajemen User
          </button>
          <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white p-3 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Pengaturan
          </button>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full text-slate-400 hover:text-white text-sm font-medium p-2">
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between shrink-0">
          <h1 className="font-bold text-slate-800 text-lg">Manajemen Bank Soal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">{email}</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {currentView === 'dashboard' && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
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
                  <h2 className="text-xl font-bold text-slate-800">Daftar Paket Tryout SKD</h2>
                  <div className="flex gap-3">
                    <Button variant="outline" className="font-semibold text-slate-700 border-slate-300 hover:bg-slate-50" onClick={() => setCurrentView('manual')}>
                      <Plus className="w-4 h-4 mr-2" /> Buat Manual
                    </Button>
                    <Button className="font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setCurrentView('import'); setUploadSuccess(false); }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import JSON
                    </Button>
                  </div>
                </div>

                {packages.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-center p-16">
                    <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Database Kosong</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto mb-6">
                      Anda belum memiliki paket soal. Gunakan fitur Bulk Import menggunakan template JSON yang telah disediakan untuk mengunggah 110 soal sekaligus.
                    </p>
                    <a href="/template-soal-skd.json" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Download Template JSON
                    </a>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Paket</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Dibuat</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {packages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">{pkg.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                {pkg.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(pkg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${pkg.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {pkg.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                className="text-blue-600 hover:text-blue-900 mr-4 font-bold"
                                onClick={() => {
                                  setSelectedPackageId(pkg.id);
                                  setCurrentView('edit-package');
                                }}
                              >
                                Edit Soal
                              </button>
                              <button className="text-red-600 hover:text-red-900" onClick={async () => {
                                if (!supabase) return;
                                if(confirm('Yakin ingin menghapus paket ini?')) {
                                  await supabase.from('tryout_packages').delete().eq('id', pkg.id);
                                  fetchPackages();
                                }
                              }}>Hapus</button>
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
