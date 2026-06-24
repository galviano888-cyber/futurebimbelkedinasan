import { useState, useEffect } from "react";
import { BookOpen, Video, FileText, Play, Clock, CheckCircle2, Loader2, Package, ExternalLink, Award, ChevronLeft, BookMarked, Check, ChevronDown } from "lucide-react";

function ExpandableDesc({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const items = text.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0);
  const isLong = items.length > 3;
  const visible = !expanded && isLong ? items.slice(0, 3) : items;
  return (
    <div className="mb-3 flex-1 space-y-1.5">
      {visible.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-px">
            <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" strokeWidth={3} />
          </span>
          <span className="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">{item}</span>
        </div>
      ))}
      {isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 mt-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          {expanded ? "Sembunyikan" : `+${items.length - 3} lainnya`}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PackageContent {
  id: string; type: "file" | "video" | "tryout"; title: string; url?: string;
  tryout_id?: string; zoom_link?: string; recording_url?: string;
  live_schedule?: string; schedule_date?: string; mentor_name?: string; order_index: number;
}
interface UserPackage {
  id: string; package_id: string; title: string; description: string;
  product_type: "SATUAN" | "BUNDLE" | "INTENSIF"; contents: PackageContent[];
  guide_text?: string; guide_url?: string; cover_image_url?: string | null;
}
interface PaketSayaViewProps { onStartTryout: (packageId: string, tryoutId: string) => void; }

const TYPE_LABEL: Record<string, string> = { SATUAN: "Tryout Satuan", BUNDLE: "Bundle Tryout", INTENSIF: "Paket Intensif" };
const TYPE_COLOR: Record<string, string> = {
  SATUAN: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  BUNDLE: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  INTENSIF: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
};export function PaketSayaView({ onStartTryout }: PaketSayaViewProps) {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<UserPackage | null>(null);
  const [activeTab, setActiveTab] = useState<"materi" | "liveclass" | "tryout">("tryout");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUserPackages(); }, []);

  const fetchUserPackages = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase.from("user_packages")
        .select("id, package_id, packages (id, title, description, product_type, guide_text, guide_url, cover_image_url, package_contents (id, type, title, url, zoom_link, recording_url, live_schedule, schedule_date, mentor_name, tryout_id, order_index))")
        .eq("user_id", userData.user.id);
      if (error) throw error;
      const formatted = data.map((item: any) => ({
        id: item.id, package_id: item.package_id, title: item.packages.title,
        description: item.packages.description, product_type: item.packages.product_type,
        guide_text: item.packages.guide_text || "", guide_url: item.packages.guide_url || "",
        cover_image_url: item.packages.cover_image_url || null,
        contents: (item.packages.package_contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));
      setPackages(formatted);
    } catch (err: any) {
      toast.error("Gagal memuat paket", { description: "Silakan refresh halaman." });
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      <p className="text-slate-400 text-[12px]">Menyiapkan ruang belajar...</p>
    </div>
  );

  if (packages.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-5">
        <Package className="w-7 h-7 text-slate-300 dark:text-slate-700" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Paket Aktif</h3>
      <p className="text-slate-500 mt-2 max-w-sm text-sm">Jelajahi katalog dan mulai persiapanmu sekarang.</p>
      <button onClick={() => navigate("/paket")} className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all">
        Lihat Katalog
      </button>
    </div>
  );  if (selectedPkg) {
    const liveCC = selectedPkg.contents.filter(c => c.type === "video");
    const matC = selectedPkg.contents.filter(c => c.type === "file");
    const toC = selectedPkg.contents.filter(c => c.type === "tryout");
    const tabs = [
      ...(selectedPkg.product_type === "INTENSIF" ? [
        { id: "liveclass" as const, label: "Live Class", icon: Video, count: liveCC.length },
        { id: "materi" as const, label: "Materi", icon: FileText, count: matC.length },
      ] : []),
      { id: "tryout" as const, label: "Tryout", icon: Award, count: toC.length },
    ];
    return (
      <div className="animate-in fade-in duration-300">
        <button onClick={() => setSelectedPkg(null)} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Paket Saya
        </button>
        {selectedPkg.cover_image_url ? (
          <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.07] mb-6">
            <img src={selectedPkg.cover_image_url} alt={selectedPkg.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display="none"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{selectedPkg.title}</h1>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <BookMarked className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-block mb-1.5", TYPE_COLOR[selectedPkg.product_type])}>{TYPE_LABEL[selectedPkg.product_type]}</span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedPkg.title}</h1>
              {selectedPkg.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedPkg.description}</p>}
            </div>
          </div>
        )}
        {selectedPkg.cover_image_url && selectedPkg.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{selectedPkg.description}</p>}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] p-1 rounded-xl mb-5 w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md",
                activeTab === tab.id ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-slate-200 dark:bg-white/[0.06] text-slate-500"
              )}>{tab.count}</span>
            </button>
          ))}
        </div>        <AnimatePresence mode="wait">
          <motion.div key={selectedPkg.id + activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-3">
            {activeTab === "liveclass" && (
              liveCC.length > 0 ? (
                <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[520px]"><thead><tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    {["Jadwal","Judul / Mentor","Zoom","Rekaman","Mini Tes"].map(h => <th key={h} className="px-5 py-3.5 text-left text-[11px] font-medium text-slate-400">{h}</th>)}
                  </tr></thead><tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                    {liveCC.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-[12px] text-slate-500 whitespace-nowrap">{c.schedule_date || c.live_schedule || "--"}</td>
                        <td className="px-5 py-4"><p className="text-[13.5px] font-medium text-slate-800 dark:text-white">{c.title}</p><p className="text-[11px] text-slate-400 mt-0.5">{c.mentor_name || "Mentor FBK"}</p></td>
                        <td className="px-5 py-4">{c.zoom_link ? <a href={c.zoom_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[12px] font-medium rounded-lg border border-blue-100 dark:border-blue-500/20"><Video className="w-3.5 h-3.5" /> Masuk</a> : <span className="text-slate-300 text-xs">--</span>}</td>
                        <td className="px-5 py-4">{c.recording_url ? <a href={c.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 text-[12px] font-medium rounded-lg border border-purple-100 dark:border-purple-500/20"><Play className="w-3.5 h-3.5" /> Lihat</a> : <span className="text-slate-300 text-xs">--</span>}</td>
                        <td className="px-5 py-4">{c.tryout_id ? <button onClick={() => onStartTryout(selectedPkg.package_id, c.tryout_id!)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[12px] font-medium rounded-lg border border-emerald-100 dark:border-emerald-500/20"><Award className="w-3.5 h-3.5" /> Kerjakan</button> : <span className="text-slate-300 text-xs">--</span>}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              ) : <div className="py-16 text-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl"><Video className="w-8 h-8 text-slate-300 mx-auto mb-3" /><p className="text-[13px] text-slate-400">Jadwal sedang disiapkan.</p></div>
            )}
            {activeTab === "materi" && (
              matC.length > 0 ? matC.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 p-5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-xl hover:border-blue-200 dark:hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-blue-500" /></div>
                    <div><h4 className="font-medium text-slate-900 dark:text-white text-[14px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.title}</h4><p className="text-[11px] text-slate-400 mt-0.5">E-Book PDF</p></div>
                  </div>
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 text-[12px] font-medium rounded-xl transition-all shrink-0"><ExternalLink className="w-3.5 h-3.5" /> Download</a>}
                </div>
              )) : <div className="py-16 text-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl"><FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" /><p className="text-[13px] text-slate-400">Materi sedang disiapkan.</p></div>
            )}
            {activeTab === "tryout" && (
              toC.length > 0 ? toC.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-xl hover:border-blue-200 dark:hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center shrink-0"><Award className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white text-[14px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.title}</h4>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> 100 Menit</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400"><CheckCircle2 className="w-3 h-3" /> 110 Soal</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { if (selectedPkg?.package_id && (c.tryout_id || c.id)) { onStartTryout(selectedPkg.package_id, c.tryout_id || c.id); } else { toast.error("Data tidak lengkap."); } }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/25 shrink-0">
                    <Play className="w-4 h-4" /> Mulai Tryout
                  </button>
                </div>
              )) : <div className="py-16 text-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl"><Award className="w-8 h-8 text-slate-300 mx-auto mb-3" /><p className="text-[13px] text-slate-400">Tidak ada tryout.</p></div>
            )}
          </motion.div>
        </AnimatePresence>
        {selectedPkg.product_type === "INTENSIF" && selectedPkg.guide_url && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl">
            <div><p className="text-[13.5px] font-medium text-slate-800 dark:text-white">{selectedPkg.guide_text || "Bergabung ke Komunitas Belajar"}</p><p className="text-[11px] text-blue-500 mt-0.5">Khusus siswa paket intensif</p></div>
            <a href={selectedPkg.guide_url} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-all"><ExternalLink className="w-3.5 h-3.5" /> Gabung</a>
          </div>
        )}
      </div>
    );
  }  // ─── DAFTAR PAKET ─────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-7">
        <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em] mb-2">Paket Saya</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ruang Belajar</h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1 font-medium">{packages.length} paket aktif terdaftar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map((pkg) => {
          const tryoutCount = pkg.contents.filter(c => c.type === "tryout").length;
          const materiCount = pkg.contents.filter(c => c.type === "file").length;
          const liveCount = pkg.contents.filter(c => c.type === "video").length;
          return (
            <div key={pkg.id} className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-hidden flex flex-col hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-lg hover:shadow-slate-900/[0.06] transition-all duration-300 group">
              {pkg.cover_image_url ? (
                <div className="relative h-40 overflow-hidden shrink-0">
                  <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display="none"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : null}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-snug mb-3">{pkg.title}</h3>
                {pkg.description && <ExpandableDesc text={pkg.description} />}
                <div className="flex items-center gap-4 py-3 border-t border-slate-100 dark:border-white/[0.06] mb-4">
                  {tryoutCount > 0 && <div className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-400" /><span className="text-[11px] text-slate-500 dark:text-slate-400">{tryoutCount} Tryout</span></div>}
                  {liveCount > 0 && <div className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-purple-400" /><span className="text-[11px] text-slate-500 dark:text-slate-400">{liveCount} Live</span></div>}
                  {materiCount > 0 && <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[11px] text-slate-500 dark:text-slate-400">{materiCount} Materi</span></div>}
                </div>
                <button
                  onClick={() => { setSelectedPkg(pkg); setActiveTab(pkg.product_type === "INTENSIF" ? "liveclass" : "tryout"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13.5px] font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/25 active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" /> Buka Paket
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}