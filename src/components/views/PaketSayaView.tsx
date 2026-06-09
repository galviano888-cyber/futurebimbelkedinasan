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
  Layout,
  ExternalLink,
  Award,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PackageContent {
  id: string;
  type: 'file' | 'video' | 'tryout';
  title: string;
  url?: string;
  tryout_id?: string;
  zoom_link?: string;
  recording_url?: string;
  live_schedule?: string;
  schedule_date?: string;
  mentor_name?: string;
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
  const navigate = useNavigate();
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<UserPackage | null>(null);
  const [activeTab, setActiveTab] = useState<'materi' | 'liveclass' | 'tryout'>('tryout');
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
            package_contents (
              id,
              type,
              title,
              url,
              zoom_link,
              recording_url,
              live_schedule,
              schedule_date,
              mentor_name,
              tryout_id,
              order_index
            )
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
        if (formatted[0].product_type === 'INTENSIF') setActiveTab('liveclass');
        else setActiveTab('tryout');
      }
    } catch (err: any) {
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
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-6 tracking-wide uppercase text-[10px]">Menyiapkan Ruang Belajar...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 shadow-inner">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Belum Ada Paket Aktif</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
          Sepertinya kamu belum memiliki paket belajar. Jelajahi katalog dan mulai perjalanan suksesmu sekarang!
        </p>
        <button 
          onClick={() => navigate('/paket')}
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Lihat Katalog
        </button>
      </div>
    );
  }

  const liveClassContents = selectedPkg?.contents.filter(c => c.type === 'video') || [];
  const materiContents = selectedPkg?.contents.filter(c => c.type === 'file') || [];
  const tryoutContents = selectedPkg?.contents.filter(c => c.type === 'tryout') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            <Layout className="w-8 h-8 text-blue-500" />
            Ruang Belajarku
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lanjutkan belajarmu dan raih target skor maksimal.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
             <Award className="w-5 h-5 text-emerald-400" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status Belajar</p>
             <p className="text-xs font-bold text-slate-800 dark:text-white">Siswa Aktif FBK</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR: Daftar Paket (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Paket Yang Kamu Miliki</h2>
          <div className="space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => {
                  setSelectedPkg(pkg);
                  if (pkg.product_type === 'INTENSIF') setActiveTab('liveclass');
                  else setActiveTab('tryout');
                }}
                className={`w-full text-left p-6 rounded-[2rem] transition-all duration-300 border-2 group relative overflow-hidden ${
                  selectedPkg?.id === pkg.id 
                  ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 text-white translate-x-2' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:shadow-lg'
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
                    selectedPkg?.id === pkg.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {pkg.product_type}
                  </span>
                  <h3 className="font-black leading-tight text-lg mb-1">{pkg.title}</h3>
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    selectedPkg?.id === pkg.id ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
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
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              {/* Header Paket & Tabs */}
              <div className="p-8 pb-0 border-b border-slate-50 dark:border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{selectedPkg.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedPkg.description || "Selamat belajar! Fokus dan raih hasil terbaik."}</p>
                  </div>
                </div>

                {/* Navigasi Tab */}
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {selectedPkg.product_type === 'INTENSIF' && (
                    <>
                      <button
                        onClick={() => setActiveTab('liveclass')}
                        className={`pb-4 text-sm font-black tracking-wide transition-all relative whitespace-nowrap ${
                          activeTab === 'liveclass' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        Live Class
                        {activeTab === 'liveclass' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                      </button>
                      <button
                        onClick={() => setActiveTab('materi')}
                        className={`pb-4 text-sm font-black tracking-wide transition-all relative whitespace-nowrap ${
                          activeTab === 'materi' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        E-Book Materi
                        {activeTab === 'materi' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveTab('tryout')}
                    className={`pb-4 text-sm font-black tracking-wide transition-all relative whitespace-nowrap ${
                      activeTab === 'tryout' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Daftar Tryout
                    {activeTab === 'tryout' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                  </button>
                </div>
              </div>

              {/* List Konten */}
              <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-950/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedPkg.id}-${activeTab}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {activeTab === 'liveclass' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Video className="w-5 h-5 text-blue-600" />
                            Daftar Live Class
                          </h3>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => fetchUserPackages()}
                              className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase transition-colors"
                            >
                              <Loader2 className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
                              Refresh Data
                            </button>
                          </div>
                        </div>
                        
                        {/* Mobile Live Class View */}
                        <div className="md:hidden space-y-4">
                          {liveClassContents.length > 0 ? (
                            liveClassContents.map((content) => (
                              <div key={content.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{content.schedule_date || content.live_schedule || "EMPTY"}</span>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{content.title}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{content.mentor_name || 'Mentor FBK'}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {content.zoom_link && (
                                    <a href={content.zoom_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                      <Video className="w-3.5 h-3.5" /> ZOOM
                                    </a>
                                  )}
                                  {content.recording_url && (
                                    <a href={content.recording_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                      <Play className="w-3.5 h-3.5" /> REKAMAN
                                    </a>
                                  )}
                                </div>

                                {content.tryout_id && (
                                  <button 
                                    onClick={() => onStartTryout(selectedPkg?.package_id || '', content.tryout_id || '')}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                  >
                                    <Zap className="w-3.5 h-3.5" /> KERJAKAN MINI TES
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                               <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Jadwal Sedang Disiapkan</p>
                            </div>
                          )}
                        </div>

                        {/* Desktop Live Class View */}
                        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-800 text-white">
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Jadwal</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest">Judul</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Mini Tes</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Zoom/Youtube</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Rekaman</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {liveClassContents.length > 0 ? (
                                  liveClassContents.map((content) => (
                                    <tr key={content.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                      <td className="p-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-black text-slate-900 dark:text-white">
                                            {content.schedule_date || content.live_schedule || "EMPTY"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-4 min-w-[200px]">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-blue-600 transition-colors">{content.title}</span>
                                          <span className="text-[10px] font-black text-slate-400 uppercase mt-1">{content.mentor_name || 'Mentor FBK'}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-center">
                                        {content.tryout_id ? (
                                          <button 
                                            onClick={() => onStartTryout(selectedPkg?.package_id || '', content.tryout_id || '')}
                                            className="inline-flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                                          >
                                            <Zap className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">Kerjakan</span>
                                          </button>
                                        ) : (
                                          <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center">
                                        {content.zoom_link ? (
                                          <a href={content.zoom_link} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors">
                                            <Video className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">Masuk</span>
                                          </a>
                                        ) : (
                                          <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center">
                                        {content.recording_url ? (
                                          <a href={content.recording_url} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors">
                                            <Play className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">Lihat</span>
                                          </a>
                                        ) : (
                                          <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                      <Loader2 className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-spin mx-auto mb-4" />
                                      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Jadwal Live Class sedang disiapkan...</p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'materi' && (
                      <div className="space-y-3 lg:space-y-4">
                        {materiContents.length > 0 ? (
                          materiContents.map((content) => (
                            <div 
                              key={content.id}
                              className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-4 lg:gap-5">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                                  <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-700 dark:text-white text-xs lg:text-sm leading-tight group-hover:text-blue-600 transition-colors">{content.title}</h4>
                                  <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> E-Book PDF
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                 {content.url && (
                                   <a 
                                     href={content.url} target="_blank" rel="noreferrer"
                                     className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] lg:text-[10px] font-black rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                   >
                                     <ExternalLink className="w-3 h-3" /> DOWNLOAD
                                   </a>
                                 )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center">
                             <Loader2 className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-spin mx-auto mb-4" />
                             <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Materi sedang disiapkan oleh tutor...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'tryout' && (
                      <div className="space-y-3 lg:space-y-4">
                        {tryoutContents.length > 0 ? (
                          tryoutContents.map((content) => (
                            <div 
                              key={content.id}
                              className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-4 lg:gap-5">
                                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <Award className="w-6 h-6 lg:w-7 lg:h-7" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 dark:text-white text-sm lg:text-base leading-tight group-hover:text-blue-600 transition-colors">{content.title}</h4>
                                  <div className="flex items-center gap-3 lg:gap-4 mt-2">
                                     <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[9px] lg:text-[10px] font-black uppercase">
                                       <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> 100 Menit
                                     </span>
                                     <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[9px] lg:text-[10px] font-black uppercase">
                                       <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> 110 Soal
                                     </span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  if (selectedPkg?.package_id && (content.tryout_id || content.id)) {
                                    onStartTryout(selectedPkg.package_id, content.tryout_id || content.id);
                                  } else {
                                    toast.error("Gagal memuat Tryout: Data paket atau soal tidak lengkap.");
                                  }
                                }}
                                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] lg:text-xs font-black rounded-xl lg:rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
                              >
                                <Play className="w-4 h-4" /> MULAI TRYOUT
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center">
                             <Loader2 className="w-8 h-8 text-slate-200 dark:text-slate-800 animate-spin mx-auto mb-4" />
                             <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Tidak ada tryout di paket ini.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Info */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-[10px] font-bold text-center uppercase tracking-widest">
                <div className="flex items-center justify-center gap-2">
                   <Zap className="w-3 h-3 text-yellow-500" />
                   Pastikan koneksi internet stabil saat mengerjakan tryout atau masuk Live Class.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
