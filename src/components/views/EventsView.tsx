import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Sparkles, Loader2, Info, Zap,
  Trophy, ArrowRight, Lock,
  CheckCircle2, Timer, Play, BarChart2
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface FBKEvent {
  id: string;
  title: string;
  description: string;
  package_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  duration_minutes: number;
  created_at: string;
  tryout_packages?: { name: string; category: string; id: string } | null;
}

interface EventResult {
  id: string;
  event_id: string;
  user_id: string;
  total: number;
  twk: number;
  tiu: number;
  tkp: number;
  answers: Record<string, string>;
  finished_at: string;
  profiles?: { full_name: string | null; email: string };
}

function useCountdown(endDate: string | null) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endDate) { setTimeLeft(""); return; }
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Berakhir"); setExpired(true); return; }
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
  }, [endDate]);

  return { timeLeft, expired };
}

function EventCountdownBadge({ endDate }: { endDate: string | null }) {
  const { timeLeft, expired } = useCountdown(endDate);
  if (!endDate || !timeLeft) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border",
      expired
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      <Timer className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}

function EventLeaderboard({ eventId, currentUserId }: { eventId: string; currentUserId: string | null }) {
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  const fetchResults = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("event_results")
        .select("*, profiles(full_name, email)")
        .eq("event_id", eventId)
        .order("total", { ascending: false })
        .limit(50);
      setResults(data || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );

  if (results.length === 0) return (
    <div className="py-10 text-center">
      <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
      <p className="text-slate-500 dark:text-slate-500 text-sm">Belum ada peserta yang menyelesaikan event ini.</p>
    </div>
  );

  return (
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
            const name = r.profiles?.full_name || r.profiles?.email || "Anonim";
            return (
              <tr key={r.id} className={cn(
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
  );
}

function EventCard({
  event,
  currentUserId,
  userResult,
  onStart,
}: {
  event: FBKEvent;
  currentUserId: string | null;
  userResult: EventResult | null;
  onStart: (event: FBKEvent) => void;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const now = new Date();
  const started = !event.start_date || new Date(event.start_date) <= now;
  const ended = !!event.end_date && new Date(event.end_date) < now;
  const canPlay = event.is_active && started && !ended && !userResult;

  const categoryColor: Record<string, string> = {
    SKD: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    TWK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    TIU: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    TKP: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const cat = event.tryout_packages?.category || "SKD";

  return (
    <div className="bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-lg dark:hover:shadow-none">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border", categoryColor[cat] || categoryColor.SKD)}>
              {cat}
            </span>
            {event.is_active && !ended ? (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Aktif
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border bg-slate-100 dark:bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-500/20">
                {ended ? "Berakhir" : "Nonaktif"}
              </span>
            )}
          </div>
          {event.end_date && <EventCountdownBadge endDate={event.end_date} />}
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

      {/* Actions */}
      <div className="p-5 mt-auto space-y-3">
        {userResult ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Sudah Dikerjakan</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">Skor: <span className="font-bold">{userResult.total}</span></p>
            </div>
          </div>
        ) : canPlay ? (
          <button
            onClick={() => onStart(event)}
            className="w-full flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Play className="w-3.5 h-3.5" /> Mulai Sekarang
          </button>
        ) : !event.is_active ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Event Belum Aktif
          </div>
        ) : !started ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Belum Dimulai
          </div>
        ) : ended ? (
          <div className="flex items-center justify-center gap-2 h-10 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Event Berakhir
          </div>
        ) : null}

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
  const [userResults, setUserResults] = useState<Record<string, EventResult>>({}); // keyed by event_id

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

      // Auto-expire
      await supabase
        .from("events")
        .update({ is_active: false })
        .eq("is_active", true)
        .lt("end_date", new Date().toISOString());

      const { data: evData } = await supabase
        .from("events")
        .select("*, tryout_packages(id, name, category)")
        .order("created_at", { ascending: false });

      setEvents(evData || []);

      // Fetch user's own results for all events
      if (uid && evData && evData.length > 0) {
        const { data: resultData } = await supabase
          .from("event_results")
          .select("*")
          .eq("user_id", uid)
          .in("event_id", evData.map((e: FBKEvent) => e.id));
        if (resultData) {
          const map: Record<string, EventResult> = {};
          resultData.forEach((r: EventResult) => { map[r.event_id] = r; });
          setUserResults(map);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvent = useCallback((event: FBKEvent) => {
    if (!event.package_id) return;
    // Store event context in sessionStorage for engine to pick up
    sessionStorage.setItem("fbk_event_context", JSON.stringify({
      eventId: event.id,
      packageId: event.package_id,
      questionsId: event.package_id,
      durationMinutes: event.duration_minutes,
      title: event.title,
    }));
    navigate(`/event-engine/${event.id}`);
  }, [navigate]);

  const activeEvents = events.filter(e => e.is_active);
  const pastEvents = events.filter(e => !e.is_active);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SEO title="Events & Tryout Akbar | Future Bimbel" description="Ikuti event tryout akbar dan kompetisi SKD dari Future Bimbel Kedinasan." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em] mb-2">Agenda</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Event &amp; Tryout Akbar</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Ikuti event kompetisi dan uji kemampuanmu bersama siswa lain.</p>
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
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0d1929] border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-5">
            <Calendar className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">Belum Ada Event</h3>
          <p className="text-slate-500 dark:text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Belum ada event yang tersedia. Pantau terus halaman ini untuk event mendatang.</p>
        </div>
      ) : (
        <>
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Event Aktif
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    currentUserId={currentUserId}
                    userResult={userResults[ev.id] || null}
                    onStart={handleStartEvent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-600 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-700 inline-block" />
                Event Sebelumnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    currentUserId={currentUserId}
                    userResult={userResults[ev.id] || null}
                    onStart={handleStartEvent}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA Banner */}
      <div className="bg-white dark:bg-[#0d1929] border border-blue-100 dark:border-blue-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 dark:bg-blue-500/5 rounded-full -mr-24 -mt-24" />
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
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
