import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { TryoutRecord } from "@/types";
import { Sparkles } from "lucide-react";

interface RadarAnalysisProps {
  data: TryoutRecord[];
}

export function RadarAnalysis({ data }: RadarAnalysisProps) {
  // Hitung rata-rata atau performa terbaik
  const totalTryouts = data.length;
  if (totalTryouts === 0) return null;

  const avgTwk = data.reduce((sum, r) => sum + r.twk, 0) / totalTryouts;
  const avgTiu = data.reduce((sum, r) => sum + r.tiu, 0) / totalTryouts;
  const avgTkp = data.reduce((sum, r) => sum + r.tkp, 0) / totalTryouts;
  
  // Normalisasi ke skala 100 untuk visualisasi radar
  const twkScore = Math.min((avgTwk / 150) * 100, 100); // Max TWK ~150
  const tiuScore = Math.min((avgTiu / 175) * 100, 100); // Max TIU ~175
  const tkpScore = Math.min((avgTkp / 225) * 100, 100); // Max TKP ~225
  
  // Metrik tambahan untuk membuat Radar jadi Pentagon
  const akurasi = Math.min((correctCount(data) / totalQuestions(data)) * 100, 100) || 50;
  const konsistensi = Math.min((totalTryouts / 10) * 100, 100);

  const chartData = [
    { subject: "TWK", A: twkScore, fullMark: 100 },
    { subject: "TIU", A: tiuScore, fullMark: 100 },
    { subject: "TKP", A: tkpScore, fullMark: 100 },
    { subject: "Akurasi", A: akurasi, fullMark: 100 },
    { subject: "Konsistensi", A: konsistensi, fullMark: 100 },
  ];

  function correctCount(records: TryoutRecord[]) {
     // Estimasi kasar dari skor jika data detail belum ada
     return records.reduce((sum, r) => sum + (r.twk/5) + (r.tiu/5), 0);
  }

  function totalQuestions(records: TryoutRecord[]) {
     return records.length * 110;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider leading-none">Analisis Kekuatan</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Potensi Kelulusan SKD</p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }} 
            />
            <Radar
              name="Performa"
              dataKey="A"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
            {twkScore > 70 && tiuScore > 70 ? "Anda memiliki potensi besar di bidang Intelegensia!" : "Terus tingkatkan latihan soal TIU dan TWK Anda!"}
         </p>
      </div>
    </div>
  );
}
