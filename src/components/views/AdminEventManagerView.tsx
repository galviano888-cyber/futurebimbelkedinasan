import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Loader2, Calendar,
  Clock, ToggleLeft, ToggleRight, ChevronLeft, AlertTriangle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  package_id: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  duration_minutes: number;
  created_at: string;
  tryout_packages?: { name: string; category: string } | null;
}

interface TryoutPackage {
  id: string;
  name: string;
  category: string;
  question_count?: number;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  package_id: "",
  is_active: false,
  start_date: "",
  end_date: "",
  duration_minutes: 90,
};

export function AdminEventManagerView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchEvents();
    fetchPackages();
  }, []);

  const fetchEvents = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Auto-expire events whose end_date has passed
      const now = new Date().toISOString();
      await supabase
        .from("events")
        .update({ is_active: false })
        .eq("is_active", true)
        .lt("end_date", now);

      const { data, error } = await supabase
        .from("events")
        .select("*, tryout_packages(name, category)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);

      // Fetch participant counts
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (ev: Event) => {
            const { count } = await supabase!
              .from("event_results")
              .select("*", { count: "exact", head: true })
              .eq("event_id", ev.id);
            counts[ev.id] = count || 0;
          })
        );
        setParticipantCounts(counts);
      }
    } catch (err: any) {
      toast.error("Gagal memuat events: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("tryout_packages")
      .select("id, name, category, tryout_questions(count)")
      .eq("status", "Published")
      .order("name");
    if (data) {
      setPackages(data.map((p: any) => ({ ...p, question_count: p.tryout_questions?.[0]?.count ?? 0 })));
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setView("form");
  };

  const handleOpenEdit = (ev: Event) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      package_id: ev.package_id || "",
      is_active: ev.is_active,
      start_date: ev.start_date ? ev.start_date.slice(0, 16) : "",
      end_date: ev.end_date ? ev.end_date.slice(0, 16) : "",
      duration_minutes: ev.duration_minutes || 90,
    });
    setView("form");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Judul event harus diisi!");
    if (!form.package_id) return toast.error("Pilih paket soal terlebih dahulu!");
    if (form.end_date && form.start_date && form.end_date <= form.start_date) {
      return toast.error("Tanggal selesai harus setelah tanggal mulai!");
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        package_id: form.package_id,
        is_active: form.is_active,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        duration_minutes: form.duration_minutes,
      };

      if (editingId) {
        const { error } = await supabase!.from("events").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Event berhasil diperbarui!");
      } else {
        const { error } = await supabase!.from("events").insert(payload);
        if (error) throw error;
        toast.success("Event berhasil dibuat!");
      }
      setView("list");
      fetchEvents();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ev: Event) => {
    if (!supabase) return;
    // Check if end_date is past — block re-activation
    if (!ev.is_active && ev.end_date && new Date(ev.end_date) < new Date()) {
      toast.error("Event sudah berakhir. Perbarui tanggal selesai untuk mengaktifkan kembali.");
      return;
    }
    const { error } = await supabase
      .from("events")
      .update({ is_active: !ev.is_active })
      .eq("id", ev.id);
    if (!error) {
      setEvents(events.map(e => e.id === ev.id ? { ...e, is_active: !e.is_active } : e));
      toast.success(ev.is_active ? "Event dinonaktifkan" : "Event diaktifkan");
    } else {
      toast.error("Gagal mengubah status: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from("event_results").delete().eq("event_id", id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      toast.success("Event berhasil dihapus");
      fetchEvents();
    } else {
      toast.error("Gagal hapus: " + error.message);
    }
    setConfirmDelete({ open: false, id: "", title: "" });
  };

  const getEventStatus = (ev: Event) => {
    const now = new Date();
    if (!ev.is_active) return { label: "Nonaktif", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
    if (ev.start_date && new Date(ev.start_date) > now) return { label: "Belum Mulai", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    if (ev.end_date && new Date(ev.end_date) < now) return { label: "Berakhir", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    return { label: "Aktif", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ── FORM VIEW ──────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors font-bold text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Daftar Event
          </button>
          <span className="text-slate-700">/</span>
          <span className="text-white font-bold text-sm">{editingId ? "Edit Event" : "Buat Event Baru"}</span>
        </div>

        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-8 space-y-6">
          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Judul Event *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Tryout Akbar TWK Seri 1"
              className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat event ini..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          {/* Paket Soal */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paket Soal (Bank Soal) *</label>
            <select
              value={form.package_id}
              onChange={e => setForm(f => ({ ...f, package_id: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm outline-none appearance-none cursor-pointer focus:border-blue-500/40 transition-all"
            >
              <option value="" className="bg-slate-900">-- Pilih paket soal --</option>
              {packages.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  [{p.category}] {p.name} ({p.question_count} soal)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-600">Hanya menampilkan paket dengan status Published.</p>
          </div>

          {/* Durasi */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durasi Pengerjaan (menit) *</label>
            <input
              type="number"
              min={5}
              max={300}
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 90 }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Mulai</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm outline-none focus:border-blue-500/40 transition-all [color-scheme:dark]"
              />
              <p className="text-[11px] text-slate-600">Kosongkan jika bisa dimulai kapan saja.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Selesai (Countdown)</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white text-sm outline-none focus:border-blue-500/40 transition-all [color-scheme:dark]"
              />
              <p className="text-[11px] text-slate-600">Event otomatis nonaktif setelah waktu ini.</p>
            </div>
          </div>

          {/* Status Aktif */}
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div>
              <p className="text-sm font-bold text-white">Status Aktif</p>
              <p className="text-xs text-slate-500 mt-0.5">Event akan tampil dan bisa diikuti siswa</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className="transition-colors"
            >
              {form.is_active
                ? <ToggleRight className="w-8 h-8 text-emerald-400" />
                : <ToggleLeft className="w-8 h-8 text-slate-600" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setView("list")}
              className="flex-1 h-11 rounded-xl font-bold text-slate-400 border-white/8 bg-transparent hover:bg-white/5"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Simpan Perubahan" : "Buat Event"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Event</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">{events.length} event terdaftar</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" /> Buat Event
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-[#0d0d14] border border-white/5 rounded-2xl">
          <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-sm">Belum ada event. Buat event pertama!</p>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Paket Soal</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Jadwal</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Peserta</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-600 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {events.map(ev => {
                const status = getEventStatus(ev);
                return (
                  <tr key={ev.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-sm">{ev.title}</p>
                      {ev.description && <p className="text-xs text-slate-600 mt-0.5 max-w-[200px] truncate">{ev.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {ev.tryout_packages ? (
                        <div>
                          <span className="text-[9px] font-bold text-blue-400 uppercase">{ev.tryout_packages.category}</span>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[150px] truncate">{ev.tryout_packages.name}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ev.start_date)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Clock className="w-3 h-3" />
                          {formatDate(ev.end_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        {participantCounts[ev.id] ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(ev)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                          status.color
                        )}
                      >
                        {ev.is_active
                          ? <ToggleRight className="w-3.5 h-3.5" />
                          : <ToggleLeft className="w-3.5 h-3.5" />}
                        {status.label}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: ev.id, title: ev.title })}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Hapus Event</h3>
            <p className="text-sm text-slate-500 mb-7">Hapus event "{confirmDelete.title}" beserta semua data hasil peserta secara permanen?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete({ open: false, id: "", title: "" })}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
