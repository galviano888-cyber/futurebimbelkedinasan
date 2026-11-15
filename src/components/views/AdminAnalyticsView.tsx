import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  MessageCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Step {
  key: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const FUNNEL: Step[] = [
  {
    key: "view_landing",
    label: "Membuka halaman utama",
    description: "Pengunjung yang membuka landing page",
    icon: Eye,
    color: "blue",
  },
  {
    key: "view_pricing",
    label: "Melihat daftar harga",
    description: "Pengunjung yang menggulir sampai bagian paket",
    icon: BarChart3,
    color: "indigo",
  },
  {
    key: "view_paket",
    label: "Membuka katalog paket",
    description: "Siswa yang membuka halaman Paket & Tryout",
    icon: MousePointerClick,
    color: "violet",
  },
  {
    key: "click_wa",
    label: "Klik Pesan via WhatsApp",
    description: "Siswa yang menekan tombol pesan",
    icon: MessageCircle,
    color: "emerald",
  },
  {
    key: "request_created",
    label: "Pesanan tercatat",
    description: "Permintaan yang berhasil disimpan server",
    icon: CheckCircle2,
    color: "amber",
  },
];

interface Row {
  name: string;
  sessions: number;
  events: number;
}

export function AdminAnalyticsView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();

      const { data, error } = await supabase
        .from("analytics_events")
        .select("name, session_id")
        .gte("created_at", since)
        .limit(50_000);

      if (error) throw error;

      // Hitung event dan sesi unik per jenis event.
      const byName = new Map<string, { events: number; sessions: Set<string> }>();
      const allSessions = new Set<string>();

      for (const e of data ?? []) {
        const entry = byName.get(e.name) ?? { events: 0, sessions: new Set<string>() };
        entry.events++;
        if (e.session_id) {
          entry.sessions.add(e.session_id);
          allSessions.add(e.session_id);
        }
        byName.set(e.name, entry);
      }

      setUniqueVisitors(allSessions.size);
      setRows(
        FUNNEL.map((f) => ({
          name: f.key,
          sessions: byName.get(f.key)?.sessions.size ?? 0,
          events: byName.get(f.key)?.events ?? 0,
        }))
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data analytics", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const valueOf = (key: string) => rows.find((r) => r.name === key)?.sessions ?? 0;
  const top = valueOf("view_landing") || 0;

  // Drop-off terbesar antar langkah.
  let worstStep: { from: string; to: string; lost: number; pct: number } | null = null;
  for (let i = 1; i < FUNNEL.length; i++) {
    const prev = valueOf(FUNNEL[i - 1].key);
    const curr = valueOf(FUNNEL[i].key);
    if (prev > 0) {
      const lost = prev - curr;
      const pct = Math.round((lost / prev) * 100);
      if (!worstStep || lost > worstStep.lost) {
        worstStep = { from: FUNNEL[i - 1].label, to: FUNNEL[i].label, lost, pct };
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Statistik Pengunjung
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Melacak perjalanan calon pembeli dari halaman utama sampai memesan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                days === d ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d} hari
            </button>
          ))}
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-600 text-xs font-bold mt-3 uppercase tracking-widest">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0d1929] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pengunjung unik</p>
              <p className="text-3xl font-bold text-white mt-2">{uniqueVisitors.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-600 mt-1">{days} hari terakhir</p>
            </div>
            <div className="bg-[#0d1929] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Klik WhatsApp</p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{valueOf('click_wa').toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {top > 0 ? `${Math.round((valueOf('click_wa') / top) * 100)}% dari pengunjung` : 'belum ada data'}
              </p>
            </div>
            <div className="bg-[#0d1929] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pesanan tercatat</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{valueOf('request_created').toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {valueOf('click_wa') > 0
                  ? `${Math.round((valueOf('request_created') / valueOf('click_wa')) * 100)}% dari klik WA`
                  : 'belum ada data'}
              </p>
            </div>
          </div>

          <div className="bg-[#0d1929] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-5">Perjalanan Calon Pembeli</h3>

            <div className="space-y-3">
              {FUNNEL.map((step, i) => {
                const value = valueOf(step.key);
                const pct = top > 0 ? Math.round((value / top) * 100) : 0;
                const prevValue = i > 0 ? valueOf(FUNNEL[i - 1].key) : null;
                const dropPct = prevValue && prevValue > 0 ? Math.round(((prevValue - value) / prevValue) * 100) : null;
                const Icon = step.icon;

                return (
                  <div key={step.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold text-slate-200 truncate">{step.label}</p>
                          <p className="text-[10.5px] text-slate-600 truncate">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-white">{value.toLocaleString('id-ID')}</p>
                        {dropPct !== null && dropPct > 0 && (
                          <p className="text-[10px] font-bold text-rose-400">-{dropPct}%</p>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {worstStep && worstStep.lost > 0 && (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-amber-300">
                    Kebocoran terbesar: {worstStep.pct}% berhenti di sini
                  </p>
                  <p className="text-[11px] text-amber-200/70 mt-1 leading-relaxed">
                    Dari <b>{worstStep.from}</b> ke <b>{worstStep.to}</b> kehilangan {worstStep.lost.toLocaleString('id-ID')} orang.
                  </p>
                </div>
              </div>
            )}

            {top === 0 && (
              <p className="text-center text-[11px] text-slate-600 mt-6">
                Belum ada data pada rentang ini. Data mulai terkumpul setelah pengunjung membuka situs.
              </p>
            )}
          </div>

          <div className="bg-[#0d1929] border border-white/5 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Rincian Event</h3>
            <div className="space-y-2">
              {FUNNEL.map((step) => {
                const row = rows.find((r) => r.name === step.key);
                return (
                  <div key={step.key} className="flex items-center justify-between text-[12px] py-1.5 border-b border-white/[0.03] last:border-0">
                    <span className="text-slate-400 font-medium">{step.label}</span>
                    <span className="text-slate-600 font-bold">
                      {row?.sessions ?? 0} sesi · {row?.events ?? 0} event
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
