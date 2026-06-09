import { useState, useEffect } from "react";
import { MessageCircle, AtSign, Loader2, ExternalLink, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function ContactView() {
  const [contacts, setContacts] = useState({
    whatsapp: "6287753646617",
    instagram: "futurebimbelkedinasan",
    tiktok: "futurebimbelkedinasan"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('site_settings').select('*').eq('key', 'official_contacts').maybeSingle();
        if (data && data.value) setContacts(data.value);
      } catch (err) { console.error("Gagal ambil kontak:", err); }
      finally { setLoading(false); }
    }
    fetchContacts();
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center gap-4">
      <Loader2 className="w-7 h-7 text-indigo-500 dark:text-indigo-400 animate-spin" />
      <span className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-widest">Memuat kontak...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2">Support</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pusat Bantuan</h1>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
          Hubungi kami jika ada pertanyaan atau kendala seputar aplikasi dan paket belajar.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none">
          <div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base mb-2">WhatsApp Admin</h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed mb-6">
              Layanan bantuan cepat untuk pendaftaran, pembayaran, dan pertanyaan teknis.
            </p>
          </div>
          <button
            onClick={() => window.open(`https://wa.me/${contacts.whatsapp}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Chat Admin FBK (+{contacts.whatsapp})
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sosial Media */}
        <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-pink-200 dark:hover:border-pink-500/20 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none">
          <div>
            <div className="w-10 h-10 bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-xl flex items-center justify-center mb-5">
              <AtSign className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base mb-2">Sosial Media</h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed mb-6">
              Ikuti kami di Instagram dan TikTok untuk tips belajar, info pendaftaran, dan promo menarik.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.open(`https://instagram.com/${contacts.instagram}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 border border-pink-100 dark:border-pink-500/20 text-pink-700 dark:text-pink-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
            >
              <AtSign className="w-4 h-4" /> Instagram: @{contacts.instagram} <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.open(`https://tiktok.com/@${contacts.tiktok}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
            >
              <AtSign className="w-4 h-4" /> TikTok: @{contacts.tiktok} <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Jam Operasional */}
      <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm mb-1">Jam Operasional</h3>
          <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed">
            Tim admin kami siap membantu pada hari Senin–Sabtu, pukul 08.00–21.00 WIB.
            Di luar jam tersebut, pesan Anda akan kami balas pada hari kerja berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
