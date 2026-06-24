import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Clock,
  Menu,
  X,
  AlertCircle,
  Sun,
  Moon
} from "lucide-react";
import { FBKLoader } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";

interface TryoutEngineViewProps {
  packageId: string;
  questionsId: string;
  onFinish: (results: any) => void;
  onExit: () => void;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Timer terisolasi: hanya komponen ini yang re-render tiap detik,
 * sehingga kartu soal & grid navigasi tidak ikut re-render (anti-lag).
 */
const CountdownTimer = memo(function CountdownTimer({
  endTime,
  onExpire,
}: {
  endTime: number | null;
  onExpire: () => void;
}) {
  const calc = () => (endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 0);
  const [remaining, setRemaining] = useState(calc);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const r = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className={cn(
      "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all",
      remaining < 300
        ? "bg-red-500/30 border-red-300/50 text-white animate-pulse"
        : "bg-white/10 border-white/20 text-white"
    )}>
      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="font-mono text-xs sm:text-[15px] font-semibold tabular-nums">{formatTime(remaining)}</span>
    </div>
  );
});

export function TryoutEngineView({ packageId, questionsId, onFinish, onExit }: TryoutEngineViewProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cheatAttempts, setCheatAttempts] = useState(0);
  const [cheatWarning, setCheatWarning] = useState<{ msg: string; count: number } | null>(null);
  const lastViolationTime = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme]);

  const remainingSeconds = () => (endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 0);

  // Swipe gesture untuk mobile
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Anti-Cheat Implementation
  useEffect(() => {
    const handleViolation = (msg: string) => {
      const now = Date.now();
      // Cooldown 1.5 detik agar tidak double-count
      if (now - lastViolationTime.current < 1500) return;
      lastViolationTime.current = now;

      setCheatAttempts(prev => {
        const newCount = prev + 1;
        setCheatWarning({ msg, count: newCount });
        return newCount;
      });
    };

    // Deteksi pindah tab / minimise / pindah aplikasi
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Anda meninggalkan jendela ujian");
      }
    };

    // Deteksi kehilangan fokus window (Alt+Tab, pindah aplikasi, dll)
    // Hanya hitung pelanggaran jika halaman TIDAK tersembunyi (bukan tab switch
    // yang sudah ditangani visibilitychange) dan blur terjadi lebih dari 1 detik
    // setelah page load untuk menghindari false positive saat pertama mount.
    const handleWindowBlur = () => {
      // Jika document.hidden = true, visibilitychange sudah menanganinya
      if (document.hidden) return;
      // Abaikan blur dalam 2 detik pertama setelah halaman dimuat
      if (Date.now() - mountTime.current < 2000) return;
      handleViolation("Anda berpindah aplikasi atau jendela lain");
    };

    // Blokir aksi copy/paste/cut/contextmenu
    const preventActions = (e: any) => {
      e.preventDefault();
      toast.error("Aksi tidak diizinkan selama ujian berlangsung!", {
        id: "anti-cheat-action-blocked",
        duration: 3000
      });
      return false;
    };

    // Blokir drag (mencegah drag teks soal keluar)
    const preventDrag = (e: any) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Blokir print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toast.error("Dilarang mencetak halaman ujian!", { id: "anti-cheat-print-blocked" });
      }
      // PrintScreen = pelanggaran
      if (e.key === 'PrintScreen') {
        handleViolation("Percobaan screenshot terdeteksi");
        // Obfuscate clipboard setelah PrintScreen
        setTimeout(() => {
          try { navigator.clipboard.writeText("[DIBLOKIR OLEH SISTEM ANTI-CHEAT FBK]"); } catch {}
        }, 100);
      }
      // Blokir Alt+Tab (tidak bisa dicegah sepenuhnya tapi bisa dideteksi via blur)
      // Blokir F12 / DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        handleViolation("Percobaan membuka developer tools");
      }
      // Blokir Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        handleViolation("Percobaan membuka developer tools");
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        handleViolation("Percobaan melihat source halaman");
      }
      // Blokir Ctrl+S (save page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    // CSS: cegah seleksi teks soal
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", preventActions);
    document.addEventListener("copy", preventActions);
    document.addEventListener("cut", preventActions);
    document.addEventListener("paste", preventActions);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      // Restore user-select saat keluar
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", preventActions);
      document.removeEventListener("copy", preventActions);
      document.removeEventListener("cut", preventActions);
      document.removeEventListener("paste", preventActions);
      document.removeEventListener("dragstart", preventDrag);
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

          // Restore saved answers FIRST so auto-submit on expiry uses them
          const savedAnswers = localStorage.getItem(`to_answers_${user.id}_${questionsId}`);
          let restoredAnswers: Record<string, string> = {};
          if (savedAnswers) {
            try {
              restoredAnswers = JSON.parse(savedAnswers);
              setAnswers(restoredAnswers);
            } catch (e) { }
          }

          if (savedEndTime) {
            const saved = parseInt(savedEndTime);
            setEndTime(saved);

            if (saved - Date.now() <= 0) {
              // Auto finish if time is already up when loading
              toast.error("Waktu sudah habis! Mengirim jawaban otomatis...");
              setTimeout(() => {
                handleSubmit(restoredAnswers);
              }, 1500);
              return;
            }
          } else {
            // First time starting: set and save end time
            const newEnd = Date.now() + (initialTime * 1000);
            localStorage.setItem(timerKey, newEnd.toString());
            setEndTime(newEnd);
          }
        } else {
          setEndTime(Date.now() + (initialTime * 1000));
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

  const handleSubmit = async (answersOverride?: Record<string, string>) => {
    if (isSubmitting || !supabase) return;
    const finalAnswers = answersOverride || answers;
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
        p_answers: finalAnswers,
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
        answers: finalAnswers,
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

  if (error) {
    return (
      <div className="fixed inset-0 engine-surface dark:bg-[#0b0b0e] z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Gagal Memuat Soal</h3>
        <p className="text-slate-500 dark:text-slate-400 text-[14px] mb-7 max-w-md mx-auto leading-relaxed">
          {error}
        </p>
        <button
          onClick={onExit}
          className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[14px] rounded-xl transition-all active:scale-[0.98]"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <div className="fixed inset-0 engine-surface dark:bg-[#0b0b0e] z-50 flex items-center justify-center">
        <FBKLoader text="Menyiapkan lembar ujian..." />
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  // Guard: soal belum tersedia (misal refresh saat questions masih kosong)
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 engine-surface dark:bg-[#0b0b0e] z-50 flex items-center justify-center">
        <FBKLoader text="Memuat soal..." />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] engine-surface dark:bg-[#0b0b0e] flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 sm:h-16 bg-blue-900 dark:bg-blue-950 border-b border-blue-800/60 dark:border-blue-900/60 flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-50 touch-none">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <button onClick={onExit} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="hidden xs:block h-5 w-px bg-white/20" />
          <div className="hidden xs:flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-[9px] shrink-0">FBK</div>
            <h1 className="text-[13px] font-semibold text-white">Tryout SKD</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/10 rounded-xl border border-white/20">
            <span className="text-[11px] font-medium text-blue-100">Terjawab</span>
            <span className="text-[13px] font-semibold text-white">{Object.keys(answers).length}/{questions.length}</span>
          </div>

          <CountdownTimer endTime={endTime} onExpire={handleSubmit} />

          <button
            onClick={toggleTheme}
            aria-label="Ganti tema"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 sm:px-5 py-2 bg-white text-blue-700 font-semibold text-[12px] sm:text-[13px] rounded-lg sm:rounded-xl transition-all hover:bg-blue-50 shadow-sm min-h-[40px]"
          >
            Selesai
          </button>
          <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      <div
        className="flex-1 flex flex-col lg:flex-row relative overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
          // Hanya trigger jika swipe horizontal (dx > 50px) dan tidak scroll vertikal (dy < 30px)
          if (Math.abs(dx) > 50 && dy < 30) {
            if (dx < 0 && currentIdx < questions.length - 1) {
              // Swipe kiri = soal berikutnya
              setCurrentIdx((prev) => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (dx > 0 && currentIdx > 0) {
              // Swipe kanan = soal sebelumnya
              setCurrentIdx((prev) => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }}
      >
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
          <div className="max-w-5xl mx-auto w-full">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 sm:p-6 shadow-sm"
            >
              {/* Question Info Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                    {currentIdx + 1}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mb-1.5">Soal nomor {currentIdx + 1} dari {questions.length}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{currentQuestion?.category || 'Umum'}</span>
                      {currentQuestion?.sub_category && (
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {currentQuestion.sub_category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-3 mb-4">
                {currentQuestion?.question_image_url && (
                  <div className="flex justify-center">
                    <img
                      src={currentQuestion.question_image_url}
                      alt="Gambar soal"
                      className="max-w-full max-h-72 h-auto rounded-xl border border-slate-100 dark:border-white/[0.06]"
                    />
                  </div>
                )}
                <p className="text-[14px] sm:text-[15px] text-slate-800 dark:text-slate-100 leading-[1.75] text-justify font-normal">
                  {currentQuestion?.question_text}
                </p>
              </div>

              {/* Options Grid */}
              <div className="space-y-2.5">
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
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                              : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c1c] hover:border-blue-300"
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
                            "py-1.5 text-center text-[11px] font-semibold border-t",
                            answers[currentQuestion.id] === opt
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/[0.06]"
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
                  <div className="grid grid-cols-1 gap-2.5">
                    {opts.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                        className="group flex items-center gap-3 w-full text-left transition-all active:scale-[0.99]"
                      >
                        <div className={cn(
                          "flex-1 flex items-center gap-3 rounded-xl border transition-all overflow-hidden p-3 sm:p-3.5",
                          answers[currentQuestion.id] === opt
                            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40"
                            : "bg-slate-100 dark:bg-[#2a2a32] border-slate-200/80 dark:border-white/[0.08] group-hover:border-blue-200 dark:group-hover:border-blue-500/30 group-hover:bg-blue-50 dark:group-hover:bg-[#2e2e3a]"
                        )}>
                          <div className={cn(
                            "w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[12px] font-semibold transition-all",
                            answers[currentQuestion.id] === opt
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/15 group-hover:text-blue-600"
                          )}>
                            {opt}
                          </div>
                          {currentQuestion?.category === 'TIU' && currentQuestion?.option_images?.[opt] ? (
                            <img
                              src={currentQuestion.option_images[opt]}
                              alt={`Opsi ${opt}`}
                              className="max-w-full h-auto block p-1"
                            />
                          ) : (
                            <p className={cn(
                              "text-[12.5px] sm:text-[13px] leading-relaxed text-justify font-[500]",
                              answers[currentQuestion.id] === opt
                                ? "text-blue-900 dark:text-blue-100 font-semibold"
                                : "text-slate-700 dark:text-slate-200"
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
              </div>

              {/* Bottom Controls */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const newAnswers = { ...answers };
                    delete newAnswers[currentQuestion.id];
                    setAnswers(newAnswers);
                    if (userId) {
                      localStorage.setItem(`to_answers_${userId}_${questionsId}`, JSON.stringify(newAnswers));
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-medium text-[13px] rounded-xl transition-all order-2 sm:order-1"
                >
                  Batalkan Jawaban
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    onClick={() => {
                      setCurrentIdx((prev) => Math.max(0, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentIdx === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 rounded-xl font-medium text-[13px] hover:bg-slate-200 dark:hover:bg-white/[0.08] disabled:opacity-30 transition-all active:scale-[0.98]"
                  >
                    Sebelumnya
                  </button>

                  {currentIdx === questions.length - 1 ? (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[13px] rounded-xl transition-all shadow-sm active:scale-[0.98]"
                    >
                      Selesai
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13px] rounded-xl transition-all shadow-sm active:scale-[0.98]"
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
          "fixed lg:sticky lg:top-16 right-0 w-80 z-30 transition-transform duration-300 transform lg:translate-x-0 shadow-2xl lg:shadow-none shrink-0 engine-surface dark:bg-[#0b0b0e] lg:bg-transparent dark:lg:bg-transparent h-[calc(100dvh-3.5rem)] lg:h-auto",
          showSidebar ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4 lg:p-6 lg:pl-0">
            <div className="bg-white dark:bg-[#161616] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.06] flex flex-col max-h-[calc(100vh-8rem)] shadow-sm">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white">Navigasi Soal</h3>
                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Terjawab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Kosong</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
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
                        "h-9 rounded-lg text-[12px] font-semibold transition-all border",
                        idx === currentIdx
                          ? "bg-blue-600 text-white border-blue-600 scale-105"
                          : answers[q.id]
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-white/[0.12]"
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

      {/* Anti-Cheat Warning Modal */}
      {cheatWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-7 max-w-sm w-full shadow-2xl border-2 border-amber-400 dark:border-amber-500/60 text-center"
          >
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">Peringatan Anti-Cheat</h3>
            <p className="text-amber-600 dark:text-amber-400 text-[13px] font-semibold mb-3 uppercase tracking-wide">Pelanggaran ke-{cheatWarning.count} dari 3</p>
            <p className="text-slate-600 dark:text-slate-300 text-[14px] leading-relaxed mb-2">
              {cheatWarning.msg}.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed mb-6">
              Aktivitas ini <span className="font-semibold text-red-600 dark:text-red-400">dicatat dan dilaporkan</span> ke sistem. Jika mencapai 3 pelanggaran, ujian akan dikirim otomatis.
            </p>
            {cheatWarning.count >= 3 ? (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl mb-5">
                <p className="text-red-700 dark:text-red-400 text-[13px] font-semibold">Batas pelanggaran tercapai. Ujian akan dikirim otomatis.</p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl mb-5">
                <p className="text-amber-700 dark:text-amber-400 text-[13px] font-medium">Sisa toleransi: <span className="font-bold">{3 - cheatWarning.count} pelanggaran lagi</span> sebelum ujian dikirim otomatis.</p>
              </div>
            )}
            <button
              onClick={() => setCheatWarning(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold text-[14px] rounded-xl transition-all active:scale-[0.98]"
            >
              Saya Mengerti, Lanjutkan Ujian
            </button>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-[#161616] rounded-2xl p-7 sm:p-8 max-w-sm w-full shadow-2xl text-center border border-slate-200/80 dark:border-white/[0.08]"
          >
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-600 dark:text-blue-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-[19px] font-semibold text-slate-800 dark:text-white mb-2">Selesai mengerjakan?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[14px] mb-2 leading-relaxed">
              Kamu sudah menjawab <span className="font-semibold text-slate-700 dark:text-slate-200">{Object.keys(answers).length} dari {questions.length}</span> soal.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-7 leading-relaxed">
              Sisa waktu <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatTime(remainingSeconds())}</span>. Jawaban tidak bisa diubah setelah dikirim.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleSubmit()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[14px] rounded-xl transition-all active:scale-[0.98]"
              >
                Ya, kirim jawaban
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3.5 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 font-medium text-[14px] rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
              >
                Lanjutkan mengerjakan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
