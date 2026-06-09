import { useState, useEffect } from "react";
import { Calendar, MapPin, ExternalLink, Clock, Sparkles, Loader2, Info, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string; title: string; date: string; time: string;
  location: string; type: string; description: string; image?: string; url?: string;
}

export function EventsView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('package_contents').select('*').or('zoom_link.neq.null,schedule_date.neq.null').order('created_at', { ascending: false });
      if (!error && data) {
        setEvents(data.map((item: any) => ({
          id: item.id, title: item.title,
          date: item.schedule_date || "Segera Hadir",
          time: item.live_schedule || "Waktu Menyusul",
          location: item.zoom_link ? "Zoom Meeting" : "Platform FBK",
          type: "Live Class",
          description: "Sesi bimbingan intensif bersama mentor terbaik FBK.",
          image: "https://images.unsplash.com/photo-1591115765373-520b7a52d86e?auto=format&fit=crop&q=80&w=800",
          url: item.zoom_link
        })));
      }
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SEO title="Events & Webinar | Future Bimbel" description="Ikuti berbagai event seru, webinar inspiratif, dan tryout akbar dari Future Bimbel Kedinasan." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2">Agenda</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Event &amp; Webinar</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Pantau jadwal bimbingan dan event akbar untuk persiapan maksimal.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Agenda Mendatang</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-widest">Sinkronisasi Jadwal...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
              <div className="relative h-44 overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 dark:from-[#0d0d14] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-white text-[9px] font-black uppercase tracking-widest rounded-lg backdrop-blur-sm">{event.type}</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    <Calendar className="w-3 h-3" /> {event.date}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {event.time}
                  </div>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                <p className="text-slate-500 dark:text-slate-500 text-xs font-medium leading-relaxed mb-4 flex-1">{event.description}</p>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{event.location}</span>
                  </div>
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-black uppercase tracking-widest transition-colors">
                      Masuk <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0d0d14] border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-5">
            <Calendar className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">Belum Ada Event Terjadwal</h3>
          <p className="text-slate-500 dark:text-slate-500 text-sm max-w-sm mx-auto leading-relaxed mb-6">Saat ini belum ada event atau webinar publik. Silakan cek kembali secara berkala.</p>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Info className="w-3.5 h-3.5" /> Update Otomatis Aktif
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <div className="bg-white dark:bg-[#0d0d14] border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 dark:bg-indigo-500/5 rounded-full -mr-24 -mt-24" />
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Punya Pertanyaan Mengenai Event?</h2>
          <p className="text-slate-500 dark:text-slate-500 text-sm max-w-md mx-auto">Hubungi tim admin kami untuk informasi lebih lanjut mengenai pendaftaran dan detail event.</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            Hubungi Admin
          </button>
        </div>
      </div>
    </div>
  );
}
