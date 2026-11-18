import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle, Clock, FileText, Target, BookOpen, ArrowLeft,
  Users, Trophy, CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";

interface EventInfo {
  id: string;
  title: string;
  description: string;
  package_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  duration_minutes: number;
  quota: number | null;
  registration_closes_at: string | null;
}

interface PackageInfo {
  name: string;
  duration_minutes: number;
  passing_grade_twk: number;
  passing_grade_tiu: number;
  passing_grade_tkp: number;
}

export function EventPreView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [seatNo, setSeatNo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    if (!supabase || !eventId) {
      setError("Event tidak ditemukan.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const { data: ev, error: evError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (evError) throw evError;
      if (!ev) throw new Error("Event tidak ditemukan.");

      setEvent(ev as EventInfo);

      const { data: reg } = await supabase
        .from("event_registrations")
        .select("seat_no")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      setRegistered(!!reg);
      setSeatNo(reg?.seat_no ?? null);

      if (ev.package_id) {
        const { data: tech } = await supabase
          .from("tryout_packages")
          .select("name, duration_minutes, passing_grade_twk, passing_grade_tiu, passing_grade_tkp")
          .eq("id", ev.package_id)
          .maybeSingle();

        if (tech) {
          setPkg({
            name: tech.name,
            duration_minutes: tech.duration_minutes || ev.duration_minutes || 100,
            passing_grade_twk: tech.passing_grade_twk ?? 65,
            passing_grade_tiu: tech.passing_grade_tiu ?? 80,
            passing_grade_tkp: tech.passing_grade_tkp ?? 166,
          });
        }

        const { count } = await supabase
          .from("tryout_questions")
          .select("id", { count: "exact", head: true })
          .eq("package_id", ev.package_id);

        setQuestionCount(count ?? 0);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data event.");
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();
  const startAt = event?.start_date ? new Date(event.start_date).getTime() : null;
  const endAt = event?.end_date ? new Date(event.end_date).getTime() : null;
  const notStarted = startAt !== null && startAt > now;
  const ended = endAt !== null && endAt < now;

  const blockedReason = !registered
    ? "Kamu belum terdaftar pada event ini. Daftar dulu di halaman Event."
    : !event?.is_active
      ? "Event tidak aktif atau pendaftarannya sudah ditutup."
      : ended
        ? "Event sudah berakhir."
        : notStarted
          ? "Tryout Akbar belum dimulai."
          : null;

  const handleStart = () => {
    if (!event || !event.package_id || blockedReason) return;

    sessionStorage.setItem("fbk_event_context", JSON.stringify({
      eventId: event.id,
      packageId: event.package_id,
      questionsId: event.package_id,
      durationMinutes: event.duration_minutes || pkg?.duration_minutes || 100,
      title: event.title,
    }));

    navigate(`/event-engine/${event.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-[12px]">Menyiapkan lembar ujian...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-5">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Event Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-[14px] mb-7 leading-relaxed">
          {error || "Maaf, data event tidak dapat dimuat."}
        </p>
        <button
          onClick={() => navigate("/events")}
          className="px-7 py-3 bg-blue-600 text-white rounded-xl font-medium text-[14px] hover:bg-blue-500 transition-all active:scale-[0.98]"
        >
          Kembali ke Event
        </button>
      </div>
    );
  }

  const duration = event.duration_minutes || pkg?.duration_minutes || 100;

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fc] dark:bg-[#0d1929] px-5 sm:px-6 py-10 transition-colors duration-500 overflow-y-auto">
      <SEO title={`${event.title} | Persiapan Tryout Akbar`} description="Halaman persiapan sebelum memulai Tryout Akbar." />
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="mb-7">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-[13px] font-medium mb-5 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Event
          </button>
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-md">
              Tryout Akbar
            </span>
            <span className="text-slate-400 text-[12px]">SKD Kedinasan 2026</span>
            {seatNo && (
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-md">
                Kursi #{seatNo}
              </span>
            )}
          </div>
          <h1 className="text-slate-800 dark:text-white font-bold text-[26px] sm:text-[32px] tracking-tight mb-3">
            Persiapan {event.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed max-w-2xl">
            Pastikan kamu siap secara mental dan perangkat sebelum memulai. Waktu akan berjalan otomatis saat tryout dimulai dan tidak dapat dijeda.
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
                  <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">
                    {pkg?.name || event.title}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Jumlah Soal</p>
                  <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">
                    {questionCount > 0 ? `${questionCount} Butir Soal SKD` : "Soal SKD"}
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
                    {duration} Menit
                    <span className="text-slate-400 font-normal text-[12px] ml-2">
                      ({Math.floor(duration / 60)}j {duration % 60}m)
                    </span>
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
                      TWK {pkg?.passing_grade_twk ?? 65}
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      TIU {pkg?.passing_grade_tiu ?? 80}
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                      TKP {pkg?.passing_grade_tkp ?? 166}
                    </div>
                  </div>
                </div>
              </div>

              {(event.start_date || event.end_date) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">Jadwal Event</p>
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white leading-relaxed">
                      {event.start_date
                        ? new Date(event.start_date).toLocaleString("id-ID", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "Kapan saja"}
                      {event.end_date && (
                        <span className="text-slate-400 font-normal">
                          {" — "}
                          {new Date(event.end_date).toLocaleString("id-ID", {
                            day: "numeric", month: "long",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {event.quota != null && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">Kuota Peserta</p>
                    <p className="text-[14px] font-medium text-slate-800 dark:text-white leading-tight">
                      {event.quota} peserta
                    </p>
                  </div>
                </div>
              )}
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
                  "Dilarang membuka tab lain atau login di perangkat lain.",
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[11px] font-semibold shrink-0 backdrop-blur-sm mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-[13px] text-white/90 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 relative z-10">
              <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-[11.5px] text-white/80 leading-relaxed text-center flex items-center justify-center gap-2">
                  <Trophy className="w-3.5 h-3.5" />
                  Hasil ujian otomatis masuk ke leaderboard event.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${blockedReason ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}`}>
              <AlertCircle className={`w-5 h-5 ${blockedReason ? "text-amber-500" : "text-emerald-500"}`} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-800 dark:text-white">
                {blockedReason ? "Belum bisa dimulai" : "Ujian siap dimulai"}
              </p>
              <p className="text-[12px] text-slate-400">
                {blockedReason || "Semua data teknis berhasil dimuat"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStart}
            disabled={!!blockedReason}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[15px] py-6 px-10 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mulai Tryout Akbar
          </Button>
        </div>
      </div>
    </div>
  );
}
