import { useState, useEffect } from "react";
import { AlertCircle, Clock, FileText, Target, BookOpen, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface TryoutPreViewProps {
  packageId: string | null;
  onStart: () => void;
  onCancel: () => void;
}

export function TryoutPreView({ packageId, onStart, onCancel }: TryoutPreViewProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackage() {
      if (!packageId || !supabase) return;
      const { data } = await supabase.from('tryout_packages').select('*').eq('id', packageId).single();
      if (data) setPkg(data);
      setLoading(false);
    }
    fetchPackage();
  }, [packageId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!pkg) {
    return <div className="text-center py-20 text-slate-500">Paket tidak ditemukan. <button onClick={onCancel} className="text-blue-600 underline">Kembali</button></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-semibold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </button>
        <h1 className="text-slate-900 font-black text-3xl sm:text-4xl tracking-tight mb-2">
          Persiapan Tryout SKD
        </h1>
        <p className="text-slate-500 text-base">
          Pastikan Anda telah siap secara mental dan perangkat sebelum memulai simulasi ini. Waktu akan berjalan otomatis saat tryout dimulai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Informasi Paket */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Informasi Paket</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="mt-1"><BookOpen className="w-4 h-4 text-slate-400" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Paket</p>
                <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1"><FileText className="w-4 h-4 text-slate-400" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jumlah Soal</p>
                <p className="text-sm font-bold text-slate-900">110 Butir Soal</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1"><Clock className="w-4 h-4 text-slate-400" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Durasi Pengerjaan</p>
                <p className="text-sm font-bold text-slate-900">{pkg.duration_minutes} Menit <span className="text-slate-500 font-medium text-xs ml-1">({Math.floor(pkg.duration_minutes / 60)} Jam {pkg.duration_minutes % 60} Menit)</span></p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1"><Target className="w-4 h-4 text-slate-400" /></div>
              <div className="w-full">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Passing Grade</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> TWK: {pkg.passing_grade_twk || 65}
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> TIU: {pkg.passing_grade_tiu || 80}
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> TKP: {pkg.passing_grade_tkp || 166}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panduan Pengerjaan */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 shadow-sm p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-blue-900">Panduan & Tata Tertib</h2>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">1</div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Sangat disarankan menggunakan <span className="font-bold text-slate-900">PC atau Laptop</span> dengan charger terhubung agar proses pengerjaan lebih optimal dan mencegah perangkat mati mendadak.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">2</div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Pastikan Anda berada di lokasi dengan <span className="font-bold text-slate-900">koneksi internet yang stabil</span>. Ujian tidak dapat di-pause jika koneksi terputus.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">3</div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Gunakan browser versi terbaru (disarankan Google Chrome atau Mozilla Firefox).
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">4</div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Sistem akan memantau aktivitas Anda. Hindari membuka tab lain atau melakukan aktivitas login di perangkat berbeda saat ujian sedang berlangsung.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          onClick={onStart}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg py-7 px-12 rounded-xl transition-all shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          Mulai Tryout Sekarang
        </Button>
      </div>
    </div>
  );
}
