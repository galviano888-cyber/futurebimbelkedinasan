import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutQuestion } from "@/data/tryoutQuestions";



interface TryoutEngineViewProps {
  packageId: string;
  onFinish: (result: any) => void;
  onExit: () => void;
}

export function TryoutEngineView({ packageId, onFinish, onExit }: TryoutEngineViewProps) {
  const [questions, setQuestions] = useState<TryoutQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [flagged, setFlagged] = useState<{ [key: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(100 * 60); // 100 menit default
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNavGrid, setShowNavGrid] = useState(true);

  // Load Data
  useEffect(() => {
    const fetchTryoutData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data: qData, error } = await supabase
          .from('tryout_questions')
          .select('*')
          .eq('package_id', packageId)
          .order('number', { ascending: true });

        if (error) throw error;
        setQuestions(qData || []);
      } catch (err) {
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTryoutData();
  }, [packageId]);

  // Timer Logic
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  // Auto Finish when time ends
  useEffect(() => {
    if (timeLeft === 0) {
      handleFinish();
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = useCallback(async () => {
    const stats = {
      twk: { score: 0, max: 0, correct: 0, total: 0 },
      tiu: { score: 0, max: 0, correct: 0, total: 0 },
      tkp: { score: 0, max: 0, correct: 0, total: 0 },
    };

    questions.forEach(q => {
      const cat = (q.category || "TWK").toLowerCase();
      const category = cat === 'twk' || cat === 'tiu' || cat === 'tkp' ? cat : 'twk';
      const userAnswer = answers[q.id];
      
      stats[category].total++;
      
      if (category === 'tkp') {
        stats.tkp.max += 5;
        if (userAnswer && q.tkp_scores) {
          const points = q.tkp_scores[userAnswer] || 0;
          stats.tkp.score += points;
          if (points === 5) stats.tkp.correct++;
        }
      } else {
        stats[category].max += 5;
        if (userAnswer === q.correct_answer) {
          stats[category].score += 5;
          stats[category].correct++;
        }
      }
    });

    const totalScore = stats.twk.score + stats.tiu.score + stats.tkp.score;
    const totalMax = stats.twk.max + stats.tiu.max + stats.tkp.max;
    const totalCorrect = stats.twk.correct + stats.tiu.correct + stats.tkp.correct;
    const answeredCount = Object.keys(answers).length;

    const resultData = {
      totalQuestions: questions.length,
      answeredCount,
      totalScore,
      totalMax,
      totalCorrect,
      twkScore: stats.twk.score,
      twkMax: stats.twk.max,
      twkCorrect: stats.twk.correct,
      tiuScore: stats.tiu.score,
      tiuMax: stats.tiu.max,
      tiuCorrect: stats.tiu.correct,
      tkpScore: stats.tkp.score,
      tkpMax: stats.tkp.max,
      tkpCorrect: stats.tkp.correct,
      timeUsed: (100 * 60) - timeLeft,
      questions,
      answers
    };

    // SAVE TO DATABASE
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Ambil nama paket untuk history
          const { data: pkg } = await supabase.from('packages').select('title').eq('id', packageId).single();
          
          await supabase.from('tryout_results').insert([{
            user_id: user.id,
            package_id: packageId,
            package_name: pkg?.title || 'Unknown Package',
            twk: stats.twk.score,
            tiu: stats.tiu.score,
            tkp: stats.tkp.score,
            total: totalScore,
            date: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error("Gagal menyimpan hasil tryout:", err);
      }
    }

    onFinish(resultData);
  }, [answers, questions, timeLeft, onFinish, packageId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[999]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 animate-pulse text-sm">MENYIAPKAN LEMBAR UJIAN CAT BKN...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 z-[999]">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-red-500 mb-6 border border-slate-100">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Data Soal Kosong</h2>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          Silakan hubungi admin untuk mengisi soal pada paket ini.
        </p>
        <button 
          onClick={onExit}
          className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg active:scale-95"
        >
          KEMBALI KE DASHBOARD
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 bg-[#f4f7f9] flex flex-col overflow-hidden font-sans select-none">
      {/* CAT BKN STYLE HEADER */}
      <header className="h-14 bg-[#1e293b] flex items-center justify-between px-6 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">SISTEM CAT FUTURE BIMBEL</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded bg-black/20 border border-white/10 text-white transition-all ${
             timeLeft < 300 ? 'text-red-400 animate-pulse' : ''
           }`}>
             <Clock className="w-4 h-4" />
             <span className="text-lg font-bold tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
           </div>
           <button 
             onClick={() => setShowConfirmModal(true)}
             className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded transition-all uppercase shadow-lg shadow-red-900/20"
           >
             Selesai
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Question Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-4xl mx-auto">
            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Soal Nomor {currentIdx + 1} dari {questions.length}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                    {currentQ?.category || "UMUM"}
                  </span>
               </div>
               
               <div className="p-8 space-y-8">
                  {/* Question Text */}
                  <div className="text-[17px] text-slate-800 font-medium leading-[1.7] text-justify">
                    {currentQ?.question_text}
                  </div>

                  {/* Question Image */}
                  {currentQ?.question_image_url && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 p-2 max-w-xl">
                      <img src={currentQ.question_image_url} alt="Soal Visual" className="max-h-64 mx-auto object-contain" />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(currentQ?.options || {}).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setAnswers({ ...answers, [currentQ.id]: key })}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 group ${
                          answers[currentQ.id] === key 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          answers[currentQ.id] === key 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-slate-100'
                        }`}>
                          {key.toUpperCase()}
                        </div>
                        <div className="flex-1 text-[15px] leading-relaxed pt-0.5">{value}</div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="flex items-center justify-between mt-8">
               <button 
                 disabled={currentIdx === 0}
                 onClick={() => setCurrentIdx(prev => prev - 1)}
                 className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30 shadow-sm"
               >
                 <ChevronLeft className="w-4 h-4" /> SEBELUMNYA
               </button>

               <button 
                 onClick={() => setFlagged({ ...flagged, [currentQ.id]: !flagged[currentQ.id] })}
                 className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                   flagged[currentQ.id] 
                   ? 'bg-yellow-400 text-yellow-900 border-yellow-500' 
                   : 'bg-white text-yellow-600 border border-yellow-200 hover:bg-yellow-50'
                 }`}
               >
                 <Flag className={`w-4 h-4 ${flagged[currentQ.id] ? 'fill-current' : ''}`} />
                 RAGU-RAGU
               </button>

               <button 
                 disabled={currentIdx === questions.length - 1}
                 onClick={() => setCurrentIdx(prev => prev + 1)}
                 className="flex items-center gap-2 px-6 py-3 bg-[#1e293b] text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all disabled:opacity-30 shadow-md"
               >
                 SELANJUTNYA <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </main>

        {/* RIGHT: Navigation Grid (BKN Style Colors) */}
        <aside className={`bg-white border-l border-slate-200 transition-all duration-300 flex flex-col ${showNavGrid ? 'w-72' : 'w-0 overflow-hidden border-none'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Daftar Soal</h2>
              <div className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                {answeredCount}/{questions.length}
              </div>
            </div>
            {/* Progress Bar Mini */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2 content-start">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`aspect-square rounded-lg text-xs font-bold transition-all border-2 relative ${
                  currentIdx === idx 
                  ? 'border-blue-500 ring-2 ring-blue-100 z-10' 
                  : ''
                } ${
                  flagged[q.id]
                    ? 'bg-yellow-400 border-yellow-500 text-yellow-900'
                    : answers[q.id]
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
             <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> TERJAWAB
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className="w-3 h-3 bg-yellow-400 rounded-sm" /> RAGU-RAGU
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className="w-3 h-3 bg-white border border-slate-300 rounded-sm" /> BELUM
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className="w-3 h-3 border-2 border-blue-500 rounded-sm" /> AKTIF
                </div>
             </div>
          </div>
        </aside>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setShowNavGrid(!showNavGrid)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#1e293b] text-white rounded-full lg:hidden flex items-center justify-center shadow-2xl z-40"
        >
          {showNavGrid ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MODAL SELESAI (BKN Style) */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                   <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase">Konfirmasi Selesai</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    Apakah Anda yakin ingin mengakhiri ujian ini? <br/>
                    <span className="font-bold text-slate-800">Terjawab: {answeredCount} dari {questions.length}</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-all text-xs"
                  >
                    TIDAK, LANJUTKAN
                  </button>
                  <button 
                    onClick={handleFinish}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-xs shadow-md"
                  >
                    YA, SELESAI
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
