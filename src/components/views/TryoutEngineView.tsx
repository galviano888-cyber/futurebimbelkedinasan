import { useState, useEffect, useRef } from "react";
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
  const lastViolationTime = useRef<number>(0);

  // Anti-Cheat Implementation
  useEffect(() => {
    const handleViolation = (msg: string) => {
      const now = Date.now();
      // Prevent double counting within 2 seconds (cooldown)
      if (now - lastViolationTime.current < 2000) return;
      lastViolationTime.current = now;

      setCheatAttempts(prev => {
        const newCount = prev + 1;
        // Use a stable toast ID so repeated warnings UPDATE the same toast
        // instead of stacking multiple notifications like spam
        toast.warning("Peringatan Anti-Cheat!", {
          id: "anti-cheat-warning",
          description: `${msg} (${newCount}x). Aktivitas ini dicatat oleh sistem.`,
          duration: 5000
        });
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Anda terdeteksi meninggalkan fokus jendela ujian");
      }
    };

    const preventActions = (e: any) => {
      e.preventDefault();
      toast.error("Aksi tidak diizinkan selama ujian berlangsung!", {
        id: "anti-cheat-action-blocked"
      });
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toast.error("Dilarang mencetak halaman ujian!", {
          id: "anti-cheat-print-blocked"
        });
      }
      if (e.key === 'PrintScreen') {
        handleViolation("Dilarang mengambil tangkapan layar!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", preventActions);
    document.addEventListener("copy", preventActions);
    document.addEventListener("paste", preventActions);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        id: "anti-cheat-auto-finish",
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

      // Fetch package name for record
      const { data: pkgInfo } = await supabase
        .from('packages')
        .select('title')
        .eq('id', packageId)
        .maybeSingle();

      const { data: tryoutInfo } = await supabase
        .from('tryout_packages')
        .select('name')
        .eq('id', questionsId)
        .maybeSingle();

      const combinedName = tryoutInfo?.name ? `${pkgInfo?.title || 'Paket'} - ${tryoutInfo.name}` : pkgInfo?.title || "Tryout SKD";

      // NEW SECURE SUBMISSION VIA RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_tryout_secure', {
        p_user_id: user.id,
        p_package_id: packageId,
        p_questions_id: questionsId,
        p_answers: answers,
        p_cheat_attempts: cheatAttempts,
        p_package_name: combinedName
      });

      if (rpcError) throw rpcError;

      // Clear persistence on success
      if (user) {
        localStorage.removeItem(`to_endtime_${user.id}_${questionsId}`);
        localStorage.removeItem(`to_answers_${user.id}_${questionsId}`);
      }

      onFinish({
        ...rpcData,
        twkScore: rpcData?.twk || 0,
        tiuScore: rpcData?.tiu || 0,
        tkpScore: rpcData?.tkp || 0,
        totalScore: rpcData?.total || 0,
        twkCorrect: rpcData?.twk_correct || 0,
        tiuCorrect: rpcData?.tiu_correct || 0,
        tkpCorrect: rpcData?.tkp_correct || 0,
        package_id: packageId,
        tryout_id: questionsId,
        user_id: user.id,
        package_name: combinedName,
        date: new Date().toISOString(),
        answers: answers,
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

  // Guard: soal belum tersedia (misal refresh saat questions masih kosong)
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Memuat Soal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#eef0f4] dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 sm:h-16 bg-[#f8f9fb] dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-50 shadow-sm touch-none">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <button onClick={onExit} className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="hidden xs:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <h1 className="hidden xs:block text-[10px] sm:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Tryout SKD</h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terjawab</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Object.keys(answers).length} / {questions.length}</span>
          </div>

          <div className={cn(
            "flex items-center gap-1.5 sm:gap-3 px-2 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all",
            timeLeft < 300
              ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse"
              : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          )}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-mono text-xs sm:text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3 sm:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] sm:text-xs font-bold uppercase tracking-widest rounded-lg sm:rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Selesai
          </button>
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              {/* Question Info Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-600/20">
                    {currentIdx + 1}
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Nomor Soal</p>
                    <h2 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currentQuestion?.category || 'Umum'}</h2>
                  </div>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-4 sm:space-y-6">
                {currentQuestion?.question_image_url && (
                  <div className="flex justify-center">
                    <img
                      src={currentQuestion.question_image_url}
                      alt="Gambar soal"
                      className="max-w-full max-h-64 h-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md"
                    />
                  </div>
                )}
                <p className="text-[14px] sm:text-[15px] text-slate-700 dark:text-slate-100 font-medium leading-relaxed text-justify">
                  {currentQuestion?.question_text}
                </p>
              </div>

              {/* Options Grid */}
              {(() => {
                const opts = ['A', 'B', 'C', 'D', 'E'];
                // Guard: pastikan option_images ada dan semua opsi punya gambar
                const optionImages = currentQuestion?.option_images || {};
                const allHaveImages = currentQuestion?.category === 'TIU' &&
                  opts.every(o => !!(optionImages[o]));

                if (allHaveImages) {
                  // Grid 2-kolom untuk soal figural TIU
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {opts.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                          className={cn(
                            "relative rounded-2xl border-2 overflow-hidden transition-all active:scale-[0.98] flex flex-col",
                            answers[currentQuestion.id] === opt
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300"
                          )}
                        >
                          {optionImages[opt] ? (
                            <img
                              src={optionImages[opt]}
                              alt={`Opsi ${opt}`}
                              className="w-auto max-w-full h-auto max-h-40 block mx-auto p-3"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="h-20 flex items-center justify-center text-slate-400 text-sm">Gambar tidak tersedia</div>
                          )}
                          <div className={cn(
                            "py-1.5 text-center text-[11px] font-black uppercase tracking-widest border-t",
                            answers[currentQuestion.id] === opt
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700"
                          )}>
                            {opt}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                }

                // List vertikal untuk teks atau campuran
                return (
                  <div className="grid grid-cols-1 gap-2">
                    {opts.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                        className="group flex items-center gap-2 sm:gap-2.5 w-full text-left transition-all active:scale-[0.99]"
                      >
                        <div className={cn(
                          "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                          answers[currentQuestion.id] === opt
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                        )}>
                          {answers[currentQuestion.id] === opt && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={cn(
                          "text-[10px] sm:text-xs font-black w-3 sm:w-4 transition-colors shrink-0",
                          answers[currentQuestion.id] === opt ? "text-blue-600" : "text-slate-400"
                        )}>
                          {opt}.
                        </span>
                        <div className={cn(
                          "flex-1 rounded-lg sm:rounded-xl border transition-all overflow-hidden",
                          answers[currentQuestion.id] === opt
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 shadow-sm"
                            : "bg-[#f8f9fb] dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                        )}>
                          {currentQuestion?.category === 'TIU' && currentQuestion?.option_images?.[opt] ? (
                            <img
                              src={currentQuestion.option_images[opt]}
                              alt={`Opsi ${opt}`}
                              className="max-w-full h-auto block mx-auto p-2"
                            />
                          ) : (
                            <p className={cn(
                              "p-2 sm:p-2.5 px-3 sm:px-4 text-[12px] sm:text-[13px] font-medium leading-relaxed text-justify",
                              answers[currentQuestion.id] === opt ? "text-blue-800 dark:text-blue-100" : "text-slate-600 dark:text-slate-300"
                            )}>
                              {currentQuestion?.options?.[opt]}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

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
              Anda masih memiliki waktu <span className="text-blue-600 font-bold">{formatTime(timeLeft)}</span>. Pastikan semua jawaban sudah terisi dengan benar.
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
