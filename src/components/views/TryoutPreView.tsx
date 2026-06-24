import { useState, useEffect } from "react";
import { AlertCircle, Clock, FileText, Target, BookOpen, ArrowLeft } from "lucide-react";
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

        // 3. Hitung jumlah soal dari tryout_questions
        let questionCount = 0;
        if (questionsId) {
          const { count } = await supabase
            .from('tryout_questions')
            .select('id', { count: 'exact', head: true })
            .eq('package_id', questionsId);
          questionCount = count ?? 0;
        }

        // Gabungkan data
        if (mainPkg) {
          setPkg({
            id: mainPkg.id,
            name: mainPkg.title,
            duration_minutes: techData?.duration_minutes || 100,
            passing_grade_twk: techData?.passing_grade_twk || 65,
            passing_grade_tiu: techData?.passing_grade_tiu || 80,
            passing_grade_tkp: techData?.passing_grade_tkp || 166,
            question_count: questionCount
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
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-[12px]">Menyiapkan lembar ujian...</p>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Paket Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-[14px] mb-7 leading-relaxed">
          {error || "Maaf, data paket tryout tidak dapat dimuat. Silakan coba lagi atau hubungi admin."}
        </p>
        <button
          onClick={onCancel}
          className="px-7 py-3 bg-blue-600 text-white rounded-xl font-medium text-[14px] hover:bg-blue-500 transition-all active:scale-[0.98]"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] dark:bg-[#0d1929] px-5 sm:px-6 py-10 transition-colors duration-500 overflow-y-auto">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="mb-7">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-[13px] font-medium mb-5 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </button>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-md">Simulasi Live</span>
            <span className="text-slate-400 text-[12px]">SKD Kedinasan 2026</span>
          </div>
          <h1 className="text-slate-800 dark:text-white font-bold text-[26px] sm:text-[32px] tracking-tight mb-3">
            Persiapan Tryout SKD
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed max-w-2xl">
            Pastikan kamu siap secara mental dan perangkat sebelum memulai. Waktu akan berjalan otomatis saat tryout dimulai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Informasi Paket */}
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white leading-none">Informasi Paket</h2>
                <p className="text-[11px] text-slate-400 mt-1.5">Detail teknis ujian</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Nama Paket</p>
                  <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">{pkg.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Jumlah Soal</p>
                  <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">
                    {pkg.question_count > 0 ? `${pkg.question_count} Butir Soal SKD` : 'Soal SKD'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Durasi Pengerjaan</p>
                  <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">
                    {pkg.duration_minutes} Menit
                    <span className="text-slate-400 font-normal text-[12px] ml-2">({Math.floor(pkg.duration_minutes / 60)}j {pkg.duration_minutes % 60}m)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-full">
                  <p className="text-[11px] text-slate-400 mb-2.5">Ambang Batas (Passing Grade)</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      TWK {pkg.passing_grade_twk || 65}
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      TIU {pkg.passing_grade_tiu || 80}
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      TKP {pkg.passing_grade_tkp || 166}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panduan Pengerjaan */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-600/20 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white leading-none">Panduan Ujian</h2>
                  <p className="text-[11px] text-white/60 mt-1.5">Harap diperhatikan</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Disarankan menggunakan PC/Laptop dengan koneksi charger.",
                  "Pastikan koneksi internet stabil & kuota mencukupi.",
                  "Gunakan browser terbaru (Chrome/Firefox/Safari).",
                  "Dilarang membuka tab lain atau login di perangkat lain."
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[11px] font-semibold shrink-0 backdrop-blur-sm mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-[13px] text-white/90 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 relative z-10">
              <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-[11.5px] text-white/80 leading-relaxed text-center">
                  Sistem mengunci jawaban otomatis saat waktu pengerjaan habis.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-800 dark:text-white">Ujian siap dimulai</p>
              <p className="text-[12px] text-slate-400">Semua data teknis berhasil dimuat</p>
            </div>
          </div>
          <Button
            onClick={onStart}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[15px] py-6 px-10 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Mulai Tryout Sekarang
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
