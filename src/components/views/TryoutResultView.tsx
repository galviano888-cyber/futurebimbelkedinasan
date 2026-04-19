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
  Loader2
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
        .from('tryout_results')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', packageId);

      const { count: rankPosition } = await supabase
        .from('tryout_results')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', packageId)
        .gte('total', result.totalScore); // Using 'total' as per the schema check

      if (totalCount !== null && rankPosition !== null) {
        setRank({ position: rankPosition, total: totalCount });
      }
    } catch (err) {
      console.error("Error fetching rank:", err);
    }
  };

  // Data for Radar Chart
  const chartData = [
    { subject: 'TWK', A: Math.round((result.twkScore / result.twkMax) * 100), fullMark: 100 },
    { subject: 'TIU', A: Math.round((result.tiuScore / result.tiuMax) * 100), fullMark: 100 },
    { subject: 'TKP', A: Math.round((result.tkpScore / result.tkpMax) * 100), fullMark: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-[11px] font-black uppercase tracking-widest mb-4 transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-slate-900 font-black text-4xl tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
               <Trophy className="w-7 h-7" />
            </div>
            Hasil Tryout SKD
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Laporan analisis performa pengerjaan tryout kamu secara mendalam.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Skor</div>
              <div className="text-2xl font-black text-slate-900 leading-none">{result.totalScore}</div>
           </div>
           <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Akurasi</div>
              <div className="text-2xl font-black text-slate-900 leading-none">{Math.round((totalCorrect / result.totalQuestions) * 100)}%</div>
           </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Result Card & Chart */}
        <div className="lg:col-span-1 space-y-8">
          <div className={cn(
            "rounded-[2.5rem] p-8 border-4 text-center relative overflow-hidden",
            allPass
              ? "bg-emerald-50 border-emerald-100/50"
              : "bg-red-50 border-red-100/50"
          )}>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                {allPass ? (
                  <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}
              </div>
              <h2 className={cn("text-3xl font-black mb-2 tracking-tight", allPass ? "text-emerald-900" : "text-red-900")}>
                {allPass ? "LULUS SKD!" : "BELUM LULUS"}
              </h2>
              <p className={cn("text-sm font-bold px-4", allPass ? "text-emerald-600" : "text-red-600")}>
                {allPass
                  ? "Selamat! Kamu berhasil menaklukkan passing grade nasional."
                  : "Tetap semangat! Masih ada kategori yang perlu kamu perbaiki."}
              </p>
            </div>
            {/* Background elements */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-30 ${allPass ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>

          {/* Ranking Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all" />
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <TrendingUp className="w-5 h-5" />
                   </div>
                   <h3 className="text-white font-black tracking-tight">Peringkat Nasional</h3>
                </div>
                
                {rank ? (
                  <div className="space-y-1">
                    <div className="text-4xl font-black text-white tracking-tighter">
                      #{rank.position} <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Dari {rank.total}</span>
                    </div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] pt-2">
                      {rank.position <= 10 ? "🔥 KAMU TOP 10 NASIONAL!" : 
                       rank.position <= 50 ? "🚀 KAMU LUAR BIASA!" : 
                       "💪 TERUS TINGKATKAN!"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghitung Peringkat...
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                   <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Peta Kekuatan</h3>
             </div>
             
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }} 
                    />
                    <Radar
                      name="Performa"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-wider">Persentase Penguasaan Materi</p>
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
          <div className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-900/20">
             <div className="text-center sm:text-left">
                <h4 className="text-white font-black text-xl leading-tight">Analisis Selesai!</h4>
                <p className="text-slate-400 text-sm mt-1">Gunakan hasil ini untuk fokus belajar di materi yang lemah.</p>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                {onReview && (
                  <button
                    onClick={onReview}
                    className="flex-1 sm:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" /> REVIEW SOAL
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="flex-1 sm:flex-none px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black text-sm rounded-2xl transition-all border border-white/10 active:scale-95"
                >
                  DASHBOARD
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent for Detailed Category Cards
import { Shield, User } from "lucide-react";

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
    blue: "bg-blue-600 text-blue-600 border-blue-100 bg-blue-50/50",
    emerald: "bg-emerald-600 text-emerald-600 border-emerald-100 bg-emerald-50/50",
    amber: "bg-amber-600 text-amber-600 border-amber-100 bg-amber-50/50",
  };
  
  const barColors = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-600",
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border", colorMap[color])}>
           {icon}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">{fullLabel} ({label})</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{description}</p>
            </div>
            {passed ? (
              <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">Lulus</div>
            ) : (
              <div className="px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 uppercase tracking-widest">Gagal</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor Kamu</div>
               <div className="text-3xl font-black text-slate-900">{score} <span className="text-sm font-bold text-slate-400">/ {max}</span></div>
            </div>
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Passing Grade</div>
               <div className="text-3xl font-black text-slate-900">{passing}</div>
            </div>
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benar</div>
               <div className="text-3xl font-black text-slate-900">{correct} <span className="text-sm font-bold text-slate-400">Soal</span></div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
               <span>Pencapaian Materi</span>
               <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
               <div 
                 className={cn("h-full transition-all duration-1000", barColors[color])} 
                 style={{ width: `${pct}%` }}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

