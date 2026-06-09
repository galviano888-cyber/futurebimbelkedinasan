import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, Edit2, Check, X, Globe, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminQuestionEditorViewProps {
  packageId: string;
  onBack: () => void;
}

export function AdminQuestionEditorView({ packageId, onBack }: AdminQuestionEditorViewProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [status, setStatus] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    fetchPackageInfo();
    fetchQuestions();
  }, [packageId]);

  const fetchPackageInfo = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('tryout_packages').select('name, status').eq('id', packageId).single();
    if (data) {
      setPackageName(data.name);
      setTempName(data.name);
      setStatus(data.status);
    }
  };

  const handleToggleStatus = async () => {
    if (!supabase) return;
    const newStatus = status === 'Published' ? 'Draft' : 'Published';
    try {
      setSaving(true);
      const { error } = await supabase.from('tryout_packages').update({ status: newStatus }).eq('id', packageId);
      if (error) throw error;
      setStatus(newStatus);
      toast.success(`Paket berhasil ${newStatus === 'Published' ? 'Dipublikasikan' : 'Ditarik ke Draft'}`);
    } catch (err: any) {
      toast.error("Gagal mengubah status: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!supabase || !tempName.trim()) return;
    try {
      const { error } = await supabase.from('tryout_packages').update({ name: tempName }).eq('id', packageId);
      if (error) throw error;
      setPackageName(tempName);
      setIsEditingName(false);
      toast.success("Nama tryout berhasil diperbarui");
    } catch (err: any) {
      toast.error("Gagal memperbarui nama: " + err.message);
    }
  };

  const fetchQuestions = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Try both tables for backward compatibility
      let { data, error } = await supabase
        .from('tryout_questions')
        .select('*')
        .eq('package_id', packageId)
        .order('number', { ascending: true });

      if ((!data || data.length === 0) && !error) {
        const { data: oldData } = await supabase
          .from('questions')
          .select('*')
          .eq('package_id', packageId)
          .order('order_index', { ascending: true });
        if (oldData) data = oldData;
      }

      if (error) throw error;
      setQuestions(data || []);
      if (data && data.length > 0) {
        setActiveQuestion(data[0]);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast.error("Gagal mengambil daftar soal");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      // For simplicity, we save the active question first if it was edited
      if (activeQuestion) {
        const { error } = await supabase
          .from('tryout_questions')
          .upsert({
            ...activeQuestion,
            package_id: packageId
          });
        if (error) throw error;
      }
      
      toast.success("Semua perubahan berhasil disimpan");
      fetchQuestions();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const nextNumber = questions.length > 0 ? Math.max(...questions.map(q => q.number || 0)) + 1 : 1;
    const newQ = {
      package_id: packageId,
      number: nextNumber,
      category: 'TWK',
      question_text: "Pertanyaan baru...",
      options: { A: "", B: "", C: "", D: "", E: "" },
      correct_answer: "A",
      explanation: "",
      tkp_scores: { A: 1, B: 2, C: 3, D: 4, E: 5 }
    };
    setActiveQuestion(newQ);
    // Note: It's not saved to DB yet until Save is clicked
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!id || !supabase) return;
    if (!confirm("Hapus soal ini selamanya?")) return;
    
    try {
      const { error } = await supabase.from('tryout_questions').delete().eq('id', id);
      if (error) throw error;
      toast.success("Soal dihapus");
      fetchQuestions();
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const updateOption = (label: string, text: string) => {
    if (!activeQuestion) return;
    const newOptions = { ...activeQuestion.options, [label]: text };
    setActiveQuestion({ ...activeQuestion, options: newOptions });
  };

  const updateTkpScore = (label: string, score: number) => {
    if (!activeQuestion) return;
    const newScores = { ...activeQuestion.tkp_scores, [label]: score };
    setActiveQuestion({ ...activeQuestion, tkp_scores: newScores });
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadImageToStorage = async (file: File, prefix: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase tidak tersedia');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) throw new Error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file maksimal 5MB.');
    const ext = file.name.split('.').pop();
    const fileName = `${prefix}-${packageId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file, 'soal');
      setActiveQuestion({ ...activeQuestion, question_image_url: url });
      toast.success('Gambar soal berhasil diupload');
    } catch (err: any) {
      toast.error('Gagal upload: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOptionImage(label);
    try {
      const url = await uploadImageToStorage(file, `opsi-${label.toLowerCase()}`);
      const newOptionImages = { ...(activeQuestion.option_images || {}), [label]: url };
      setActiveQuestion({ ...activeQuestion, option_images: newOptionImages });
      toast.success(`Gambar opsi ${label} berhasil diupload`);
    } catch (err: any) {
      toast.error('Gagal upload: ' + err.message);
    } finally {
      setUploadingOptionImage(null);
      const ref = optionFileInputRefs.current[label];
      if (ref) ref.value = '';
    }
  };

  const removeOptionImage = (label: string) => {
    const newOptionImages = { ...(activeQuestion.option_images || {}) };
    delete newOptionImages[label];
    setActiveQuestion({ ...activeQuestion, option_images: newOptionImages });
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Memuat Bank Soal...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Button>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <input 
                  autoFocus
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  className="bg-white border-2 border-blue-500 rounded-xl px-4 py-2 text-xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 min-w-[300px]"
                />
                <button onClick={handleUpdateName} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"><Check className="w-5 h-5" /></button>
                <button onClick={() => setIsEditingName(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group/title">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{packageName || "Bank Soal"}</h1>
                <button 
                  onClick={() => { setIsEditingName(true); setTempName(packageName); }}
                  className="opacity-0 group-hover/title:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Manajemen Butir Soal Tryout</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleToggleStatus} 
            disabled={saving}
            className={cn(
              "rounded-xl font-black transition-all shadow-lg",
              status === 'Published' 
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20" 
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
            )}
          >
            {status === 'Published' ? <Lock className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
            {status === 'Published' ? "UNPUBLISH" : "PUBLISH SEKARANG"}
          </Button>
          <Button variant="outline" onClick={handleAddQuestion} className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Tambah Soal</Button>
          <Button onClick={handleSaveAll} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 px-8">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[700px]">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Nomor</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    onClick={() => setActiveQuestion(q)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2",
                      activeQuestion?.id === q.id 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105 z-10" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                    )}
                  >
                    {q.number || idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="col-span-12 lg:col-span-9">
          {activeQuestion ? (
            <div className="space-y-6">
              {/* Question Editor Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-50">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">
                        {activeQuestion.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select 
                            value={activeQuestion.category}
                            onChange={(e) => setActiveQuestion({ ...activeQuestion, category: e.target.value })}
                            className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-blue-600 rounded-lg px-3 py-1 outline-none"
                          >
                            <option>TWK</option>
                            <option>TIU</option>
                            <option>TKP</option>
                          </select>
                          <input
                            type="text"
                            value={activeQuestion.sub_category || ""}
                            onChange={(e) => setActiveQuestion({ ...activeQuestion, sub_category: e.target.value })}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 rounded-lg px-3 py-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 min-w-[120px]"
                            placeholder="Subtema (cth: Nasionalisme)"
                          />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">Isi Butir Pertanyaan</h2>
                      </div>
                   </div>
                   {activeQuestion.id && (
                     <Button variant="ghost" onClick={() => handleDeleteQuestion(activeQuestion.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold">
                       <Trash2 className="w-4 h-4 mr-2" /> Hapus Soal
                     </Button>
                   )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teks Pertanyaan</label>
                  <textarea 
                    value={activeQuestion.question_text}
                    onChange={(e) => setActiveQuestion({ ...activeQuestion, question_text: e.target.value })}
                    rows={6}
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-800 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    placeholder="Masukkan teks soal di sini..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gambar Soal (Optional)</label>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {activeQuestion.question_image_url ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group">
                      <img
                        src={activeQuestion.question_image_url}
                        alt="Gambar soal"
                        className="w-full max-h-72 object-contain p-3"
                        onError={(e) => {
                          const el = e.currentTarget.parentElement;
                          if (el) el.innerHTML = '<div class="p-6 text-center text-xs font-bold text-red-400">Gambar tidak bisa dimuat</div>';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white text-slate-800 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
                        >
                          <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                        </button>
                        <button
                          onClick={() => setActiveQuestion({ ...activeQuestion, question_image_url: "" })}
                          className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
                        >
                          <X className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Mengupload...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-slate-500 group-hover:text-blue-600 transition-colors">Klik untuk upload gambar</p>
                            <p className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WebP, GIF — maks 5MB</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Options Grid */}
                <div className="space-y-6 pt-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilihan Jawaban</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {['A', 'B', 'C', 'D', 'E'].map((label) => (
                      <div key={label} className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border-2 transition-all",
                        activeQuestion.correct_answer === label ? "border-emerald-500/50 bg-emerald-50/30" : "border-slate-50 bg-slate-50/50"
                      )}>
                        <button 
                          onClick={() => setActiveQuestion({ ...activeQuestion, correct_answer: label })}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all",
                            activeQuestion.correct_answer === label ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white text-slate-300 border border-slate-100"
                          )}
                        >
                          {label}
                        </button>
                        <div className="flex-1 space-y-3">
                          {/* Untuk TIU: bisa teks atau gambar */}
                          {activeQuestion.category === 'TIU' ? (
                            <div className="space-y-2">
                              {/* Hidden file input per opsi */}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                ref={(el) => { optionFileInputRefs.current[label] = el; }}
                                onChange={(e) => handleOptionImageUpload(e, label)}
                              />
                              <textarea
                                value={activeQuestion.options?.[label] || ""}
                                onChange={(e) => updateOption(label, e.target.value)}
                                rows={1}
                                className="w-full bg-transparent border-none text-sm font-bold text-slate-700 outline-none p-2 resize-none"
                                placeholder={`Teks opsi ${label} (kosongkan jika pakai gambar)...`}
                              />
                              {activeQuestion.option_images?.[label] ? (
                                <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                  <img
                                    src={activeQuestion.option_images[label]}
                                    alt={`Opsi ${label}`}
                                    className="w-full max-h-28 object-contain p-1.5"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => optionFileInputRefs.current[label]?.click()}
                                      className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow"
                                    >
                                      <Upload className="w-3 h-3" /> Ganti
                                    </button>
                                    <button
                                      onClick={() => removeOptionImage(label)}
                                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow"
                                    >
                                      <X className="w-3 h-3" /> Hapus
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => optionFileInputRefs.current[label]?.click()}
                                  disabled={uploadingOptionImage === label}
                                  className="w-full h-14 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/20 transition-all text-slate-400 hover:text-blue-500"
                                >
                                  {uploadingOptionImage === label ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-black">Upload...</span></>
                                  ) : (
                                    <><ImageIcon className="w-4 h-4" /><span className="text-[10px] font-black">Upload gambar opsi {label}</span></>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <textarea
                              value={activeQuestion.options?.[label] || ""}
                              onChange={(e) => updateOption(label, e.target.value)}
                              rows={1}
                              className="w-full bg-transparent border-none text-sm font-bold text-slate-700 outline-none p-2 resize-none"
                              placeholder={`Isi pilihan ${label}...`}
                            />
                          )}
                          {activeQuestion.category === 'TKP' && (
                            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Skor TKP:</span>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button 
                                    key={s}
                                    onClick={() => updateTkpScore(label, s)}
                                    className={cn(
                                      "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                                      activeQuestion.tkp_scores?.[label] === s ? "bg-amber-500 text-white" : "bg-white text-slate-400 border border-slate-100"
                                    )}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {activeQuestion.correct_answer === label && activeQuestion.category !== 'TKP' && (
                          <div className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm">Kunci</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><AlertCircle className="w-4 h-4" /></div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Pembahasan Soal</h3>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teks Pembahasan</label>
                    <textarea 
                      value={activeQuestion.explanation || ""}
                      onChange={(e) => setActiveQuestion({ ...activeQuestion, explanation: e.target.value })}
                      rows={5}
                      className="w-full p-6 bg-slate-900 text-slate-100 rounded-[2rem] text-sm font-medium leading-relaxed outline-none border-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                      placeholder="Tulis alasan jawaban benar di sini..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Gambar Pembahasan (Optional)</label>
                    <input 
                      type="text"
                      value={activeQuestion.explanation_image_url || ""}
                      onChange={(e) => setActiveQuestion({ ...activeQuestion, explanation_image_url: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="pt-8">
                   <Button 
                     onClick={handleSaveAll} 
                     disabled={saving} 
                     className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-500/20"
                   >
                     {saving ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <CheckCircle2 className="w-6 h-6 mr-3" />}
                     SIMPAN BUTIR SOAL INI
                   </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 h-[600px] flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200/50"><Plus className="w-10 h-10" /></div>
              <p className="font-black uppercase tracking-widest text-xs">Pilih atau Tambah Soal Baru</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
