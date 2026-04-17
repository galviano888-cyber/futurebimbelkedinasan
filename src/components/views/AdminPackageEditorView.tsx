import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Image as ImageIcon, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface AdminPackageEditorViewProps {
  packageId: string;
  onBack: () => void;
}

export function AdminPackageEditorView({ packageId, onBack }: AdminPackageEditorViewProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [packageId]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    
    const { data: pkgData } = await supabase.from('tryout_packages').select('*').eq('id', packageId).single();
    if (pkgData) setPkg(pkgData);

    const { data: qData } = await supabase.from('tryout_questions').select('*').eq('package_id', packageId).order('number', { ascending: true });
    if (qData) {
      setQuestions(qData);
      if (qData.length > 0) setActiveQuestion(qData[0]);
    }
    setLoading(false);
  };

  const handleSaveQuestion = async () => {
    if (!supabase || !activeQuestion) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tryout_questions')
        .update({
          question_text: activeQuestion.question_text,
          question_image_url: activeQuestion.question_image_url,
          options: activeQuestion.options,
          correct_answer: activeQuestion.correct_answer,
          tkp_scores: activeQuestion.tkp_scores,
          explanation: activeQuestion.explanation,
          fast_tips: activeQuestion.fast_tips
        })
        .eq('id', activeQuestion.id);

      if (error) throw error;
      
      // Update local state
      setQuestions(prev => prev.map(q => q.id === activeQuestion.id ? activeQuestion : q));
      alert("Soal berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan soal: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !activeQuestion) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('question-media').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('question-media').getPublicUrl(filePath);
      
      setActiveQuestion({ ...activeQuestion, question_image_url: data.publicUrl });
    } catch (err: any) {
      alert("Gagal upload gambar: " + err.message);
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  if (!pkg) return <div className="p-8">Paket tidak ditemukan. <Button onClick={onBack}>Kembali</Button></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800">Editor Bank Soal</h1>
            <p className="text-sm text-slate-500">{pkg.name} • {questions.length} Soal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${pkg.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {pkg.status}
          </span>
          <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-100" onClick={async () => {
            const newStatus = pkg.status === 'Draft' ? 'Published' : 'Draft';
            await supabase?.from('tryout_packages').update({ status: newStatus }).eq('id', pkg.id);
            setPkg({...pkg, status: newStatus});
          }}>
            {pkg.status === 'Draft' ? 'Publish Paket' : 'Jadikan Draft'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav Soal */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700 text-sm">Navigasi Soal</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestion(q)}
                  className={`h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${activeQuestion?.id === q.id ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {q.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeQuestion ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-lg">Soal #{activeQuestion.number}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white ${activeQuestion.category === 'TWK' ? 'bg-blue-500' : activeQuestion.category === 'TIU' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {activeQuestion.category}
                  </span>
                </h2>
                <Button onClick={handleSaveQuestion} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>

              {/* Teks Soal */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <label className="font-bold text-slate-700 text-sm uppercase tracking-wide">Teks Soal</label>
                <textarea
                  value={activeQuestion.question_text}
                  onChange={(e) => setActiveQuestion({ ...activeQuestion, question_text: e.target.value })}
                  className="w-full h-32 p-4 text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Tulis soal di sini..."
                />
                
                {/* Image Upload */}
                <div>
                  <label className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-2 block">Media Soal (Opsional)</label>
                  {activeQuestion.question_image_url ? (
                    <div className="relative inline-block">
                      <img src={activeQuestion.question_image_url} alt="Media Soal" className="max-h-48 rounded-lg border border-slate-200" />
                      <button 
                        onClick={() => setActiveQuestion({ ...activeQuestion, question_image_url: null })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving} className="border-dashed border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        <UploadCloud className="w-4 h-4 mr-2" /> Unggah Gambar (JPG/PNG)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Opsi Jawaban */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <label className="font-bold text-slate-700 text-sm uppercase tracking-wide">Opsi Jawaban & Skor</label>
                <div className="space-y-4">
                  {['A', 'B', 'C', 'D', 'E'].map(opt => (
                    <div key={opt} className="flex items-start gap-4">
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${activeQuestion.correct_answer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {opt}
                      </div>
                      <div className="flex-1 flex gap-4">
                        <textarea
                          value={activeQuestion.options[opt] || ''}
                          onChange={(e) => setActiveQuestion({
                            ...activeQuestion,
                            options: { ...activeQuestion.options, [opt]: e.target.value }
                          })}
                          className="flex-1 p-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none min-h-[60px]"
                          placeholder={`Teks Opsi ${opt}`}
                        />
                        {activeQuestion.category === 'TKP' && (
                          <div className="w-24 shrink-0">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Poin TKP</label>
                            <input
                              type="number"
                              min="1" max="5"
                              value={activeQuestion.tkp_scores?.[opt] || 0}
                              onChange={(e) => setActiveQuestion({
                                ...activeQuestion,
                                tkp_scores: { ...activeQuestion.tkp_scores, [opt]: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full p-2 text-slate-900 bg-slate-50 border border-slate-200 rounded-lg text-center"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {activeQuestion.category !== 'TKP' && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="font-bold text-slate-700 text-sm uppercase tracking-wide mr-4">Kunci Jawaban Benar:</label>
                    <select 
                      value={activeQuestion.correct_answer || ''}
                      onChange={(e) => setActiveQuestion({ ...activeQuestion, correct_answer: e.target.value })}
                      className="p-2 border border-slate-300 text-slate-900 rounded-lg bg-white font-bold"
                    >
                      <option value="">Pilih...</option>
                      {['A', 'B', 'C', 'D', 'E'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Pembahasan */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <label className="font-bold text-slate-700 text-sm uppercase tracking-wide text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Pembahasan Rahasia (Ditampilkan setelah ujian)
                </label>
                <textarea
                  value={activeQuestion.explanation || ''}
                  onChange={(e) => setActiveQuestion({ ...activeQuestion, explanation: e.target.value })}
                  className="w-full h-32 p-4 text-slate-900 bg-emerald-50/50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Penjelasan lengkap mengapa jawaban ini benar..."
                />
                
                <label className="font-bold text-slate-700 text-sm uppercase tracking-wide text-amber-600 block mt-4">
                  💡 Tips Cepat
                </label>
                <input
                  type="text"
                  value={activeQuestion.fast_tips || ''}
                  onChange={(e) => setActiveQuestion({ ...activeQuestion, fast_tips: e.target.value })}
                  className="w-full p-3 text-slate-900 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Cara cepat / rumus cerdas menjawab tipe soal ini..."
                />
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Pilih soal dari navigasi di sebelah kiri untuk mulai mengedit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
