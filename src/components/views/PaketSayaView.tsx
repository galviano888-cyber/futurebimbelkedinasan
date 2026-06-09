import { useState, useEffect } from "react";
import { BookOpen, Video, FileText, Play, Clock, CheckCircle2, Loader2, Package, ExternalLink, Award, Zap, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PackageContent {
  id: string; type: 'file' | 'video' | 'tryout'; title: string; url?: string;
  tryout_id?: string; zoom_link?: string; recording_url?: string;
  live_schedule?: string; schedule_date?: string; mentor_name?: string; order_index: number;
}
interface UserPackage {
  id: string; package_id: string; title: string; description: string;
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF'; contents: PackageContent[];
  guide_text?: string; guide_url?: string;
}
interface PaketSayaViewProps { onStartTryout: (packageId: string, tryoutId: string) => void; }

export function PaketSayaView({ onStartTryout }: PaketSayaViewProps) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<UserPackage | null>(null);
  const [activeTab, setActiveTab] = useState<'materi' | 'liveclass' | 'tryout'>('tryout');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUserPackages(); }, []);

  const fetchUserPackages = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase.from('user_packages')
        .select(`id, package_id, packages (id, title, description, product_type, guide_text, guide_url, package_contents (id, type, title, url, zoom_link, recording_url, live_schedule, schedule_date, mentor_name, tryout_id, order_index))`)
        .eq('user_id', userData.user.id);
      if (error) throw error;
      const formatted = data.map((item: any) => ({
        id: item.id, package_id: item.package_id, title: item.packages.title,
        description: item.packages.description, product_type: item.packages.product_type,
        guide_text: item.packages.guide_text || '', guide_url: item.packages.guide_url || '',
        contents: (item.packages.package_contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));
      setPackages(formatted);
      if (formatted.length > 0) {
        setSelectedPkg(formatted[0]);
        setActiveTab(formatted[0].product_type === 'INTENSIF' ? 'liveclass' : 'tryout');
      }
    } catch (err: any) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px] gap-4">
      <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
      <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-widest">Menyiapkan Ruang Belajar...</p>
    </div>
  );

  if (packages.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-5">
        <Package className="w-7 h-7 text-slate-300 dark:text-slate-700" />
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Belum Ada Paket Aktif</h3>
      <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-sm text-sm">Anda belum memiliki paket belajar. Jelajahi katalog dan mulai persiapan Anda sekarang.</p>
      <button onClick={() => navigate('/paket')} className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
        <Zap className="w-4 h-4" /> Lihat Katalog
      </button>
    </div>
  );

  const liveClassContents = selectedPkg?.contents.filter(c => c.type === 'video') || [];
  const materiContents = selectedPkg?.contents.filter(c => c.type === 'file') || [];
  const tryoutContents = selectedPkg?.contents.filter(c => c.type === 'tryout') || [];
  const tabs = [
    ...(selectedPkg?.product_type === 'INTENSIF' ? [
      { id: 'liveclass' as const, label: 'Live Class', icon: Video },
      { id: 'materi' as const, label: 'E-Book Materi', icon: FileText },
    ] : []),
    { id: 'tryout' as const, label: 'Daftar Tryout', icon: Award },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2">Ruang Belajar</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Paket Saya</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Lanjutkan belajarmu dan raih target skor maksimal.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none">Status</p>
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">Siswa Aktif FBK</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Paket Yang Dimiliki</p>
          <div className="space-y-2">
            {packages.map((pkg) => (
              <button key={pkg.id}
                onClick={() => { setSelectedPkg(pkg); setActiveTab(pkg.product_type === 'INTENSIF' ? 'liveclass' : 'tryout'); }}
                className={cn(
                  "w-full text-left p-5 rounded-2xl transition-all duration-200 border group",
                  selectedPkg?.id === pkg.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
                    : 'bg-white dark:bg-[#0d0d14] border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-2",
                      selectedPkg?.id === pkg.id
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-600'
                    )}>{pkg.product_type}</span>
                    <h3 className={cn("font-black text-sm leading-tight", selectedPkg?.id === pkg.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white')}>{pkg.title}</h3>
                    <div className={cn("flex items-center gap-1.5 mt-1.5 text-[10px] font-bold", selectedPkg?.id === pkg.id ? 'text-indigo-500 dark:text-indigo-400/70' : 'text-slate-400 dark:text-slate-600')}>
                      <BookOpen className="w-3 h-3" /> {pkg.contents.length} Konten Belajar
                    </div>
                  </div>
                  {selectedPkg?.id === pkg.id && <ChevronRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          {selectedPkg && (
            <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{selectedPkg.title}</h2>
                <p className="text-slate-500 dark:text-slate-500 text-sm">{selectedPkg.description || "Selamat belajar! Fokus dan raih hasil terbaik."}</p>
                <div className="flex gap-1 mt-5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-1 rounded-xl w-fit">
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === tab.id
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                          : 'text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={`${selectedPkg.id}-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">

                    {activeTab === 'liveclass' && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Jadwal Live Class</p>
                          <button onClick={fetchUserPackages} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg text-[10px] font-black uppercase transition-colors">
                            <Loader2 className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
                          </button>
                        </div>
                        <div className="md:hidden space-y-3">
                          {liveClassContents.length > 0 ? liveClassContents.map((content) => (
                            <div key={content.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-5 rounded-xl space-y-4">
                              <div>
                                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{content.schedule_date || content.live_schedule || "SEGERA"}</span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-1">{content.title}</h4>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase mt-0.5">{content.mentor_name || 'Mentor FBK'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {content.zoom_link && <a href={content.zoom_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase"><Video className="w-3.5 h-3.5" /> Zoom</a>}
                                {content.recording_url && <a href={content.recording_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase"><Play className="w-3.5 h-3.5" /> Rekaman</a>}
                              </div>
                              {content.tryout_id && <button onClick={() => onStartTryout(selectedPkg?.package_id || '', content.tryout_id || '')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase"><Zap className="w-3.5 h-3.5" /> Mini Tes</button>}
                            </div>
                          )) : <div className="py-12 text-center bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl"><p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">Jadwal Sedang Disiapkan</p></div>}
                        </div>
                        <div className="hidden md:block bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead><tr className="border-b border-slate-200 dark:border-white/5">
                              {['Jadwal','Judul','Mini Tes','Zoom','Rekaman'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{h}</th>)}
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                              {liveClassContents.length > 0 ? liveClassContents.map((content) => (
                                <tr key={content.id} className="hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-4 py-3"><span className="text-xs font-black text-slate-900 dark:text-white">{content.schedule_date || content.live_schedule || "—"}</span></td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-slate-700 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{content.title}</span><span className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase mt-0.5">{content.mentor_name || 'Mentor FBK'}</span></td>
                                  <td className="px-4 py-3 text-center">{content.tryout_id ? <button onClick={() => onStartTryout(selectedPkg?.package_id || '', content.tryout_id || '')} className="inline-flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"><Zap className="w-4 h-4" /><span className="text-[9px] font-black uppercase">Kerjakan</span></button> : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}</td>
                                  <td className="px-4 py-3 text-center">{content.zoom_link ? <a href={content.zoom_link} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center gap-1 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"><Video className="w-4 h-4" /><span className="text-[9px] font-black uppercase">Masuk</span></a> : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}</td>
                                  <td className="px-4 py-3 text-center">{content.recording_url ? <a href={content.recording_url} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center gap-1 text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"><Play className="w-4 h-4" /><span className="text-[9px] font-black uppercase">Lihat</span></a> : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}</td>
                                </tr>
                              )) : <tr><td colSpan={5} className="py-16 text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">Jadwal sedang disiapkan...</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {activeTab === 'materi' && (
                      materiContents.length > 0 ? materiContents.map((content) => (
                        <div key={content.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" /></div>
                            <div><h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{content.title}</h4><p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase mt-0.5">E-Book PDF</p></div>
                          </div>
                          {content.url && <a href={content.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-[10px] font-black rounded-lg uppercase transition-all"><ExternalLink className="w-3 h-3" /> Download</a>}
                        </div>
                      )) : <div className="py-16 text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">Materi sedang disiapkan oleh tutor...</div>
                    )}

                    {activeTab === 'tryout' && (
                      tryoutContents.length > 0 ? tryoutContents.map((content) => (
                        <div key={content.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all"><Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /></div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{content.title}</h4>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase"><Clock className="w-3 h-3" /> 100 Menit</span>
                                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase"><CheckCircle2 className="w-3 h-3" /> 110 Soal</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => { if (selectedPkg?.package_id && (content.tryout_id || content.id)) { onStartTryout(selectedPkg.package_id, content.tryout_id || content.id); } else { toast.error("Gagal memuat Tryout: Data tidak lengkap."); } }}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0"
                          >
                            <Play className="w-4 h-4" /> Mulai Tryout
                          </button>
                        </div>
                      )) : <div className="py-16 text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">Tidak ada tryout di paket ini.</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {selectedPkg.product_type === 'INTENSIF' && selectedPkg.guide_url && (
                <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-500/5 border-t border-indigo-100 dark:border-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg flex items-center justify-center shrink-0"><ExternalLink className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /></div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{selectedPkg.guide_text || 'Bergabung ke Komunitas Belajar'}</p>
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400/70 font-medium">Khusus siswa paket intensif</p>
                    </div>
                  </div>
                  <a href={selectedPkg.guide_url} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-wider">
                    <ExternalLink className="w-3.5 h-3.5" /> Gabung Sekarang
                  </a>
                </div>
              )}

              <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-slate-400 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest">Pastikan koneksi stabil saat tryout atau Live Class</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
