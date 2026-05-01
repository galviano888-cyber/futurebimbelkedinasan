import { useState, useEffect } from "react";
import { AlertCircle, Clock, FileText, Target, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface TryoutPreViewProps {
  packageId: string | null;
  questionsId: string | null;
  onStart: () => void;
  onCancel: () => void;
}

export function TryoutPreView({ packageId, questionsId, onStart, onCancel }: TryoutPreViewProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackage() {
      if (!packageId || !supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Ambil info paket utama (buat Nama Paket)
        const { data: mainPkg, error: pkgError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', packageId)
          .maybeSingle();

        if (pkgError) throw pkgError;

        // 2. Ambil info teknis (durasi, passing grade) dari tryout_packages
        let techData = null;
        if (questionsId) {
          const { data: tech, error: techError } = await supabase
            .from('tryout_packages')
            .select('*')
            .eq('id', questionsId)
            .maybeSingle();

          if (techError) {
            console.warn("Tech data fetch error:", techError);
          }
          techData = tech;
        }

        // Gabungkan data
        if (mainPkg) {
          setPkg({
            id: mainPkg.id,
            name: mainPkg.title,
            duration_minutes: techData?.duration_minutes || 100,
            passing_grade_twk: techData?.passing_grade_twk || 65,
            passing_grade_tiu: techData?.passing_grade_tiu || 80,
            passing_grade_tkp: techData?.passing_grade_tkp || 166
          });
        } else {
          setError(`Paket dengan ID ${packageId.slice(0, 8)}... tidak ditemukan di sistem.`);
        }
      } catch (err: any) {
        console.error("Fetch package error:", err);
        setError(err.message || "Terjadi kesalahan saat memuat data paket.");
      } finally {
        setLoading(false);
      }
    }
    fetchPackage();
  }, [packageId, questionsId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Menyiapkan Lembar Ujian...</p>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Paket Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
          {error || "Maaf, data paket tryout tidak dapat dimuat. Silakan coba lagi atau hubungi admin."}
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 px-6 py-12 transition-colors duration-500 overflow-y-auto">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-semibold mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg tracking-widest">SIMULASI LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">SKD KEDINASAN 2024</span>
          </div>
          <h1 className="text-slate-900 dark:text-white font-black text-3xl sm:text-4xl tracking-tight mb-4">
            Persiapan Tryout SKD
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base text-justify leading-relaxed max-w-2xl">
            Pastikan Anda telah siap secara mental dan perangkat sebelum memulai simulasi ini. Waktu akan berjalan otomatis saat tryout dimulai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Informasi Paket */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">Informasi Paket</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Detail Teknis</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Paket</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{pkg.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Soal</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">110 Butir Soal SKD</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durasi Pengerjaan</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {pkg.duration_minutes} Menit
                    <span className="text-slate-400 font-medium text-xs ml-2">({Math.floor(pkg.duration_minutes / 60)} Jam {pkg.duration_minutes % 60} Menit)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ambang Batas (Passing Grade)</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-800">
                      TWK: {pkg.passing_grade_twk || 65}
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-800">
                      TIU: {pkg.passing_grade_tiu || 80}
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-800">
                      TKP: {pkg.passing_grade_tkp || 166}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panduan Pengerjaan */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">Panduan Ujian</h2>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Harap Perhatikan</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  "Disarankan menggunakan PC/Laptop dengan koneksi charger.",
                  "Pastikan koneksi internet stabil & kuota mencukupi.",
                  "Gunakan browser terbaru (Chrome/Firefox/Safari).",
                  "Dilarang membuka tab lain atau login di perangkat lain."
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0 backdrop-blur-sm">
                      {i + 1}
                    </div>
                    <p className="text-xs font-bold text-white/90 leading-relaxed text-justify">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-[9px] font-bold text-white/80 leading-relaxed text-center">
                  Sistem akan mengunci jawaban secara otomatis jika waktu pengerjaan telah habis.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Ujian Siap Dimulai</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Semua data teknis berhasil dimuat</p>
            </div>
          </div>
          <Button
            onClick={onStart}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-8 px-16 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.97]"
          >
            MULAI TRYOUT SEKARANG
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
