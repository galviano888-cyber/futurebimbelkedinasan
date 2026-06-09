import { useState } from "react";
import { Megaphone, Send, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function AdminBroadcastView() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim() || !supabase) return;
    
    const confirmSend = confirm(`Kirim pengumuman ini ke SELURUH siswa aktif?`);
    if (!confirmSend) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('broadcast_notification', {
        title: title,
        message: message,
        type: type
      });

      if (error) throw error;
      
      setSuccess(true);
      setTitle("");
      setMessage("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      toast.error("Gagal mengirim broadcast: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Pusat Pengumuman</h2>
            <p className="text-xs text-slate-600 font-medium">Kirim pesan ke seluruh siswa secara real-time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Judul Pengumuman</label>
            <input
              type="text"
              placeholder="Contoh: Tryout Akbar Dimulai!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/8 text-white rounded-xl text-sm font-bold placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tipe Pesan</label>
            <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
              {(['info', 'success', 'warning'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    type === t
                      ? t === 'info' ? 'bg-indigo-600 text-white shadow'
                        : t === 'success' ? 'bg-emerald-600 text-white shadow'
                        : 'bg-amber-600 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Isi Pesan</label>
          <textarea
            rows={5}
            placeholder="Tuliskan detail pengumuman di sini..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/8 text-white rounded-xl text-sm font-medium placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Siswa menerima notifikasi seketika.
          </div>
          <Button
            onClick={handleBroadcast}
            disabled={loading || !title || !message}
            className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Mengirim...' : 'Kirim Sekarang'}
          </Button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-black text-emerald-400 text-sm">Broadcast Berhasil!</h4>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Pengumuman terkirim ke seluruh siswa yang terdaftar.</p>
          </div>
        </div>
      )}

      <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl flex gap-4">
        <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="font-black text-amber-400 uppercase tracking-wider text-[10px] mb-1">Peringatan</h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            Gunakan broadcast secara bijak. Pesan yang terlalu sering mengirim dapat mengganggu pengalaman belajar siswa.
          </p>
        </div>
      </div>
    </div>
  );
}
