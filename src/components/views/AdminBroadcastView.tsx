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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Pengumuman</h2>
              <p className="text-slate-500 font-medium">Kirim pesan penting ke seluruh siswa secara real-time.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pengumuman</label>
                <input 
                  type="text"
                  placeholder="Contoh: Tryout Akbar Dimulai!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Pesan</label>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {(['info', 'success', 'warning'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Pesan / Konten</label>
              <textarea 
                rows={6}
                placeholder="Tuliskan detail pengumuman di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none shadow-sm"
              />
            </div>

            <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Siswa akan menerima notifikasi pop-up seketika.
              </div>
              
              <Button 
                onClick={handleBroadcast}
                disabled={loading || !title || !message}
                className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? "MENGIRIM..." : "KIRIM SEKARANG"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500 text-white p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-lg">Broadcast Berhasil!</h4>
            <p className="text-white/80 text-sm font-medium">Pengumuman telah terkirim ke seluruh siswa yang terdaftar.</p>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex gap-5">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-amber-800 uppercase tracking-wider text-xs">Peringatan Penting</h4>
          <p className="text-amber-700/70 text-sm leading-relaxed">
            Gunakan fitur broadcast secara bijak. Pengiriman pesan yang terlalu sering dapat mengganggu pengalaman belajar siswa. Pastikan isi pesan sudah benar sebelum dikirim.
          </p>
        </div>
      </div>
    </div>
  );
}
