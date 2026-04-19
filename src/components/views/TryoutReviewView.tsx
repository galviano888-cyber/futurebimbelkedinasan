import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { TryoutResult } from "@/data/tryoutQuestions";

interface TryoutReviewViewProps {
  result: TryoutResult;
  onBack: () => void;
}

export function TryoutReviewView({ result, onBack }: TryoutReviewViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = result.questions || [];
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) return null;

  const userAnswer = result.answers?.[currentQuestion.id];
  const isCorrect = currentQuestion.category === 'TKP' ? true : currentQuestion.correct_answer === userAnswer;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Pembahasan Tryout</h1>
            <p className="text-sm text-slate-500">Soal {currentIndex + 1} dari {questions.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Navigation Grid (Hidden on Mobile, shown later maybe) */}
        <div className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-1">Navigasi Soal</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Benar</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Salah</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Kosong</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = result.answers?.[q.id];
                let bg = "bg-slate-100 text-slate-400"; // Kosong
                if (q.category === 'TKP' && ans) bg = "bg-amber-100 text-amber-700 font-bold border border-amber-300"; // TKP terjawab
                else if (ans) {
                  bg = q.correct_answer === ans ? "bg-emerald-100 text-emerald-700 font-bold border border-emerald-300" : "bg-red-100 text-red-700 font-bold border border-red-300";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg flex items-center justify-center text-sm transition-all ${currentIndex === idx ? 'ring-2 ring-offset-2 ring-blue-500 shadow-sm' : ''} ${bg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Question and Explanation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Status Card */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${currentQuestion.category === 'TKP' ? 'bg-amber-50 border-amber-200' : isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {currentQuestion.category === 'TKP' ? (
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              ) : isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className={`font-bold ${currentQuestion.category === 'TKP' ? 'text-amber-800' : isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {currentQuestion.category === 'TKP' ? 'Soal TKP' : isCorrect ? 'Jawaban Anda Benar!' : 'Jawaban Anda Salah'}
                </h3>
                <p className={`text-sm ${currentQuestion.category === 'TKP' ? 'text-amber-700' : isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                  Kategori: {currentQuestion.category}
                </p>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="text-[17px] text-slate-800 mb-6 font-medium whitespace-pre-wrap leading-relaxed">
                {currentQuestion.question_text}
              </div>
              
              {currentQuestion.question_image_url && (
                <div className="mb-6">
                  <img src={currentQuestion.question_image_url} alt="Gambar Soal" className="max-w-full rounded-xl border border-slate-200" />
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(currentQuestion.options || {}).map(([label, text]) => {
                  const isUserSelected = userAnswer === label;
                  const isActuallyCorrect = currentQuestion.correct_answer === label;
                  
                  let optionClass = "border-slate-200 bg-white";
                  let badgeClass = "bg-slate-100 text-slate-500";
                  
                  if (currentQuestion.category === 'TKP') {
                    if (isUserSelected) {
                      optionClass = "border-amber-500 bg-amber-50 ring-1 ring-amber-500 shadow-sm";
                      badgeClass = "bg-amber-500 text-white";
                    }
                  } else {
                    if (isActuallyCorrect) {
                      optionClass = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm";
                      badgeClass = "bg-emerald-500 text-white";
                    } else if (isUserSelected && !isActuallyCorrect) {
                      optionClass = "border-red-500 bg-red-50 ring-1 ring-red-500 shadow-sm";
                      badgeClass = "bg-red-500 text-white";
                    }
                  }

                  const tkpScore = currentQuestion.tkp_scores?.[label];

                  return (
                    <div key={label} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${badgeClass}`}>
                        {label}
                      </div>
                      <div className="flex-1 pt-1.5 flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">{text}</span>
                        {currentQuestion.category === 'TKP' && tkpScore !== undefined && (
                          <span className={`text-xs font-bold w-max px-2 py-0.5 rounded-full ${isUserSelected ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                            Poin: {tkpScore}
                          </span>
                        )}
                      </div>
                      
                      {currentQuestion.category !== 'TKP' && isActuallyCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                      )}
                      {currentQuestion.category !== 'TKP' && isUserSelected && !isActuallyCorrect && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation Card */}
            {(currentQuestion.explanation || currentQuestion.fast_tips) && (
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 space-y-6">
                {currentQuestion.explanation && (
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                      <CheckCircle2 className="w-5 h-5" /> Pembahasan
                    </h3>
                    <div className="text-emerald-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.explanation}
                    </div>
                  </div>
                )}
                
                {currentQuestion.fast_tips && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                      <Lightbulb className="w-5 h-5" /> Tips Cepat
                    </h3>
                    <div className="text-amber-700 text-sm font-medium">
                      {currentQuestion.fast_tips}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Nav */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm disabled:opacity-50 transition-colors shadow-md"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
