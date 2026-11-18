import { useCallback, useEffect, useState } from "react";
import { CheckCheck, ArrowLeft, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  created_at: string;
}

interface NotificationsViewProps {
  onBack?: () => void;
}

const TYPE_STYLE: Record<string, { badge: string; label: string }> = {
  success: {
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    label: "Berhasil",
  },
  warning: {
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    label: "Perhatian",
  },
  error: {
    badge: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    label: "Penting",
  },
  info: {
    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    label: "Info",
  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) {
    return `Hari ini, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Halaman arsip notifikasi. Dropdown di header hanya menampilkan daftar
 * terbaru; halaman ini menyimpan semuanya sehingga pesan penting seperti
 * "pembayaran dikonfirmasi" tidak hilang.
 */
export function NotificationsView({ onBack }: NotificationsViewProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [marking, setMarking] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setItems(data ?? []);
    } catch (err: any) {
      console.error("Gagal memuat notifikasi:", err);
      toast.error("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markAllRead = async () => {
    if (!supabase) return;
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) {
      toast.info("Semua notifikasi sudah dibaca");
      return;
    }

    setMarking(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unread.map((n) => n.id));
      if (error) throw error;

      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success(`${unread.length} notifikasi ditandai dibaca`);
    } catch (err: any) {
      toast.error("Gagal menandai", { description: err.message });
    } finally {
      setMarking(false);
    }
  };

  const markOne = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      /* diamkan, tidak kritis */
    }
  };

  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 tracking-wide uppercase text-[10px]">
          Memuat Notifikasi...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.16em] mb-2">Pemberitahuan</p>
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-[-0.03em] flex items-center gap-2">
              Notifikasi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {([
          { id: "all", label: `Semua (${items.length})` },
          { id: "unread", label: `Belum dibaca (${unreadCount})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
              filter === tab.id
                ? "bg-blue-800 text-white"
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white dark:bg-[#0d1929] border-y border-slate-200 dark:border-white/10 p-12 sm:p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            {filter === "unread" ? "Tidak ada yang belum dibaca" : "Belum ada notifikasi"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pemberitahuan tentang paket dan pembayaran akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-white/10 border-y border-slate-200 dark:border-white/10">
          {visible.map((n) => {
            const style = TYPE_STYLE[n.type ?? "info"] ?? TYPE_STYLE.info;
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markOne(n.id)}
                className={cn(
                  "w-full text-left bg-white dark:bg-[#0d1929] border-l-2 p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700",
                  n.read
                    ? "border-slate-200 dark:border-white/5"
                    : "border-l-blue-600 bg-blue-50/40 dark:bg-blue-500/[0.04]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2 shrink-0",
                      n.read ? "bg-transparent" : "bg-blue-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {n.title}
                      </h3>
                      <span className={cn("rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", style.badge)}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-2">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
