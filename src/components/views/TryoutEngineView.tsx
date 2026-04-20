import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertCircle,
  CheckCircle2,
  X,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface TryoutEngineViewProps {
  packageId: string; 
  questionsId: string; 
  onFinish: (result: any) => void;
  onExit: () => void;
}

export function TryoutEngineView({ packageId, questionsId, onFinish, onExit }: TryoutEngineViewProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(`timer_${questionsId}`);
    return saved ? parseInt(saved) : 100 * 60;
  });
  const [answers, setAnswers] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem(`answers_${questionsId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [flagged, setFlagged] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(`flagged_${questionsId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Menyiapkan lembar ujian...");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNavGrid, setShowNavGrid] = useState(true);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const hasLoaded = useRef(false);

  // 1. Initial Load & Session Recovery
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const fetchTryoutData = async () => {
      if (!supabase || !questionsId) {
        localStorage.removeItem(`timer_${questionsId}`);
        setLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User tidak login");

        setLoadingStatus("MENGHUBUNGI DATABASE...");

        // A. Cek sesi aktif pake limit(1) biar nggak PGRST116
        const { data: activeSessions, error: sessionError } = await supabase
          .from('active_tryout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('tryout_id', questionsId)
          .limit(1);

        if (sessionError) {
          console.error("Session Error:", sessionError);
        }

        const activeSession = activeSessions?.[0];

        let initialTimeLeft = timeLeft;
        let initialAnswers = answers;
        let initialFlagged = flagged;
        let initialIdx = currentIdx;
        let foundValidSession = false;

        if (activeSession) {
          const endTime = new Date(activeSession.end_time).getTime();
          const now = Date.now();
          const remaining = Math.floor((endTime - now) / 1000);

          if (remaining > 1) { // Masih ada sisa waktu minimal 1 detik
            setLoadingStatus("SESI DITEMUKAN! MEMULIHKAN DATA...");
            initialTimeLeft = remaining;
            
            // Gabungkan jawaban dari database dengan lokal (utamakan lokal jika ada)
            const localAnswers = localStorage.getItem(`answers_${questionsId}`);
            const localFlagged = localStorage.getItem(`flagged_${questionsId}`);
            
            initialAnswers = localAnswers ? JSON.parse(localAnswers) : (activeSession.answers || {});
            initialFlagged = localFlagged ? JSON.parse(localFlagged) : (activeSession.flagged || {});
            
            initialIdx = activeSession.current_idx || 0;
            setSessionId(activeSession.id);
            foundValidSession = true;
          } else {
            await supabase.from('active_tryout_sessions').delete().eq('id', activeSession.id);
          }
        } else {
        }

        // B. Fetch questions
        setLoadingStatus("MENGAMBIL BUTIR SOAL...");
        const { data: qData, error } = await supabase
          .from('tryout_questions')
          .select('*')
          .eq('package_id', questionsId)
          .order('number', { ascending: true });

        if (error) throw error;

        // C. Fetch package duration
        const { data: pData } = await supabase
          .from('tryout_packages')
          .select('name, duration')
          .eq('id', questionsId)
          .limit(1);

        const pkg = pData?.[0];
        const duration = pkg?.duration || 100;
        const packageName = pkg?.name || "Tryout SKD";

        // D. Create new session if none exists
        if (!foundValidSession) {
          setLoadingStatus("MEMBUAT SESI BARU...");
          const endTime = new Date(Date.now() + duration * 60000).toISOString();
          const { data: newSessions, error: insertError } = await supabase
            .from('active_tryout_sessions')
            .insert([{
              user_id: user.id,
              package_id: packageId,
              tryout_id: questionsId,
              end_time: endTime,
              answers: {},
              flagged: {},
              current_idx: 0
            }])
            .select();
          
          if (insertError) {
             console.error("Insert Error:", insertError);
          }
          
          if (newSessions?.[0]) {
            const newSession = newSessions[0];
            setSessionId(newSession.id);
            initialTimeLeft = duration * 60;
          }
        }

        const questionsWithPackage = (qData || []).map(q => ({ ...q, package_name: packageName }));
        
        setQuestions(questionsWithPackage);
        setAnswers(initialAnswers);
        setFlagged(initialFlagged);
        setCurrentIdx(initialIdx);
        setTimeLeft(initialTimeLeft);

      } catch (err) {
        console.error("Error loading tryout:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTryoutData();
  }, [questionsId, packageId]);

  // 2. Auto-save Persistence (Debounced)
  useEffect(() => {
    if (loading) return;
    
    // Save to LocalStorage for instant refresh recovery
    localStorage.setItem(`timer_${questionsId}`, timeLeft.toString());
    localStorage.setItem(`answers_${questionsId}`, JSON.stringify(answers));
    localStorage.setItem(`flagged_${questionsId}`, JSON.stringify(flagged));

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const saveSession = async () => {
      if (!supabase || !sessionId || loading) return;
      
      await supabase
        .from('active_tryout_sessions')
        .update({
          answers,
          flagged,
          current_idx: currentIdx,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    };

    const timer = setTimeout(saveSession, 3000); 
    return () => clearTimeout(timer);
  }, [answers, flagged, currentIdx, sessionId, loading, timeLeft]);

  // 3. Timer Logic
  useEffect(() => {
    if (loading || timeLeft <= 0) {
      if (!loading && timeLeft <= 0) handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = useCallback(async () => {
    // Hapus timer segera di awal agar tidak tersimpan kembali saat re-render
    localStorage.removeItem(`timer_${questionsId}`);
    
    try {
      setLoading(true);
      setLoadingStatus("MENYIMPAN HASIL UJIAN...");
      
      let twk = 0, tiu = 0, tkp = 0;
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        if (!userAnswer) return;
        if (q.category === 'TWK') {
          if (userAnswer === q.correct_answer) twk += 5;
        } else if (q.category === 'TIU') {
          if (userAnswer === q.correct_answer) tiu += 5;
        } else if (q.category === 'TKP') {
          const points = q.tkp_scores ? (q.tkp_scores[userAnswer] || 0) : (userAnswer === q.correct_answer ? 5 : 0);
          tkp += points;
        }
      });

      const total = twk + tiu + tkp;
      if (!supabase) throw new Error("Database tidak terhubung.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir.");

      const payload = {
        user_id: user.id,
        package_id: packageId,
        tryout_id: questionsId,
        package_name: questions[0]?.package_name || "Tryout SKD",
        twk, tiu, tkp, total,
        answers,
        date: new Date().toISOString().split('T')[0],
        score_details: { answers, flagged }
      };

      const { data: resultData, error: saveError } = await supabase
        .from('tryout_results')
        .insert([payload])
        .select().single();

      if (saveError) throw saveError;

      if (sessionId) {
        await supabase.from('active_tryout_sessions').delete().eq('id', sessionId);
      }
      
      // Pastikan lagi terhapus
      localStorage.removeItem(`timer_${questionsId}`);
      localStorage.removeItem(`answers_${questionsId}`);
      localStorage.removeItem(`flagged_${questionsId}`);

      const finalResult = {
        id: resultData.id,
        twkScore: twk, tiuScore: tiu, tkpScore: tkp,
        totalScore: resultData.total || total,
        twkMax: 150, tiuMax: 175, tkpMax: 225, totalMax: 550,
        twkCorrect: questions.filter(q => q.category === 'TWK' && answers[q.id] === q.correct_answer).length,
        tiuCorrect: questions.filter(q => q.category === 'TIU' && answers[q.id] === q.correct_answer).length,
        tkpCorrect: questions.filter(q => q.category === 'TKP' && answers[q.id]).length,
        totalQuestions: questions.length,
        answeredCount: Object.keys(answers).length,
        timeUsed: (100 * 60) - timeLeft,
        questions,
        answers
      };

      onFinish(finalResult);
      
    } catch (err: any) {
      console.error("Gagal menyimpan hasil:", err);
      alert(err.message || "Terjadi kesalahan saat menyimpan hasil.");
    } finally {
      setLoading(false);
    }
  }, [answers, questions, questionsId, packageId, flagged, onFinish, sessionId, timeLeft]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[10000]">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 flex flex-col items-center shadow-2xl"
        >
          <div className="relative mb-10">
            <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-20 h-20 border-t-4 border-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            />
          </div>
          
          <div className="text-center space-y-3">
             <h3 className="text-white font-black text-xl tracking-tight uppercase">Menyiapkan Lembar Ujian</h3>
             <p className="text-blue-400 font-bold text-[10px] tracking-[0.4em] uppercase animate-pulse">{loadingStatus}</p>
          </div>

          <div className="mt-12 flex gap-4">
             {[0, 1, 2].map((i) => (
               <motion.div 
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
               />
             ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-[9999] text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold">Data Ujian Kosong</h2>
        <button onClick={onExit} className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg">KEMBALI KE DASHBOARD</button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex flex-col overflow-hidden font-sans select-none z-[9999]">
      <header className="h-16 bg-[#1e293b] flex items-center justify-between px-6 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-sm font-black text-white tracking-widest uppercase hidden md:block">SISTEM CAT FUTURE BIMBEL KEDINASAN</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-3 px-5 py-2 rounded-xl bg-black/30 border border-white/10 text-white transition-all ${timeLeft < 300 ? 'text-red-400 animate-pulse border-red-500/50' : ''}`}>
             <Clock className="w-5 h-5" />
             <span className="text-xl font-black tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
           </div>
           <button onClick={() => setShowConfirmModal(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all uppercase shadow-lg shadow-emerald-900/20">SELESAI</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Soal Nomor {currentIdx + 1} / {questions.length}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">{currentQ?.category || "UMUM"}</span>
               </div>
               
               <div className="p-8 md:p-12 space-y-10">
                  <div className="text-[18px] text-slate-800 font-medium leading-relaxed text-justify">
                    {currentQ?.question_text}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(currentQ?.options || {}).map(([key, value]: [string, any]) => (
                      <button
                        key={key}
                        onClick={() => setAnswers({ ...answers, [currentQ.id]: key })}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-5 group relative overflow-hidden ${
                          answers[currentQ.id] === key 
                          ? 'bg-blue-50/50 border-blue-500 text-blue-950 shadow-md' 
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-black text-sm shrink-0 transition-all ${
                          answers[currentQ.id] === key 
                          ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-slate-100'
                        }`}>
                          {key.toUpperCase()}
                        </div>
                        <div className="flex-1 text-[16px] leading-relaxed pt-0.5">{value}</div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between mt-10 px-2">
               <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-black text-[11px] rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-30 shadow-sm uppercase tracking-widest">
                 <ChevronLeft className="w-4 h-4" /> SEBELUMNYA
               </button>

               <button onClick={() => setFlagged({ ...flagged, [currentQ.id]: !flagged[currentQ.id] })} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[11px] transition-all shadow-sm uppercase tracking-widest border-2 ${flagged[currentQ.id] ? 'bg-yellow-400 text-yellow-950 border-yellow-500' : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}>
                 <Flag className={`w-4 h-4 ${flagged[currentQ.id] ? 'fill-current' : ''}`} /> RAGU-RAGU
               </button>

               <button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(prev => prev + 1)} className="flex items-center gap-2 px-8 py-4 bg-[#1e293b] text-white font-black text-[11px] rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-30 shadow-lg uppercase tracking-widest">
                 SELANJUTNYA <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </main>

        <aside className={`bg-white border-l border-slate-200 transition-all duration-500 flex flex-col ${showNavGrid ? 'w-80' : 'w-0 overflow-hidden'}`}>
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4">Peta Jawaban</h2>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-800 tracking-tighter">{Object.keys(answers).length}/{questions.length}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Terjawab</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} className="h-full bg-blue-500 shadow-lg shadow-blue-500/20" />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 grid grid-cols-5 gap-3 content-start">
             {questions.map((q, idx) => (
               <button
                 key={q.id}
                 onClick={() => setCurrentIdx(idx)}
                 className={`aspect-square rounded-xl text-[11px] font-black transition-all border-2 relative ${
                   currentIdx === idx ? 'ring-4 ring-blue-100 z-10 scale-105' : ''
                 } ${
                   flagged[q.id] ? 'bg-yellow-400 border-yellow-500 text-yellow-950' : 
                   answers[q.id] ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/10' : 
                   'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                 }`}
               >
                 {idx + 1}
               </button>
             ))}
           </div>

           <div className="p-6 bg-slate-50/80 border-t border-slate-200 grid grid-cols-2 gap-3 text-[9px] font-black text-slate-500 tracking-widest uppercase">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-sm" /> TERJAWAB</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-sm shadow-sm" /> RAGU-RAGU</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-300 rounded-sm shadow-sm" /> BELUM</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-500 rounded-sm" /> AKTIF</div>
           </div>
        </aside>

        <button onClick={() => setShowNavGrid(!showNavGrid)} className="fixed bottom-6 right-6 w-14 h-14 bg-[#1e293b] text-white rounded-2xl lg:hidden flex items-center justify-center shadow-2xl z-50">
          {showNavGrid ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
               <div className="p-10 text-center space-y-6">
                 <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto border border-blue-100 shadow-inner">
                    <AlertCircle className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Selesaikan Ujian?</h3>
                   <p className="text-slate-500 text-sm leading-relaxed">Pastikan semua jawaban sudah benar.</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4">
                   <button onClick={() => setShowConfirmModal(false)} className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all text-[11px] uppercase tracking-widest">LANJUTKAN</button>
                   <button onClick={handleFinish} className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">YA, SELESAI</button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
