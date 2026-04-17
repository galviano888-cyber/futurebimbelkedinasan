import { CheckCircle2, XCircle, Trophy, ArrowLeft, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TryoutResult } from "@/data/tryoutQuestions";
import { TRYOUT_CONFIG } from "@/data/tryoutQuestions";

interface TryoutResultProps {
  result: TryoutResult;
  onBack: () => void;
  onReview?: () => void;
}

export function TryoutResultView({ result, onBack, onReview }: TryoutResultProps) {
  const { passingScore } = TRYOUT_CONFIG;
  const twkPass = result.twkScore >= passingScore.twk;
  const tiuPass = result.tiuScore >= passingScore.tiu;
  const tkpPass = result.tkpScore >= passingScore.tkp;
  const allPass = twkPass && tiuPass && tkpPass;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} menit ${s} detik`;
  };

  const scorePercentage = result.totalMax > 0 
    ? Math.round((result.totalScore / result.totalMax) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-7">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
        <h1 className="text-slate-900 font-black text-3xl tracking-tight flex items-center gap-3">
          <Trophy className={cn("w-8 h-8", allPass ? "text-amber-500" : "text-slate-400")} />
          Hasil Tryout
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Berikut adalah ringkasan hasil pengerjaan tryout SKD Anda.
        </p>
      </div>

      {/* Status Card */}
      <div className={cn(
        "rounded-2xl p-6 sm:p-8 border-2 text-center",
        allPass
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      )}>
        <div className="flex justify-center mb-3">
          {allPass ? (
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          ) : (
            <XCircle className="w-14 h-14 text-red-500" />
          )}
        </div>
        <h2 className={cn("text-2xl font-black mb-1", allPass ? "text-emerald-700" : "text-red-700")}>
          {allPass ? "LULUS! 🎉" : "BELUM LULUS"}
        </h2>
        <p className={cn("text-sm font-medium", allPass ? "text-emerald-600" : "text-red-600")}>
          {allPass
            ? "Selamat! Anda memenuhi semua passing grade SKD."
            : "Masih ada kategori yang belum memenuhi passing grade."}
        </p>
      </div>

      {/* Total Score */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" strokeWidth="10" fill="none" className="stroke-slate-100" />
              <circle
                cx="60" cy="60" r="52" strokeWidth="10" fill="none"
                className={cn(allPass ? "stroke-emerald-500" : "stroke-blue-500")}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - scorePercentage / 100)}`}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{result.totalScore}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/ {result.totalMax}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Skor Total</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Target className="w-4 h-4 text-blue-500" />
                <span>{result.answeredCount}/{result.totalQuestions} dijawab</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{formatTime(result.timeUsed)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard
          label="TWK"
          fullLabel="Tes Wawasan Kebangsaan"
          score={result.twkScore}
          max={result.twkMax}
          passing={passingScore.twk}
          passed={twkPass}
          correct={result.twkCorrect}
          color="blue"
        />
        <ScoreCard
          label="TIU"
          fullLabel="Tes Intelegensia Umum"
          score={result.tiuScore}
          max={result.tiuMax}
          passing={passingScore.tiu}
          passed={tiuPass}
          correct={result.tiuCorrect}
          color="emerald"
        />
        <ScoreCard
          label="TKP"
          fullLabel="Tes Karakteristik Pribadi"
          score={result.tkpScore}
          max={result.tkpMax}
          passing={passingScore.tkp}
          passed={tkpPass}
          correct={result.tkpCorrect}
          color="amber"
        />
      </div>

      {/* Action */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 pb-8">
        {onReview && (
          <button
            onClick={onReview}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            Lihat Pembahasan
          </button>
        )}
        <button
          onClick={onBack}
          className="px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all shadow-sm"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}

function ScoreCard({
  label, fullLabel, score, max, passing, passed, correct, color,
}: {
  label: string; fullLabel: string; score: number; max: number;
  passing: number; passed: boolean; correct: number;
  color: "blue" | "emerald" | "amber";
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const colorMap = {
    blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-500" },
    emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-500" },
    amber: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-500" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className={cn("text-white text-xs font-bold px-3 py-1 rounded-full", c.badge)}>
          {label}
        </span>
        {passed ? (
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Lulus
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500 text-xs font-bold">
            <XCircle className="w-4 h-4" /> Tidak Lulus
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-medium mb-3">{fullLabel}</p>

      <div className="text-3xl font-black text-slate-900 mb-1">
        {score} <span className="text-sm font-semibold text-slate-400">/ {max}</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-700", c.bg)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">
          Passing Grade: <span className="font-bold text-slate-600">{passing}</span>
        </span>
        <span className="text-slate-400">
          Benar: <span className="font-bold text-slate-600">{correct}</span>
        </span>
      </div>
    </div>
  );
}
