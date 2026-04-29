import { useState, useEffect } from "react";
import {
  Clock,
  Menu,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface TryoutEngineViewProps {
  packageId: string;
  questionsId: string;
  onFinish: (results: any) => void;
  onExit: () => void;
}

export function TryoutEngineView({ packageId, questionsId, onFinish, onExit }: TryoutEngineViewProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(6000); // Default 100m
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cheatAttempts, setCheatAttempts] = useState(0);

  // Anti-Cheat Implementation
  useEffect(() => {
    const handleViolation = (msg: string) => {
      setCheatAttempts(prev => {
        const newCount = prev + 1;
        toast.warning("Peringatan Anti-Cheat!", {
          description: `${msg} (${newCount}x). Aktivitas ini dicatat oleh sistem.`,
          duration: 5000
        });
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Anda terdeteksi meninggalkan halaman ujian");
      }
    };

    const handleBlur = () => {
      handleViolation("Anda terdeteksi meninggalkan fokus jendela ujian");
    };

    const preventActions = (e: any) => {
      e.preventDefault();
      toast.error("Aksi tidak diizinkan selama ujian berlangsung!");
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toast.error("Dilarang mencetak halaman ujian!");
      }
      if (e.key === 'PrintScreen') {
        handleViolation("Dilarang mengambil tangkapan layar!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", preventActions);
    document.addEventListener("copy", preventActions);
    document.addEventListener("paste", preventActions);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", preventActions);
      document.removeEventListener("copy", preventActions);
      document.removeEventListener("paste", preventActions);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      if (!supabase) return;
      try {
        setLoading(true);

        // Fetch user once
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const { data: techData } = await supabase
          .from('tryout_packages')
          .select('*')
          .eq('id', questionsId)
          .maybeSingle();

        // 1. Initial Default Time
        let initialTime = 6000;
        if (techData?.duration_minutes) {
          initialTime = techData.duration_minutes * 60;
        }

        // 2. Check LocalStorage for persistence
        if (user) {
          const timerKey = `to_endtime_${user.id}_${questionsId}`;
          const savedEndTime = localStorage.getItem(timerKey);

          if (savedEndTime) {
            const endTime = parseInt(savedEndTime);
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
              // Auto finish if time is already up when loading
              toast.error("Waktu sudah habis! Mengirim jawaban otomatis...");
              setTimeout(() => {
                handleSubmit();
              }, 1500);
              return;
            }
          } else {
            // First time starting: set and save end time
            const endTime = Date.now() + (initialTime * 1000);
            localStorage.setItem(timerKey, endTime.toString());
            setTimeLeft(initialTime);
          }

          // Also check for saved answers
          const savedAnswers = localStorage.getItem(`to_answers_${user.id}_${questionsId}`);
          if (savedAnswers) {
            try {
              setAnswers(JSON.parse(savedAnswers));
            } catch (e) { }
          }
        } else {
          setTimeLeft(initialTime);
        }

        const { data, error } = await supabase
          .from('tryout_questions')
          .select('*')
          .eq('package_id', questionsId)
          .order('number', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Tidak ada soal ditemukan di paket ini. Silakan hubungi admin.");
        }

        setQuestions(data || []);
      } catch (err: any) {
        console.error("Error loading engine:", err);
        setError(err.message || "Gagal memuat soal tryout.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [questionsId]);

  useEffect(() => {
    if (loading || questions.length === 0 || timeLeft <= 0) {
      if (timeLeft === 0 && questions.length > 0) {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions.length, timeLeft]);

  // Save answers to localStorage when they change
  useEffect(() => {
    if (userId && Object.keys(answers).length > 0) {
      localStorage.setItem(`to_answers_${userId}_${questionsId}`, JSON.stringify(answers));
    }
  }, [answers, userId, questionsId]);

  // Auto-finish on 3 violations
  useEffect(() => {
    if (cheatAttempts >= 3 && !isSubmitting) {
      toast.error("UJIAN DIHENTIKAN OTOMATIS!", {
        description: "Anda terdeteksi keluar dari halaman sebanyak 3 kali. Sistem telah mengirim jawaban Anda secara otomatis untuk menjaga integritas ujian.",
        duration: 8000
      });
      handleSubmit();
    }
  }, [cheatAttempts, isSubmitting]);

  const handleSubmit = async () => {
    if (isSubmitting || !supabase) return;
    setIsSubmitting(true);
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("No user");

      let totalScore = 0;
      let twkScore = 0;
      let tiuScore = 0;
      let tkpScore = 0;

      const details = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;
        let score = 0;

        if (q.category === 'TKP') {
          score = q.tkp_scores ? (q.tkp_scores[userAnswer] || 0) : (isCorrect ? 5 : 0);
        } else {
          score = isCorrect ? 5 : 0;
        }

        if (q.category === 'TWK') twkScore += score;
        else if (q.category === 'TIU') tiuScore += score;
        else if (q.category === 'TKP') tkpScore += score;

        totalScore += score;
        return {
          questionId: q.id,
          userAnswer,
          correctAnswer: q.correct_answer,
          isCorrect,
          score,
          category: q.category
        };
      });

      const twkCorrect = details.filter(d => d.category === 'TWK' && d.score === 5).length;
      const tiuCorrect = details.filter(d => d.category === 'TIU' && d.score === 5).length;
      const tkpCorrect = details.filter(d => d.category === 'TKP' && d.userAnswer).length;

      // Fetch package name for record
      const { data: pkgInfo } = await supabase
        .from('packages')
        .select('title')
        .eq('id', packageId)
        .maybeSingle();

      const result = {
        package_id: packageId,
        tryout_id: questionsId,
        user_id: user.id,
        package_name: pkgInfo?.title || "Tryout SKD",
        twk: twkScore,
        tiu: tiuScore,
        tkp: tkpScore,
        twk_correct: twkCorrect,
        tiu_correct: tiuCorrect,
        tkp_correct: tkpCorrect,
        total: totalScore,
        answers: answers,
        score_details: details,
        cheat_attempts: cheatAttempts,
        date: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('tryout_results')
        .insert([result]);

      if (insertError) throw insertError;

      // Clear persistence on success
      if (user) {
        localStorage.removeItem(`to_endtime_${user.id}_${questionsId}`);
        localStorage.removeItem(`to_answers_${user.id}_${questionsId}`);
      }

      onFinish({
        ...result,
        twkScore,
        tiuScore,
        tkpScore,
        cheatAttempts,
        totalQuestions: questions.length,
        twkMax: questions.filter(q => q.category === 'TWK').length * 5,
        tiuMax: questions.filter(q => q.category === 'TIU').length * 5,
        tkpMax: questions.filter(q => q.category === 'TKP').length * 5,
        questions: questions // Pass questions for review
      });
    } catch (err: any) {
      console.error("Error submitting tryout:", err);
      toast.error("Gagal mengirim jawaban: " + (err.message || "Unknown error"));
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mb-6 text-red-600">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Gagal Memuat Soal</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={onExit}
          className="px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl"
        >
          KEMBALI KE DASHBOARD
        </button>
      </div>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Menyiapkan Lembar Ujian...</p>
      </div>
    );
  }
  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-[#eef0f4] dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#f8f9fb] dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight hidden sm:block">Tryout SKD Nasional</h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terjawab</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Object.keys(answers).length} / {questions.length}</span>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-5 py-2 rounded-xl border transition-all",
            timeLeft < 300
              ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse"
              : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          )}>
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Selesai
          </button>
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              {/* Question Info Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20">
                    {currentIdx + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Nomor Soal</p>
                    <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentQuestion?.category || 'Umum'}</h2>
                  </div>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-6">
                <p className="text-[15px] text-slate-700 dark:text-slate-100 font-medium leading-relaxed text-justify">
                  {currentQuestion?.question_text}
                </p>

                {currentQuestion?.question_image_url && (
                  <div className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl max-w-2xl mx-auto">
                    <img src={currentQuestion.question_image_url} alt="Soal" className="w-full h-auto" />
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-2">
                {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                    className="group flex items-center gap-2.5 w-full text-left transition-all active:scale-[0.99]"
                  >
                    {/* Radio Circle */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                      answers[currentQuestion.id] === opt
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                    )}>
                      {answers[currentQuestion.id] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    {/* Letter */}
                    <span className={cn(
                      "text-xs font-black w-4 transition-colors shrink-0",
                      answers[currentQuestion.id] === opt ? "text-blue-600" : "text-slate-400"
                    )}>
                      {opt}.
                    </span>

                    {/* Content Pill */}
                    <div className={cn(
                      "flex-1 p-2.5 px-4 rounded-xl border transition-all",
                      answers[currentQuestion.id] === opt
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 shadow-sm"
                        : "bg-[#f8f9fb] dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                    )}>
                      <p className={cn(
                        "text-[13px] font-medium leading-relaxed text-justify",
                        answers[currentQuestion.id] === opt ? "text-blue-800 dark:text-blue-100" : "text-slate-600 dark:text-slate-300"
                      )}>
                        {currentQuestion?.options?.[opt]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottom Controls */}
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => {
                    const newAnswers = { ...answers };
                    delete newAnswers[currentQuestion.id];
                    setAnswers(newAnswers);
                    if (userId) {
                      localStorage.setItem(`to_answers_${userId}_${questionsId}`, JSON.stringify(newAnswers));
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-95"
                >
                  Batalkan Jawaban
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setCurrentIdx((prev) => Math.max(0, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentIdx === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-all active:scale-95"
                  >
                    Sebelumnya
                  </button>

                  {currentIdx === questions.length - 1 ? (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                      Selesai
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                    >
                      Selanjutnya
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Question Grid */}
        <aside className={cn(
          "fixed lg:sticky lg:top-20 right-0 w-80 z-30 transition-transform duration-300 transform lg:translate-x-0 shadow-2xl lg:shadow-none shrink-0",
          showSidebar ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4 lg:p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col max-h-[calc(100vh-10rem)]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mx-auto">Nomor Soal</h3>
                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-5 gap-2 pb-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIdx(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (window.innerWidth < 1024) setShowSidebar(false);
                      }}
                      className={cn(
                        "h-10 rounded-lg text-xs font-bold transition-all relative border",
                        idx === currentIdx
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105 z-10"
                          : answers[q.id]
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/10"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800"
          >
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Selesai Mengerjakan?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Kamu masih memiliki waktu <span className="text-blue-600 font-bold">{formatTime(timeLeft)}</span>. Pastikan semua jawaban sudah terisi dengan benar.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                YA, SELESAI & SIMPAN
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                LANJUTKAN MENGERJAKAN
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
