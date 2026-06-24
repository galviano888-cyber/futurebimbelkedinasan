import { useState, useEffect } from "react";
import {
  CheckCircle2, 
  XCircle, 
  Trophy, 
  ArrowLeft, 
  Target,
  Zap,
  BarChart3,
  TrendingUp,
  Loader2,
  LayoutDashboard,
  Shield,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TryoutResult } from "@/data/tryoutQuestions";
import { TRYOUT_CONFIG } from "@/data/tryoutQuestions";
import { supabase } from "@/lib/supabaseClient";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";

interface TryoutResultProps {
  result: TryoutResult;
  packageId?: string | null;
  onBack: () => void;
  onReview?: () => void;
}

export function TryoutResultView({ result, packageId, onBack, onReview }: TryoutResultProps) {
  const { passingScore } = TRYOUT_CONFIG;
  const twkPass = result.twkScore >= passingScore.twk;
  const tiuPass = result.tiuScore >= passingScore.tiu;
  const tkpPass = result.tkpScore >= passingScore.tkp;
  const allPass = twkPass && tiuPass && tkpPass;

  const totalCorrect = (result.twkCorrect || 0) + (result.tiuCorrect || 0) + (result.tkpCorrect || 0);

  const [rank, setRank] = useState<{ position: number; total: number } | null>(null);

  useEffect(() => {
    if (packageId) {
      fetchRank();
    }
  }, [packageId]);

  const fetchRank = async () => {
    if (!supabase) return;
    try {
      const { count: totalCount } = await supabase
        .from('fair_package_leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', packageId);

      const { count: rankPosition } = await supabase
        .from('fair_package_leaderboard')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', packageId)
        .gte('total', result.totalScore);

      if (totalCount !== null && rankPosition !== null) {
        setRank({ position: rankPosition, total: totalCount });
      }
    } catch (err) {
      console.error("Error fetching rank:", err);
    }
  };

  const chartData = [
    { subject: 'TWK', A: Math.round((result.twkScore / result.twkMax) * 100), fullMark: 100 },
    { subject: 'TIU', A: Math.round((result.tiuScore / result.tiuMax) * 100), fullMark: 100 },
    { subject: 'TKP', A: Math.round((result.tkpScore / result.tkpMax) * 100), fullMark: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-[13px] font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-slate-800 dark:text-white font-bold text-[26px] sm:text-[30px] tracking-tight flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
               <Trophy className="w-6 h-6" />
            </div>
            Hasil Tryout SKD
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[14px] mt-2">Laporan analisis performa pengerjaan tryout kamu.</p>
        </div>

        <div className="flex gap-3">
           <div className="px-5 py-3 bg-white dark:bg-[#161616] rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
              <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mb-1.5">Total Skor</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{result.totalScore}</div>
           </div>
           <div className="px-5 py-3 bg-white dark:bg-[#161616] rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
              <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mb-1.5">Akurasi</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{Math.round((totalCorrect / result.totalQuestions) * 100)}%</div>
           </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Result Card & Chart */}
        <div className="lg:col-span-1 space-y-6">
          <div className={cn(
            "rounded-2xl p-7 border text-center relative overflow-hidden",
            allPass
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
              : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
          )}>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                {allPass ? (
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}
              </div>
              <h2 className={cn("text-2xl font-bold mb-2 tracking-tight", allPass ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                {allPass ? "Lulus SKD!" : "Belum Lulus"}
              </h2>
              <p className={cn("text-[13px] px-4 leading-relaxed", allPass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {allPass
                  ? "Selamat! Kamu berhasil melampaui passing grade nasional."
                  : "Tetap semangat! Masih ada kategori yang perlu ditingkatkan."}
              </p>
            </div>
          </div>

          {/* Ranking Card */}
          <div className="bg-slate-900 dark:bg-[#161616] rounded-2xl p-7 border border-slate-800 dark:border-white/[0.06] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-8 -mt-8" />
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                      <TrendingUp className="w-4 h-4" />
                   </div>
                   <h3 className="text-white font-semibold text-[15px]">Peringkat Nasional</h3>
                </div>

                {rank ? (
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white tracking-tight">
                      #{rank.position} <span className="text-slate-500 text-[13px] font-medium">dari {rank.total}</span>
                    </div>
                    <p className="text-blue-400 text-[12px] font-medium pt-2">
                      {rank.position <= 10 ? "Kamu Top 10 Nasional!" :
                       rank.position <= 50 ? "Pencapaian luar biasa!" :
                       "Terus tingkatkan!"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-[13px]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghitung peringkat...
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-[#161616] rounded-2xl p-7 border border-slate-200/80 dark:border-white/[0.06]">
             <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                   <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-800 dark:text-white">Peta Kekuatan</h3>
             </div>

             <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" className="dark:opacity-10" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    />
                    <Radar
                      name="Performa"
                      dataKey="A"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 mt-3">Persentase penguasaan materi</p>
          </div>
        </div>

        {/* Right Column: Detailed Categories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DetailedScoreCard
              label="TWK"
              fullLabel="Tes Wawasan Kebangsaan"
              score={result.twkScore}
              max={result.twkMax}
              passing={passingScore.twk}
              passed={twkPass}
              correct={result.twkCorrect}
              color="blue"
              icon={<Shield className="w-5 h-5" />}
              description="Menilai penguasaan pengetahuan dan kemampuan mengimplementasikan nilai-nilai pilar kebangsaan."
            />
            <DetailedScoreCard
              label="TIU"
              fullLabel="Tes Intelegensia Umum"
              score={result.tiuScore}
              max={result.tiuMax}
              passing={passingScore.tiu}
              passed={tiuPass}
              correct={result.tiuCorrect}
              color="emerald"
              icon={<Zap className="w-5 h-5" />}
              description="Menilai kemampuan verbal, numerik, dan figural untuk mengukur tingkat kecerdasan berpikir."
            />
            <DetailedScoreCard
              label="TKP"
              fullLabel="Tes Karakteristik Pribadi"
              score={result.tkpScore}
              max={result.tkpMax}
              passing={passingScore.tkp}
              passed={tkpPass}
              correct={result.tkpCorrect}
              color="amber"
              icon={<User className="w-5 h-5" />}
              description="Menilai perilaku terkait pelayanan publik, sosial budaya, TIK, profesionalisme, dan jejaring kerja."
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-900 dark:bg-[#161616] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 border border-transparent dark:border-white/[0.06]">
             <div className="text-center sm:text-left">
                <h4 className="text-white font-semibold text-[17px] leading-tight">Analisis selesai</h4>
                <p className="text-slate-400 text-[13px] mt-1">Gunakan hasil ini untuk fokus belajar di materi yang lemah.</p>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                {onReview && (
                  <button
                    onClick={onReview}
                    className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13px] rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" /> Review Soal
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium text-[13px] rounded-xl transition-all border border-white/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedScoreCard({
  label, fullLabel, score, max, passing, passed, correct, color, icon, description
}: {
  label: string; fullLabel: string; score: number; max: number;
  passing: number; passed: boolean; correct: number;
  color: "blue" | "emerald" | "amber";
  icon: React.ReactNode;
  description: string;
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  const barColors = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="bg-white dark:bg-[#161616] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorMap[color])}>
           {icon}
        </div>

        <div className="flex-1 space-y-5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800 dark:text-white leading-tight">{fullLabel} <span className="text-slate-400 font-normal">({label})</span></h3>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed max-w-md">{description}</p>
            </div>
            {passed ? (
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-lg self-start shrink-0">Lulus</div>
            ) : (
              <div className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-semibold rounded-lg self-start shrink-0">Belum Lulus</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
               <div className="text-[11px] text-slate-400 dark:text-slate-500">Skor Kamu</div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                 {score} <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">/ {max}</span>
               </div>
            </div>
            <div className="space-y-1">
               <div className="text-[11px] text-slate-400 dark:text-slate-500">Passing Grade</div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{passing}</div>
            </div>
            <div className="space-y-1">
               <div className="text-[11px] text-slate-400 dark:text-slate-500">Benar</div>
               <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                 {correct} <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">soal</span>
               </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-[12px] text-slate-400 dark:text-slate-500 mb-2">
               <span>Pencapaian materi</span>
               <span className="text-slate-700 dark:text-white font-semibold">{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-2.5 rounded-full overflow-hidden">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${pct}%` }}
                 transition={{ duration: 1.2, ease: "easeOut" }}
                 className={cn("h-full rounded-full", barColors[color])}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
