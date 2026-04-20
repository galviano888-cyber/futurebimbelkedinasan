import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Play, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Package, 
  Calendar,
  Layout,
  ExternalLink,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface PackageContent {
  id: string;
  type: 'file' | 'video' | 'tryout';
  title: string;
  url?: string;
  tryout_id?: string;
  zoom_link?: string;
  recording_url?: string;
  order_index: number;
}

interface UserPackage {
  id: string;
  package_id: string;
  title: string;
  description: string;
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF';
  contents: PackageContent[];
}

interface PaketSayaViewProps {
  onStartTryout: (packageId: string, tryoutId: string) => void;
}

export function PaketSayaView({ onStartTryout }: PaketSayaViewProps) {
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<UserPackage | null>(null);
  const [activeTab, setActiveTab] = useState<'materi' | 'tryout'>('tryout');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPackages();
  }, []);

  const fetchUserPackages = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('user_packages')
        .select(`
          id,
          package_id,
          packages (
            id,
            title,
            description,
            product_type,
            package_contents (*)
          )
        `)
        .eq('user_id', userData.user.id);

      if (error) throw error;

      const formatted = data.map((item: any) => ({
        id: item.id,
        package_id: item.package_id,
        title: item.packages.title,
        description: item.packages.description,
        product_type: item.packages.product_type,
        contents: (item.packages.package_contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setPackages(formatted);
      if (formatted.length > 0) {
        setSelectedPkg(formatted[0]);
        // Default ke materi jika paket intensif
        if (formatted[0].product_type === 'INTENSIF') setActiveTab('materi');
      }
    } catch (err) {
      console.error("Error fetching user packages:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-blue-400/20 rounded-full animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold mt-6 tracking-wide uppercase text-[10px]">Menyiapkan Ruang Belajar...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
          <Package className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Belum Ada Paket Aktif</h3>
        <p className="text-slate-500 mt-2 max-w-sm text-sm">
          Sepertinya kamu belum memiliki paket belajar. Jelajahi katalog dan mulai perjalanan suksesmu sekarang!
        </p>
        <button 
          onClick={() => window.location.hash = '#katalog'}
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Lihat Katalog
        </button>
      </div>
    );
  }

  const materiContents = selectedPkg?.contents.filter(c => c.type !== 'tryout') || [];
  const tryoutContents = selectedPkg?.contents.filter(c => c.type === 'tryout') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Layout className="w-8 h-8 text-blue-500" />
            Ruang Belajarku
          </h1>
          <p className="text-slate-500 text-sm mt-1">Lanjutkan belajarmu dan raih target skor maksimal.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
             <Award className="w-5 h-5 text-emerald-400" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Belajar</p>
             <p className="text-xs font-bold text-white">Siswa Aktif FBK</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR: Daftar Paket (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Paket Yang Kamu Miliki</h2>
          <div className="space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => {
                  setSelectedPkg(pkg);
                  if (pkg.product_type === 'INTENSIF') setActiveTab('materi');
                  else setActiveTab('tryout');
                }}
                className={`w-full text-left p-6 rounded-[2rem] transition-all duration-300 border-2 group relative overflow-hidden ${
                  selectedPkg?.id === pkg.id 
                  ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 text-white translate-x-2' 
                  : 'bg-white border-slate-100 hover:border-blue-500/30 text-slate-400 hover:text-slate-600 hover:shadow-lg'
                }`}
              >
                {selectedPkg?.id === pkg.id && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                  />
                )}
                <div className="relative z-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-2 inline-block ${
                    selectedPkg?.id === pkg.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pkg.product_type}
                  </span>
                  <h3 className="font-black leading-tight text-lg mb-1">{pkg.title}</h3>
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    selectedPkg?.id === pkg.id ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    <BookOpen className="w-3.5 h-3.5" />
                    {pkg.contents.length} Konten Belajar
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT: Isi Paket (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPkg && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              {/* Header Paket & Tabs */}
              <div className="p-8 pb-0 border-b border-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 leading-none">{selectedPkg.title}</h2>
                    <p className="text-slate-500 text-sm">{selectedPkg.description || "Selamat belajar! Fokus dan raih hasil terbaik."}</p>
                  </div>
                </div>

                {/* Navigasi Tab */}
                <div className="flex gap-8">
                  {selectedPkg.product_type === 'INTENSIF' && (
                    <button
                      onClick={() => setActiveTab('materi')}
                      className={`pb-4 text-sm font-black tracking-wide transition-all relative ${
                        activeTab === 'materi' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Materi & Live Class
                      {activeTab === 'materi' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('tryout')}
                    className={`pb-4 text-sm font-black tracking-wide transition-all relative ${
                      activeTab === 'tryout' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Daftar Tryout
                    {activeTab === 'tryout' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                  </button>
                </div>
              </div>

              {/* List Konten */}
              <div className="flex-1 p-8 bg-slate-50/50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedPkg.id}-${activeTab}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {activeTab === 'materi' ? (
                      materiContents.length > 0 ? (
                        materiContents.map((content) => (
                          <div 
                            key={content.id}
                            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                content.type === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {content.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-700 text-sm leading-tight group-hover:text-blue-600 transition-colors">{content.title}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1 flex items-center gap-2">
                                  {content.type === 'video' ? (
                                    <> <Calendar className="w-3 h-3" /> Live Class / Rekaman </>
                                  ) : (
                                    <> <FileText className="w-3 h-3" /> E-Book PDF </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                               {content.zoom_link && (
                                 <a 
                                   href={content.zoom_link} target="_blank" rel="noreferrer"
                                   className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2"
                                 >
                                   <Video className="w-3 h-3" /> MASUK ZOOM
                                 </a>
                               )}
                               {(content.recording_url || content.url) && (
                                 <a 
                                   href={content.recording_url || content.url} target="_blank" rel="noreferrer"
                                   className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                                 >
                                   <ExternalLink className="w-3 h-3" /> {content.type === 'video' ? 'REKAMAN' : 'DOWNLOAD'}
                                 </a>
                               )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center">
                           <Loader2 className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-4" />
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Materi sedang disiapkan oleh tutor...</p>
                        </div>
                      )
                    ) : (
                      tryoutContents.length > 0 ? (
                        tryoutContents.map((content) => (
                          <div 
                            key={content.id}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Award className="w-7 h-7" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{content.title}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                   <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                                     <Clock className="w-3.5 h-3.5" /> 100 Menit
                                   </span>
                                   <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase">
                                     <CheckCircle2 className="w-3.5 h-3.5" /> 110 Soal SKD
                                   </span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                // Pakai "Jalur Ganda": package_id buat dashboard, content.tryout_id/id buat soal
                                if (selectedPkg.package_id && (content.tryout_id || content.id)) {
                                  onStartTryout(selectedPkg.package_id, content.tryout_id || content.id);
                                } else {
                                  alert("Gagal memuat Tryout: Data paket atau soal tidak lengkap.");
                                }
                              }}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
                            >
                              <Play className="w-4 h-4" /> MULAI TRYOUT
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center">
                           <Loader2 className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-4" />
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada tryout di paket ini.</p>
                        </div>
                      )
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Info */}
              <div className="p-6 bg-slate-50 text-slate-400 text-[10px] font-bold text-center uppercase tracking-widest">
                Pastikan koneksi internet stabil saat mengerjakan tryout atau masuk Live Class.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
