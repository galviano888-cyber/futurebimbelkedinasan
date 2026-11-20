import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Sparkles, Loader2, Info, Zap,
  Trophy, ArrowRight, Lock, Users, CheckCircle2, Timer, Play, BarChart2,
  RefreshCw, UserPlus, X
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FBKEvent {
  id: string;
  title: string;
  description: string;
  header_image_url: string | null;
  package_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  duration_minutes: number;
  quota: number | null;
  registration_closes_at: string | null;
  created_at: string;
  tryout_packages?: { name: string; category: string; id: string } | null;
}

interface EventResult {
  id: string;
  event_id: string;
  user_id?: string;
  total: number;
  twk: number;
  tiu: number;
  tkp: number;
  finished_at: string;
  full_name?: string;
}

interface SeatInfo {
  registered_count: number;
  quota: number | null;
}

function useCountdown(target: string | null) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!target) { setTimeLeft(""); return; }
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(""); setExpired(true); return; }
      setExpired(false);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}h ${h}j lagi`);
      else if (h > 0) setTimeLeft(`${h}j ${m}m lagi`);
      else setTimeLeft(`${m}m ${s}d lagi`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [target]);

  return { timeLeft, expired };
}

function CountdownBadge({ target, tone }: { target: string | null; tone: "amber" | "red" }) {
  const { timeLeft } = useCountdown(target);
  if (!target || !timeLeft) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border",
      tone === "red"
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
    )}>
      <Timer className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}

function EventLeaderboard({ eventId, currentUserId }: { eventId: string; currentUserId: string | null }) {
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  const fetchResults = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("get_event_leaderboard", {
        p_event_id: eventId,
      });
      if (rpcError) throw rpcError;
      setResults((data || []) as EventResult[]);
    } catch (err: any) {
      setError(err.message || "Leaderboard gagal dimuat");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="py-10 text-center">
      <p className="text-red-500 text-sm mb-3">{error}</p>
      <button
        onClick={fetchResults}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
      </button>
    </div>
  );

  if (results.length === 0) return (
    <div className="py-10 text-center">
      <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
      <p className="text-slate-500 dark:text-slate-500 text-sm">Belum ada peserta yang menyelesaikan event ini.</p>
    </div>
  );

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/5">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">Peserta</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">TWK</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">TIU</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">TKP</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {results.map((r, i) => {
              const isMe = r.user_id === currentUserId;
              const name = r.full_name || "Peserta";
              return (
                <tr key={`${r.user_id}-${i}`} className={cn(
                  "transition-colors",
                  isMe ? "bg-blue-50/60 dark:bg-blue-500/5" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                )}>
                  <td className="px-4 py-3">
                    {i === 0 ? <span className="text-yellow-500 font-bold text-sm">🥇</span>
                      : i === 1 ? <span className="text-slate-400 font-bold text-sm">🥈</span>
                      : i === 2 ? <span className="text-amber-600 font-bold text-sm">🥉</span>
                      : <span className="text-slate-400 dark:text-slate-600 text-sm font-bold">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className={cn("text-sm font-bold truncate max-w-[120px]", isMe ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white")}>
                        {name}{isMe && " (Kamu)"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{r.twk || 0}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{r.tiu || 0}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{r.tkp || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "font-bold text-sm px-2.5 py-1 rounded-lg",
                      i === 0 ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : isMe ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    )}>
                      {r.total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={fetchResults}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Muat ulang
        </button>
      </div>
    </div>
  );
}

function EventCard({
  event,
  currentUserId,
  userResult,
  seat,
  isRegistered,
  seatNo,
  busy,
  onRegister,
  onCancelRegistration,
  onStart,
}: {
  event: FBKEvent;
  currentUserId: string | null;
  userResult: EventResult | null;
  seat: SeatInfo | undefined;
  isRegistered: boolean;
  seatNo: number | null;
  busy: boolean;
  onRegister: (event: FBKEvent) => void;
  onCancelRegistration: (event: FBKEvent) => void;
  onStart: (event: FBKEvent) => void;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const now = Date.now();
  const startAt = event.start_date ? new Date(event.start_date).getTime() : null;
  const endAt = event.end_date ? new Date(event.end_date).getTime() : null;
  const started = startAt === null || startAt <= now;
  const ended = endAt !== null && endAt < now;
  const registeredCount = seat?.registered_count ?? 0;
  const quota = event.quota ?? seat?.quota ?? null;
  const quotaFull = quota != null && registeredCount >= quota;

  const regDeadline = event.registration_closes_at || event.start_date;
  const registrationOpen = event.is_active && !ended && (!regDeadline || new Date(regDeadline).getTime() > now);
  const canRegister = registrationOpen && !isRegistered && !quotaFull;
  const canPlay = isRegistered && started && !ended && event.is_active && !userResult;

  const categoryColor: Record<string, string> = {
    SKD: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    TWK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    TIU: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    TKP: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const cat = event.tryout_packages?.category || "SKD";
  const seatPercent = quota ? Math.min(100, Math.round((registeredCount / quota) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-[#0d1929] border-y border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
      {/* Header */}
      {event.header_image_url && (
        <div className="relative h-36 sm:h-44 overflow-hidden border-b border-slate-200 dark:border-white/10 bg-blue-100 dark:bg-blue-950/40">
          <img
            src={event.header_image_url}
            alt={`Header ${event.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={e => { e.currentTarget.parentElement?.classList.add('hidden'); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1d36]/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">Tryout Akbar</span>
        </div>
      )}
      <div className="p-5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border", categoryColor[cat] || categoryColor.SKD)}>
              {cat}
            </span>
            {event.is_active && !ended ? (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {started ? "Aktif" : "Pendaftaran Dibuka"}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border bg-slate-100 dark:bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-500/20">
                {ended ? "Berakhir" : "Nonaktif"}
              </span>
            )}
            {quotaFull && !ended && (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border bg-red-500/10 text-red-400 border-red-500/20">
                Kuota Penuh
              </span>
            )}
          </div>
          {!started && startAt && <CountdownBadge target={event.start_date} tone="amber" />}
          {started && !ended && endAt && <CountdownBadge target={event.end_date} tone="red" />}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">{event.title}</h3>
        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">{event.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="px-5 py-3 flex flex-wrap gap-4 text-[11px] text-slate-400 dark:text-slate-600 border-b border-slate-100 dark:border-white/5">
        {event.start_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Mulai: {new Date(event.start_date).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
        {event.end_date && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Selesai: {new Date(event.end_date).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          {event.duration_minutes} menit
        </div>
        {event.tryout_packages && (
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {event.tryout_packages.name}
          </div>
        )}
      </div>

      {/* Kuota */}
      {quota != null && (
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" /> Pendaftar
            </span>
            <span className={cn(quotaFull ? "text-red-500" : "text-slate-700 dark:text-slate-300")}>
              {registeredCount} / {quota}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", quotaFull ? "bg-red-500" : "bg-blue-500")}
              style={{ width: `${seatPercent}%` }}
            />
          </div>
          {isRegistered && seatNo != null && (
            <p className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kamu terdaftar — kursi #{seatNo}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-5 mt-auto space-y-3">
        {userResult ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Sudah Dikerjakan</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                Skor: <span className="font-bold">{userResult.total}</span> · TWK {userResult.twk} · TIU {userResult.tiu} · TKP {userResult.tkp}
              </p>
            </div>
          </div>
        ) : canPlay ? (
          <button
            onClick={() => onStart(event)}
            className="w-full flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Play className="w-3.5 h-3.5" /> Mulai Sekarang
          </button>
        ) : isRegistered && !started ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar — menunggu jadwal
          </div>
        ) : isRegistered && ended ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Event Berakhir
          </div>
        ) : canRegister ? (
          <button
            onClick={() => onRegister(event)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Daftar Sekarang
          </button>
        ) : quotaFull && !isRegistered ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl text-red-500 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Kuota Penuh
          </div>
        ) : ended ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Event Berakhir
          </div>
        ) : !event.is_active ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Pendaftaran Belum Dibuka
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 h-10 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Pendaftaran Ditutup
          </div>
        )}

        {isRegistered && !started && !userResult && (
          <button
            onClick={() => onCancelRegistration(event)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" /> Batalkan pendaftaran
          </button>
        )}

        <button
          onClick={() => setShowLeaderboard(v => !v)}
          className="w-full flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          {showLeaderboard ? "Sembunyikan" : "Lihat"} Leaderboard
        </button>
      </div>

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div className="border-t border-slate-100 dark:border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Leaderboard Event</h4>
          </div>
          <EventLeaderboard eventId={event.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}

export function EventsView() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<FBKEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<Record<string, EventResult>>({});
  const [seats, setSeats] = useState<Record<string, SeatInfo>>({});
  const [registrations, setRegistrations] = useState<Record<string, number>>({});
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      setCurrentUserId(uid);

      const { data: evData } = await supabase
        .from("events")
        .select("*, tryout_packages(id, name, category)")
        .order("created_at", { ascending: false });

      const now = new Date().toISOString();
      const normalized = ((evData || []) as FBKEvent[]).map((e) => ({
        ...e,
        is_active: e.is_active && (!e.end_date || e.end_date > now),
      }));

      setEvents(normalized);

      const { data: seatData } = await supabase.rpc("get_event_registration_counts");
      if (seatData) {
        const map: Record<string, SeatInfo> = {};
        (seatData as any[]).forEach((row) => {
          map[row.event_id] = { registered_count: row.registered_count, quota: row.quota };
        });
        setSeats(map);
      }

      if (uid && normalized.length > 0) {
        const eventIds = normalized.map((e) => e.id);

        const { data: myRegs } = await supabase
          .from("event_registrations")
          .select("event_id, seat_no")
          .eq("user_id", uid)
          .in("event_id", eventIds);

        if (myRegs) {
          const map: Record<string, number> = {};
          myRegs.forEach((r: any) => { map[r.event_id] = r.seat_no; });
          setRegistrations(map);
        }

        const { data: resultData } = await supabase.rpc("get_my_event_results", {
          p_event_ids: eventIds,
        });

        if (resultData) {
          const map: Record<string, EventResult> = {};
          (resultData as EventResult[]).forEach((r) => { map[r.event_id] = r; });
          setUserResults(map);
        }

        // Pengingat H-6 jam (fallback jika pg_cron tidak aktif).
        supabase.rpc("claim_event_reminder").then(() => undefined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSeatsAndRegs = async (uid: string | null) => {
    if (!supabase) return;

    const { data: seatData } = await supabase.rpc("get_event_registration_counts");
    if (seatData) {
      const map: Record<string, SeatInfo> = {};
      (seatData as any[]).forEach((row) => {
        map[row.event_id] = { registered_count: row.registered_count, quota: row.quota };
      });
      setSeats(map);
    }

    if (!uid) return;
    const { data: myRegs } = await supabase
      .from("event_registrations")
      .select("event_id, seat_no")
      .eq("user_id", uid);

    const map: Record<string, number> = {};
    (myRegs || []).forEach((r: any) => { map[r.event_id] = r.seat_no; });
    setRegistrations(map);
  };

  const handleRegister = useCallback(async (event: FBKEvent) => {
    if (!supabase) return;
    setBusyEventId(event.id);
    try {
      const { data, error } = await supabase.rpc("register_event", { p_event_id: event.id });
      if (error) throw error;

      const row: any = Array.isArray(data) ? data[0] : data;
      toast.success(
        row?.seat_no
          ? `Berhasil mendaftar! Kursi #${row.seat_no} untuk kamu.`
          : "Berhasil mendaftar event."
      );
      await refreshSeatsAndRegs(currentUserId);
    } catch (err: any) {
      toast.error(err.message || "Gagal mendaftar event.");
    } finally {
      setBusyEventId(null);
    }
  }, [currentUserId]);

  const handleCancelRegistration = useCallback(async (event: FBKEvent) => {
    if (!supabase) return;
    setBusyEventId(event.id);
    try {
      const { error } = await supabase.rpc("cancel_event_registration", { p_event_id: event.id });
      if (error) throw error;
      toast.success("Pendaftaran dibatalkan. Kursi dilepas.");
      await refreshSeatsAndRegs(currentUserId);
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan pendaftaran.");
    } finally {
      setBusyEventId(null);
    }
  }, [currentUserId]);

  const handleStartEvent = useCallback((event: FBKEvent) => {
    if (!event.package_id) {
      toast.error("Paket soal event belum diatur admin.");
      return;
    }
    navigate(`/event-pre/${event.id}`);
  }, [navigate]);

  const activeEvents = events.filter(e => e.is_active);
  const pastEvents = events.filter(e => !e.is_active);

  const renderCard = (ev: FBKEvent) => (
    <EventCard
      key={ev.id}
      event={ev}
      currentUserId={currentUserId}
      userResult={userResults[ev.id] || null}
      seat={seats[ev.id]}
      isRegistered={registrations[ev.id] !== undefined}
      seatNo={registrations[ev.id] ?? null}
      busy={busyEventId === ev.id}
      onRegister={handleRegister}
      onCancelRegistration={handleCancelRegistration}
      onStart={handleStartEvent}
    />
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SEO title="Events & Tryout Akbar | Future Bimbel" description="Ikuti event tryout akbar dan kompetisi SKD dari Future Bimbel Kedinasan." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em] mb-2">Agenda</p>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-[-0.03em]">Event &amp; Tryout Akbar</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Daftar dulu, lalu kerjakan sesuai jadwal. Kuota peserta terbatas.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            {activeEvents.length} Event Aktif
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-wide">Memuat Event...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0d1929] border-y border-dashed border-slate-200 dark:border-white/10">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-center mb-5">
            <Calendar className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">Belum Ada Event</h3>
          <p className="text-slate-500 dark:text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Belum ada event yang tersedia. Pantau terus halaman ini untuk event mendatang.</p>
        </div>
      ) : (
        <>
          {activeEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Event Aktif
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeEvents.map(renderCard)}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-600 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-700 inline-block" />
                Event Sebelumnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastEvents.map(renderCard)}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA Banner */}
      <div className="bg-[#10264a] border-y border-blue-300/20 p-8 text-center relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ada Pertanyaan Mengenai Event?</h2>
          <p className="text-slate-500 dark:text-slate-500 text-sm max-w-md mx-auto">Hubungi tim admin kami untuk informasi lebih lanjut mengenai pendaftaran dan detail event.</p>
          <a
            href="https://wa.me/6287753646617"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Hubungi Admin <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
