import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface TryoutReviewViewProps {
  result: any;
  questions: any[];
  onBack: () => void;
}

export function TryoutReviewView({ result, questions, onBack }: TryoutReviewViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 dark:bg-[#0b0b0e] p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mb-5">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Data Review Tidak Ada</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-7 max-w-sm">Maaf, terjadi kesalahan saat memuat data pembahasan. Silakan coba buka kembali.</p>
        <button onClick={onBack} className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[14px] rounded-xl transition-all active:scale-[0.98]">Kembali</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userAnswer = result.answers?.[currentQuestion.id] || result.score_details?.[currentIndex]?.userAnswer;
  const isCorrect = currentQuestion.category === 'TKP' ? true : currentQuestion.correct_answer === userAnswer;

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-[#0b0b0e] overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#161616] border-b border-slate-200/80 dark:border-white/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white text-[15px] leading-none">Pembahasan Tryout</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Soal {currentIndex + 1} / {questions.length}</span>
              {currentQuestion.sub_category && (
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">{currentQuestion.sub_category}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="p-2 border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigasi */}
        <aside className="hidden lg:flex w-64 bg-white dark:bg-[#161616] border-r border-slate-200/80 dark:border-white/[0.06] flex-col shrink-0">
          <div className="p-5 border-b border-slate-100 dark:border-white/[0.06]">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Navigasi Soal</p>
            <div className="flex flex-wrap gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Benar</span>
              <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400"><div className="w-2 h-2 rounded-full bg-red-500" /> Salah</span>
              <span className="flex items-center gap-1.5 text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Kosong</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const ans = result.answers?.[q.id] || result.score_details?.[idx]?.userAnswer;
                let statusClass = "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] text-slate-400";

                if (q.category === 'TKP' && ans) {
                  statusClass = "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400";
                } else if (ans) {
                  statusClass = q.correct_answer === ans
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 text-red-500 dark:text-red-400";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-9 rounded-lg text-[11px] font-semibold border transition-all",
                      currentIndex === idx
                        ? "bg-blue-600 border-blue-600 text-white scale-105 shadow-sm"
                        : statusClass
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Konten Utama */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-10 space-y-4">

            {/* Status Banner */}
            <div className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border",
              currentQuestion.category === 'TKP'
                ? 'bg-amber-50 dark:bg-amber-500/[0.07] border-amber-200 dark:border-amber-500/20'
                : isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-500/[0.07] border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-red-50 dark:bg-red-500/[0.07] border-red-200 dark:border-red-500/20'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  currentQuestion.category === 'TKP' ? 'bg-amber-500 text-white' : isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                )}>
                  {currentQuestion.category === 'TKP' ? <BookOpen className="w-5 h-5" /> : isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className={cn(
                    "text-[14px] font-bold",
                    currentQuestion.category === 'TKP' ? 'text-amber-800 dark:text-amber-300' : isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
                  )}>
                    {currentQuestion.category === 'TKP' ? 'Soal TKP' : isCorrect ? 'Jawaban Benar' : 'Jawaban Kurang Tepat'}
                  </p>
                  <span className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-md inline-block mt-0.5",
                    currentQuestion.category === 'TKP' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : isCorrect ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  )}>
                    {currentQuestion.category}
                  </span>
                </div>
              </div>

              {!isCorrect && currentQuestion.category !== 'TKP' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/[0.05] rounded-xl border border-red-100 dark:border-red-500/20">
                  <p className="text-[11px] text-slate-400">Kunci Jawaban:</p>
                  <p className="text-[15px] font-bold text-red-600 dark:text-red-400">Opsi {currentQuestion.correct_answer}</p>
                </div>
              )}
            </div>

            {/* Kartu Soal */}
            <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5 sm:p-6">
              {currentQuestion.question_image_url && (
                <div className="flex justify-center mb-5">
                  <img
                    src={currentQuestion.question_image_url}
                    alt="Gambar Soal"
                    className="max-w-full max-h-60 h-auto rounded-xl border border-slate-100 dark:border-white/[0.06]"
                  />
                </div>
              )}

              <p className="text-[15px] text-slate-800 dark:text-slate-100 font-medium leading-relaxed mb-5 whitespace-pre-wrap text-justify">
                {currentQuestion.question_text}
              </p>

              {/* Opsi Jawaban */}
              {(() => {
                const opts = ['A', 'B', 'C', 'D', 'E'];
                const allHaveImages = currentQuestion.category === 'TIU' &&
                  opts.every(o => !!currentQuestion.option_images?.[o]);

                const getOptionClasses = (label: string) => {
                  const isUserSelected = userAnswer === label;
                  const isActuallyCorrect = currentQuestion.correct_answer === label;
                  let optionClass = "border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03]";
                  let badgeClass = "bg-slate-200 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400";
                  if (isActuallyCorrect && currentQuestion.category !== 'TKP') {
                    optionClass = "border-emerald-400/60 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/[0.07]";
                    badgeClass = "bg-emerald-500 text-white";
                  } else if (isUserSelected && !isCorrect && currentQuestion.category !== 'TKP') {
                    optionClass = "border-red-400/60 dark:border-red-500/30 bg-red-50 dark:bg-red-500/[0.07]";
                    badgeClass = "bg-red-500 text-white";
                  } else if (isUserSelected && currentQuestion.category === 'TKP') {
                    optionClass = "border-amber-400/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/[0.07]";
                    badgeClass = "bg-amber-500 text-white";
                  }
                  return { optionClass, badgeClass, isUserSelected, isActuallyCorrect };
                };

                if (allHaveImages) {
                  return (
                    <div className="grid grid-cols-2 gap-2.5">
                      {opts.map((label) => {
                        const { optionClass, badgeClass, isActuallyCorrect } = getOptionClasses(label);
                        return (
                          <div key={label} className={cn("relative rounded-xl border-2 overflow-hidden flex flex-col transition-all", optionClass)}>
                            <img src={currentQuestion.option_images[label]} alt={`Opsi ${label}`} className="w-auto max-w-full h-auto max-h-36 block mx-auto p-2" />
                            <div className={cn(
                              "py-1.5 flex items-center justify-center gap-1.5 border-t text-[11px] font-semibold",
                              badgeClass.includes('emerald') ? "bg-emerald-500 text-white border-emerald-500" :
                              badgeClass.includes('red') ? "bg-red-500 text-white border-red-500" :
                              "bg-slate-50 dark:bg-white/[0.04] text-slate-400 border-slate-100 dark:border-white/[0.06]"
                            )}>
                              {label}
                              {isActuallyCorrect && currentQuestion.category !== 'TKP' && <span className="text-[9px] opacity-80">✓ Kunci</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {opts.map((label) => {
                      const text = (currentQuestion.options || {})[label];
                      const { optionClass, badgeClass, isUserSelected, isActuallyCorrect } = getOptionClasses(label);
                      return (
                        <div key={label} className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all", optionClass)}>
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0", badgeClass)}>
                            {label}
                          </div>
                          <div className="flex-1">
                            {currentQuestion.category === 'TIU' && currentQuestion.option_images?.[label] ? (
                              <img src={currentQuestion.option_images[label]} alt={`Opsi ${label}`} className="max-w-full h-auto rounded-lg p-1" />
                            ) : (
                              <p className={cn(
                                "text-[13.5px] leading-relaxed text-justify",
                                isActuallyCorrect && currentQuestion.category !== 'TKP' ? "text-emerald-800 dark:text-emerald-300 font-medium" :
                                isUserSelected && !isCorrect ? "text-red-800 dark:text-red-300 font-medium" :
                                "text-slate-700 dark:text-slate-300"
                              )}>
                                {String(text ?? '')}
                              </p>
                            )}
                            {currentQuestion.category === 'TKP' && (
                              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-0.5 inline-block">Skor: {currentQuestion.tkp_scores?.[label] || 0}</span>
                            )}
                          </div>
                          {isActuallyCorrect && currentQuestion.category !== 'TKP' && (
                            <span className="shrink-0 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-semibold rounded-lg">Kunci</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Pembahasan */}
            {(currentQuestion.explanation || currentQuestion.explanation_image_url) && (
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Pembahasan</h3>
                </div>
                <div className="p-5 sm:p-6">
                  {currentQuestion.explanation && (
                    <p className="text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4 text-justify">
                      {currentQuestion.explanation}
                    </p>
                  )}
                  {currentQuestion.explanation_image_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-white/[0.06]">
                      <img src={currentQuestion.explanation_image_url} alt="Gambar Pembahasan" className="w-full h-auto" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Footer Nav */}
      <div className="lg:hidden bg-white dark:bg-[#161616] border-t border-slate-200/80 dark:border-white/[0.06] px-4 py-3 flex gap-3 shrink-0">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="flex-1 py-3 border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all"
        >
          Sebelumnya
        </button>
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[12px] font-semibold disabled:opacity-30 transition-all"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
