import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Data Review Tidak Ada</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Maaf, terjadi kesalahan saat memuat data pembahasan. Silakan coba buka kembali.</p>
        <button onClick={onBack} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Kembali</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userAnswer = result.score_details?.[currentIndex]?.userAnswer;
  const isCorrect = currentQuestion.category === 'TKP' ? true : currentQuestion.correct_answer === userAnswer;

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">Pembahasan Tryout</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Nomor {currentIndex + 1}</span>
               <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{questions.length} Soal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             disabled={currentIndex === 0}
             onClick={() => setCurrentIndex(prev => prev - 1)}
             className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
           >
             <ChevronLeft className="w-5 h-5" />
           </button>
           <button 
             disabled={currentIndex === questions.length - 1}
             onClick={() => setCurrentIndex(prev => prev + 1)}
             className="p-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-lg shadow-slate-200 dark:shadow-none"
           >
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Navigation Grid (Sidebar) */}
        <aside className="hidden lg:flex w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-10 shadow-xl dark:shadow-none">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-5">Navigasi Review</h3>
            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 text-emerald-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></div> Benar</span>
              <span className="flex items-center gap-2 text-red-600"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></div> Salah</span>
              <span className="flex items-center gap-2 text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div> Kosong</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const ans = result.score_details?.[idx]?.userAnswer;
                let statusClass = "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"; // Kosong
                
                if (q.category === 'TKP' && ans) {
                  statusClass = "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 font-black";
                } else if (ans) {
                  statusClass = q.correct_answer === ans 
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 font-black" 
                    : "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-black";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-[11px] transition-all duration-300 border-2",
                      currentIndex === idx 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 z-10" 
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

        {/* Center/Right: Question and Explanation */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-slate-50/50 dark:bg-slate-950/50 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Status Header Overlay */}
            <div className={cn(
              "p-8 rounded-[2.5rem] border-2 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-500",
              currentQuestion.category === 'TKP' 
                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30 shadow-amber-500/5' 
                : isCorrect 
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30 shadow-emerald-500/5' 
                  : 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30 shadow-red-500/5'
            )}>
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-105",
                  currentQuestion.category === 'TKP' ? 'bg-amber-500 text-white' : isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                )}>
                  {currentQuestion.category === 'TKP' ? (
                    <BookOpen className="w-8 h-8" />
                  ) : isCorrect ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className={cn(
                    "text-xl font-black tracking-tight",
                    currentQuestion.category === 'TKP' ? 'text-amber-900 dark:text-amber-200' : isCorrect ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'
                  )}>
                    {currentQuestion.category === 'TKP' ? 'Pembahasan TKP' : isCorrect ? 'Jawaban Kamu Benar!' : 'Jawaban Kamu Salah'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Kategori:</span>
                     <span className="px-2.5 py-0.5 bg-white/40 dark:bg-slate-800/40 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20">
                       {currentQuestion.category}
                     </span>
                  </div>
                </div>
              </div>
              
              {!isCorrect && currentQuestion.category !== 'TKP' && (
                <div className="px-4 py-2 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-white/20 backdrop-blur-sm">
                   <p className="text-[9px] font-black text-red-800 dark:text-red-400 uppercase tracking-widest mb-0.5">Kunci Jawaban</p>
                   <p className="text-lg font-black text-red-900 dark:text-red-200 uppercase leading-none">Opsi {currentQuestion.correct_answer}</p>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/30 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="text-[15px] text-slate-800 dark:text-white mb-8 font-bold whitespace-pre-wrap leading-relaxed text-justify">
                  {currentQuestion.question_text}
                </div>
                
                {currentQuestion.question_image_url && (
                  <div className="mb-10 group/img overflow-hidden rounded-[2.5rem] border-4 border-slate-50 dark:border-slate-800 shadow-lg">
                    <img src={currentQuestion.question_image_url} alt="Gambar Soal" className="w-full h-auto transition-transform duration-700 group-hover/img:scale-105" />
                  </div>
                )}

                <div className="space-y-1.5">
                  {Object.entries(currentQuestion.options || {}).map(([label, text]) => {
                    const isUserSelected = userAnswer === label;
                    const isActuallyCorrect = currentQuestion.correct_answer === label;
                    
                    let optionClass = "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50";
                    let badgeClass = "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700";

                    if (isActuallyCorrect && currentQuestion.category !== 'TKP') {
                      optionClass = "border-emerald-500/50 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/10 ring-2 ring-emerald-500/10";
                      badgeClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30";
                    } else if (isUserSelected && !isCorrect && currentQuestion.category !== 'TKP') {
                      optionClass = "border-red-500/50 dark:border-red-500/50 bg-red-50 dark:bg-red-900/10 ring-2 ring-red-500/10";
                      badgeClass = "bg-red-500 text-white shadow-lg shadow-red-500/30";
                    } else if (isUserSelected && currentQuestion.category === 'TKP') {
                      optionClass = "border-amber-500/50 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/10 ring-2 ring-amber-500/10";
                      badgeClass = "bg-amber-500 text-white shadow-lg shadow-amber-500/30";
                    }

                    return (
                      <div 
                        key={label}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300",
                          optionClass
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all",
                          badgeClass
                        )}>
                          {label.toUpperCase()}
                        </div>
                        <div className="flex-1">
                           <p className={cn(
                             "text-[13px] font-bold leading-relaxed",
                             isActuallyCorrect && currentQuestion.category !== 'TKP' ? "text-emerald-900 dark:text-emerald-300" :
                             isUserSelected && !isCorrect ? "text-red-900 dark:text-red-300" :
                             "text-slate-700 dark:text-slate-300"
                           )}>
                             {String(text)}
                           </p>
                           {currentQuestion.category === 'TKP' && (
                             <div className="mt-1 flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                               <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Skor: {currentQuestion.tkp_scores?.[label] || 0}</span>
                             </div>
                           )}
                        </div>
                        {isActuallyCorrect && currentQuestion.category !== 'TKP' && (
                          <div className="hidden sm:flex px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-emerald-500/20 uppercase tracking-widest">Kunci</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Explanation Section */}
            {(currentQuestion.explanation || currentQuestion.explanation_image_url) && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-6">
                  <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Pembahasan</h3>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  {currentQuestion.explanation && (
                    <div className="text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-justify whitespace-pre-wrap mb-6">
                      {currentQuestion.explanation}
                    </div>
                  )}
                  {currentQuestion.explanation_image_url && (
                    <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg">
                      <img src={currentQuestion.explanation_image_url} alt="Gambar Pembahasan" className="w-full h-auto" />
                    </div>
                  )}
                  {!currentQuestion.explanation && !currentQuestion.explanation_image_url && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                       <AlertCircle className="w-10 h-10 mb-2" />
                       <p className="text-sm font-bold uppercase tracking-widest">Belum ada penjelasan teknis</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER MOBILE NAV */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-30">
        <button 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="flex-1 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest"
        >
          Mundur
        </button>
        <button 
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
