import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  List,
  X,
  Loader2
} from "lucide-react";
import type {
  TryoutQuestion,
  TryoutResult,
  QuestionCategory,
} from "@/data/tryoutQuestions";
import { TRYOUT_CONFIG } from "@/data/tryoutQuestions";
import { supabase } from "@/lib/supabaseClient";

interface TryoutEngineProps {
  packageId?: string | null;
  questions?: TryoutQuestion[]; // fallback for demo
  onFinish: (result: TryoutResult) => void;
  onExit: () => void;
}

const categoryColors: Record<QuestionCategory, string> = {
  TWK: "bg-blue-500",
  TIU: "bg-emerald-500",
  TKP: "bg-amber-500",
};

const categoryLabels: Record<QuestionCategory, string> = {
  TWK: "Tes Wawasan Kebangsaan",
  TIU: "Tes Intelegensia Umum",
  TKP: "Tes Karakteristik Pribadi",
};

export function TryoutEngineView({
  packageId,
  questions: initialQuestions = [],
  onFinish,
  onExit,
}: TryoutEngineProps) {
  const [questions, setQuestions] = useState<TryoutQuestion[]>(initialQuestions);
  const [loading, setLoading] = useState(!!packageId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(100 * 60); // Default 100 minutes
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showNavMobile, setShowNavMobile] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      if (!packageId || !supabase) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch package for duration
        const { data: pkgData } = await supabase.from('tryout_packages').select('duration_minutes').eq('id', packageId).single();
        if (pkgData && pkgData.duration_minutes) {
          setTimeLeft(pkgData.duration_minutes * 60);
        }

        // Fetch questions
        const { data, error } = await supabase
          .from('tryout_questions')
          .select('*')
          .eq('package_id', packageId)
          .order('number', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedQuestions: TryoutQuestion[] = data.map((q: any) => {
            // Map options object to array
            const optionsObj = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {});
            const tkpScoresObj = typeof q.tkp_scores === 'string' ? JSON.parse(q.tkp_scores) : (q.tkp_scores || {});
            
            const optionsArray = [];
            const optionKeys = ['A', 'B', 'C', 'D', 'E'];
            
            for (const key of optionKeys) {
              if (optionsObj[key]) {
                // Determine score
                let score = 0;
                if (q.category === 'TKP') {
                  score = tkpScoresObj[key] || 0;
                } else {
                  score = (q.correct_answer === key) ? 5 : 0;
                }

                optionsArray.push({
                  label: key,
                  text: optionsObj[key],
                  score: score
                });
              }
            }

            return {
              id: q.number,
              category: q.category as QuestionCategory,
              text: q.question_text,
              question_image_url: q.question_image_url,
              options: optionsArray,
              explanation: q.explanation,
              fast_tips: q.fast_tips,
              correct_answer: q.correct_answer
            };
          });

          setQuestions(formattedQuestions);
        }
      } catch (err) {
        console.error("Gagal mengambil soal:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [packageId]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = useCallback(() => {
    const timeUsed = TRYOUT_CONFIG.timeLimit - timeLeft;
    let twkScore = 0,
      tiuScore = 0,
      tkpScore = 0;
    let twkCorrect = 0,
      tiuCorrect = 0,
      tkpCorrect = 0;
    let twkMax = 0,
      tiuMax = 0,
      tkpMax = 0;

    questions.forEach((q) => {
      const maxScore = Math.max(...q.options.map((o) => o.score));
      if (q.category === "TWK") twkMax += maxScore;
      if (q.category === "TIU") tiuMax += maxScore;
      if (q.category === "TKP") tkpMax += maxScore;

      const selected = answers[q.id];
      if (selected) {
        const option = q.options.find((o) => o.label === selected);
        const score = option?.score || 0;
        if (q.category === "TWK") {
          twkScore += score;
          if (score > 0) twkCorrect++;
        }
        if (q.category === "TIU") {
          tiuScore += score;
          if (score > 0) tiuCorrect++;
        }
        if (q.category === "TKP") {
          tkpScore += score;
          tkpCorrect++; // TKP selalu dapat skor
        }
      }
    });

    const result: TryoutResult = {
      twkScore,
      tiuScore,
      tkpScore,
      totalScore: twkScore + tiuScore + tkpScore,
      twkMax,
      tiuMax,
      tkpMax,
      totalMax: twkMax + tiuMax + tkpMax,
      twkCorrect,
      tiuCorrect,
      tkpCorrect,
      totalQuestions: questions.length,
      answeredCount: Object.keys(answers).length,
      timeUsed,
      questions,
      answers,
    };

    onFinish(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions, timeLeft, onFinish]);

  useEffect(() => {
    if (isTimeUp) {
      handleSubmit();
    }
  }, [isTimeUp, handleSubmit]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h} Jam ${m.toString().padStart(2, "0")} Menit ${s.toString().padStart(2, "0")} Detik`;
  };

  const selectAnswer = (questionId: number, label: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const cancelAnswer = (questionId: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    setShowNavMobile(false);
  };

  const answeredCount = Object.keys(answers).length;
  const isWarning = timeLeft < 300; // < 5 menit

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentIndex < questions.length - 1) {
        setCurrentIndex((p) => p + 1);
      }
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((p) => p - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat soal tryout...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
        <p className="text-slate-800 font-bold text-lg">Soal belum tersedia</p>
        <p className="text-slate-500 max-w-md mt-1">Paket ini tidak memiliki soal atau terjadi kesalahan server.</p>
        <button onClick={onExit} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Katalog</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">F</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              Tryout SKD
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {questions.length} Soal • {answeredCount} Dijawab
            </p>
          </div>
        </div>

        {/* Timer */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors",
            isWarning
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-slate-100 text-slate-700"
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{formatTime(timeLeft)}</span>
          <span className="sm:hidden">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNavMobile(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <List className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => setShowConfirmExit(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — QUESTION AREA */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            {/* Category badge + Question number */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className={cn(
                  "text-white text-xs font-bold px-3 py-1 rounded-full",
                  categoryColors[currentQuestion.category]
                )}
              >
                {currentQuestion.category}
              </span>
              <span className="text-slate-400 text-sm font-medium">
                {categoryLabels[currentQuestion.category]}
              </span>
            </div>

            <h2 className="text-slate-500 text-sm font-semibold mb-2">
              Soal Nomor{" "}
              <span className="text-slate-900 text-lg font-black">
                {currentQuestion.id}
              </span>
            </h2>

            {/* Question text */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
              <p className="text-slate-800 text-base leading-relaxed whitespace-pre-line">
                {currentQuestion.text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() =>
                      selectAnswer(currentQuestion.id, opt.label)
                    }
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                      )}
                    >
                      {opt.label}
                    </div>
                    <span
                      className={cn(
                        "font-medium transition-colors flex-1",
                        isSelected
                          ? "text-blue-700"
                          : "text-slate-700 group-hover:text-slate-900"
                      )}
                    >
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cancel Answer */}
            {answers[currentQuestion.id] && (
              <button
                onClick={() => cancelAnswer(currentQuestion.id)}
                className="mb-8 px-5 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200"
              >
                Batalkan Jawaban
              </button>
            )}

            {/* Prev/Next Navigation */}
            <div className="flex items-center justify-center gap-4 pb-8">
              <button
                onClick={() =>
                  currentIndex > 0 && setCurrentIndex(currentIndex - 1)
                }
                disabled={currentIndex === 0}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border",
                  currentIndex === 0
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-white"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Selesai Mengerjakan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — NAVIGATION PANEL (Desktop) */}
        <div className="hidden lg:flex flex-col w-[300px] bg-white border-l border-slate-200 flex-shrink-0">
          <NavigationPanel
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onGoTo={goToQuestion}
            onSubmit={() => setShowConfirmSubmit(true)}
          />
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {showNavMobile && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Nomor Soal</h3>
              <button
                onClick={() => setShowNavMobile(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <NavigationPanel
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              onGoTo={goToQuestion}
              onSubmit={() => setShowConfirmSubmit(true)}
            />
          </div>
        </div>
      )}

      {/* CONFIRM EXIT MODAL */}
      {showConfirmExit && (
        <ConfirmModal
          icon={<LogOut className="w-8 h-8 text-red-500" />}
          title="Keluar dari Tryout?"
          description="Semua jawaban Anda akan hilang dan tidak tersimpan."
          confirmText="Ya, Keluar"
          cancelText="Lanjut Mengerjakan"
          onConfirm={onExit}
          onCancel={() => setShowConfirmExit(false)}
          danger
        />
      )}

      {/* CONFIRM SUBMIT MODAL */}
      {showConfirmSubmit && (
        <ConfirmModal
          icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
          title="Selesai Mengerjakan?"
          description={`Anda telah menjawab ${answeredCount} dari ${questions.length} soal. Soal yang belum dijawab akan mendapat skor 0.`}
          confirmText="Ya, Kumpulkan"
          cancelText="Periksa Kembali"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirmSubmit(false)}
        />
      )}
    </div>
  );
}

/* ===== SUB-COMPONENTS ===== */

function NavigationPanel({
  questions,
  currentIndex,
  answers,
  onGoTo,
  onSubmit,
}: {
  questions: TryoutQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  onGoTo: (i: number) => void;
  onSubmit: () => void;
}) {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Dijawab</span>
          <span className="font-bold text-slate-900">
            {answeredCount}/{questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-[10px] text-slate-500 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          Aktif
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          Dijawab
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-200" />
          Belum
        </div>
      </div>

      {/* Question Number Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Nomor Soal
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = !!answers[q.id];
            return (
              <button
                key={q.id}
                onClick={() => onGoTo(idx)}
                className={cn(
                  "h-10 rounded-lg text-xs font-bold transition-all duration-150",
                  isCurrent
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-105"
                    : isAnswered
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {q.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={onSubmit}
          className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 uppercase tracking-wide"
        >
          Selesai Mengerjakan
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  icon,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm transition-all",
              danger
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
