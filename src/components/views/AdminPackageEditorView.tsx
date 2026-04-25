import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, UploadCloud, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminPackageEditorViewProps {
  packageId: string;
  onBack: () => void;
}

export function AdminPackageEditorView({ packageId, onBack }: AdminPackageEditorViewProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [tryouts, setTryouts] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    fetchPackageDetails();
    fetchTryouts();
  }, [packageId]);

  const fetchTryouts = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('tryout_packages').select('id, title');
    setTryouts(data || []);
  };

  const fetchPackageDetails = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*, contents:package_contents(*)')
        .eq('id', packageId)
        .single();

      if (error) throw error;
      setPkg(data);
      setTempName(data.title);
      
      const sortedContents = (data.contents || []).sort((a: any, b: any) => a.order_index - b.order_index);
      setQuestions(sortedContents);
      
      // Maintain active question if it exists, otherwise default to first
      if (sortedContents.length > 0) {
        if (activeQuestion) {
          const current = sortedContents.find((q: any) => q.id === activeQuestion.id);
          if (current) setActiveQuestion(current);
          else setActiveQuestion(sortedContents[0]);
        } else {
          setActiveQuestion(sortedContents[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching package details:", err);
      toast.error("Gagal mengambil detail paket");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePackageName = async () => {
    if (!supabase || !tempName.trim()) return;
    try {
      const { error } = await supabase
        .from('packages')
        .update({ title: tempName })
        .eq('id', packageId);

      if (error) throw error;
      setPkg({ ...pkg, title: tempName });
      setIsEditingName(false);
      toast.success("Nama paket berhasil diperbarui");
    } catch (err) {
      toast.error("Gagal memperbarui nama paket");
    }
  };

  const handleSaveQuestion = async () => {
    if (!supabase || !activeQuestion) return;
    try {
      setSaving(true);
      console.log("DEBUG - Saving Payload:", {
        title: activeQuestion.title,
        url: activeQuestion.url,
        type: activeQuestion.type,
        zoom_link: activeQuestion.zoom_link,
        recording_url: activeQuestion.recording_url,
        live_schedule: activeQuestion.live_schedule,
        mentor_name: activeQuestion.mentor_name,
        tryout_id: activeQuestion.tryout_id
      });

      const payload = {
        title: activeQuestion.title,
        url: activeQuestion.url,
        type: activeQuestion.type,
        zoom_link: activeQuestion.zoom_link,
        recording_url: activeQuestion.recording_url,
        live_schedule: activeQuestion.live_schedule,
        mentor_name: activeQuestion.live_schedule ? `[SCHEDULE]: ${activeQuestion.live_schedule}` : activeQuestion.mentor_name,
        tryout_id: activeQuestion.tryout_id
      };

      console.log("SENDING TO SUPABASE:", payload);
      console.log("DEBUG - Mengirim Data: ", payload);

      const { error } = await supabase
        .from('package_contents')
        .update(payload)
        .eq('id', activeQuestion.id);

      if (error) throw error;
      toast.success("Konten berhasil disimpan");
      fetchPackageDetails();
    } catch (err: any) {
      console.error("DEBUG - Save Error:", err);
      toast.error(`Gagal menyimpan: ${err.message || 'Cek koneksi/database'}`);
      if (err.message?.includes('column')) {
        toast.error("Database belum siap. Jalankan SQL Migration yang saya berikan!", { duration: 5000 });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!supabase) return;
    try {
      const newOrder = questions.length + 1;
      const { data, error } = await supabase
        .from('package_contents')
        .insert([{
          package_id: packageId,
          title: "Konten Baru",
          type: 'video',
          order_index: newOrder
        }])
        .select()
        .single();

      if (error) throw error;
      setQuestions([...questions, data]);
      setActiveQuestion(data);
      toast.success("Konten baru ditambahkan");
    } catch (err) {
      toast.error("Gagal menambah konten");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Button>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                className="text-2xl font-bold bg-white border border-blue-500 rounded px-2 py-1 outline-none"
                autoFocus
              />
              <Button size="sm" onClick={handleUpdatePackageName}><Check className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setTempName(pkg.title); }}><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              {pkg?.title}
              <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)}><Edit2 className="w-4 h-4" /></Button>
            </h1>
          )}
        </div>
        <Button onClick={handleSaveQuestion} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Semua Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Konten */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-600">Daftar Konten</h3>
              <Button size="sm" variant="outline" onClick={handleAddQuestion}>Tambah</Button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(q)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-slate-50 transition-all flex items-center gap-3",
                    activeQuestion?.id === q.id ? "bg-blue-50 border-r-4 border-blue-500" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    q.type === 'video' ? "bg-blue-100 text-blue-600" :
                    q.type === 'file' ? "bg-emerald-100 text-emerald-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    {q.type === 'video' ? <PlayIcon className="w-4 h-4" /> : q.type === 'file' ? <FileTextIcon className="w-4 h-4" /> : <AwardIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-slate-800">{q.title}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{q.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Konten */}
        <div className="col-span-8">
          {activeQuestion ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                <span>ID Konten: {activeQuestion.id}</span>
                <span>Tipe: {activeQuestion.type.toUpperCase()}</span>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judul Konten</label>
                <input 
                  className="w-full text-xl font-bold p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={activeQuestion.title}
                  onChange={(e) => setActiveQuestion({ ...activeQuestion, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe Konten</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                    value={activeQuestion.type}
                    onChange={(e) => setActiveQuestion({ ...activeQuestion, type: e.target.value as any })}
                  >
                    <option value="video">Video (Live Class)</option>
                    <option value="file">File (E-Book/PDF)</option>
                    <option value="tryout">Tryout</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">URL Konten / ID Tryout</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                    value={activeQuestion.url || ""}
                    onChange={(e) => setActiveQuestion({ ...activeQuestion, url: e.target.value })}
                    placeholder="https://... atau UUID"
                  />
                </div>
              </div>

              {activeQuestion.type === 'video' && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Detail Live Class</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Zoom / YT</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm"
                        value={activeQuestion.zoom_link || ""}
                        onChange={(e) => setActiveQuestion({ ...activeQuestion, zoom_link: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm"
                        value={activeQuestion.live_schedule || ""}
                        onChange={(e) => setActiveQuestion({ ...activeQuestion, live_schedule: e.target.value })}
                        placeholder="Contoh: Selasa, 19:30 WIB"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Rekaman</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm"
                        value={activeQuestion.recording_url || ""}
                        onChange={(e) => setActiveQuestion({ ...activeQuestion, recording_url: e.target.value })}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Mentor</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm"
                        value={activeQuestion.mentor_name || ""}
                        onChange={(e) => setActiveQuestion({ ...activeQuestion, mentor_name: e.target.value })}
                        placeholder="Nama Mentor"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Mini Tes (Optional)</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm"
                      value={activeQuestion.tryout_id || ""}
                      onChange={(e) => setActiveQuestion({ ...activeQuestion, tryout_id: e.target.value })}
                    >
                      <option value="">-- Pilih Mini Tes --</option>
                      {tryouts.map(to => (
                        <option key={to.id} value={to.id}>{to.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSaveQuestion} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg shadow-blue-500/20"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                      Simpan Konten Ini
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                  <UploadCloud className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Panduan Pengisian</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Untuk tipe **Video**, masukkan URL video (YouTube/Drive). Untuk **File**, masukkan URL PDF. Untuk **Tryout**, masukkan ID Paket Tryout yang sudah dibuat di Import Soal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 h-64 flex items-center justify-center text-slate-400">
              Pilih konten di sidebar untuk mulai mengedit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal icons local to this view to avoid import issues
function PlayIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function FileTextIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function AwardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
}
