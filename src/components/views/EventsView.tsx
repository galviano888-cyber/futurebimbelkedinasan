import { useState, useEffect } from "react";
import { Calendar, MapPin, ExternalLink, Clock, Sparkles, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  image?: string;
  url?: string;
}

export function EventsView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch from package_contents where zoom_link or schedule_date is present
      const { data, error } = await supabase
        .from('package_contents')
        .select('*')
        .or('zoom_link.neq.null,schedule_date.neq.null')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: Event[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          date: item.schedule_date || "Segera Hadir",
          time: item.live_schedule || "Waktu Menyusul",
          location: item.zoom_link ? "Zoom Meeting" : "Platform FBK",
          type: "Live Class",
          description: "Sesi bimbingan intensif bersama mentor terbaik FBK.",
          image: "https://images.unsplash.com/photo-1591115765373-520b7a52d86e?auto=format&fit=crop&q=80&w=800",
          url: item.zoom_link
        }));
        setEvents(formatted);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <SEO title="Events & Webinar | Future Bimbel" description="Ikuti berbagai event seru, webinar inspiratif, dan tryout akbar dari Future Bimbel Kedinasan." />
      
      <div className="relative overflow-hidden rounded-[3rem] bg-[#050b18] p-8 md:p-16 text-white border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Sparkles className="w-3 h-3" />
            Agenda Mendatang
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            Event & <span className="text-blue-500">Webinar</span> Eksklusif
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg font-medium leading-relaxed"
          >
            Pantau terus jadwal bimbingan dan event akbar kami untuk persiapan maksimal menembus kedinasan.
          </motion.p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sinkronisasi Jadwal...</p>
          </motion.div>
        ) : events.length > 0 ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                      {event.type}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.date}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {event.time}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6 flex-1">
                    {event.description}
                  </p>

                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold">{event.location}</span>
                    </div>
                    {event.url && (
                      <a href={event.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-black uppercase tracking-widest transition-colors group/btn">
                        Masuk
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 px-6 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-inner">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Belum Ada Event Terjadwal</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto font-medium leading-relaxed mb-8">
              Saat ini belum ada event atau webinar publik yang tersedia. Silakan cek kembali secara berkala atau hubungi admin untuk info kelas terbaru.
            </p>
            <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Info className="w-4 h-4" />
              Update Otomatis Aktif
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="bg-blue-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-[40px] border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-[60px] border-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        
        <h2 className="text-3xl font-black tracking-tight mb-4 relative z-10">Punya Pertanyaan Mengenai Event?</h2>
        <p className="text-blue-100 font-medium mb-8 max-w-xl mx-auto relative z-10">Hubungi tim admin kami untuk informasi lebih lanjut mengenai pendaftaran dan detail teknis pelaksanaan event.</p>
        <button className="px-10 py-4 bg-white text-blue-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-50 transition-all shadow-lg relative z-10 active:scale-95">
          HUBUNGI ADMIN
        </button>
      </div>
    </div>
  );
}
