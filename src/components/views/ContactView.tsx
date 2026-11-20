import { useState, useEffect } from "react";
import { MessageCircle, AtSign, Loader2, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";

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
      <Loader2 className="w-7 h-7 text-blue-500 dark:text-blue-400 animate-spin" />
      <span className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-wide">Memuat kontak...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <SEO
        title="Pusat Bantuan"
        description="Hubungi admin Future Bimbel Kedinasan lewat WhatsApp, Instagram, atau TikTok untuk pertanyaan seputar paket belajar dan tryout SKD."
        url="https://www.futurebimbelkedinasan.com/help"
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.18em] mb-2">Bantuan FBK</p>
          <h1 className="text-[30px] sm:text-[34px] font-bold text-slate-900 dark:text-white tracking-[-0.04em]">Ada yang bisa kami bantu?</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
            Tanyakan soal akun, paket belajar, pembayaran, atau kendala saat menggunakan platform.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-2.5 border border-blue-200 dark:border-blue-400/20 bg-blue-50 dark:bg-blue-500/5 text-blue-900 dark:text-blue-100">
          <Clock className="w-4 h-4 text-blue-700 dark:text-blue-300" />
          <span className="text-xs font-semibold">Senin–Sabtu <span className="text-blue-700 dark:text-blue-300">08.00–21.00 WIB</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 lg:gap-6">
        <section className="relative overflow-hidden bg-[#102b54] text-white p-6 sm:p-8 lg:p-9 border border-blue-900/20">
          <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full border border-white/[0.08] pointer-events-none" />
          <div className="absolute -right-10 -top-14 w-52 h-52 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="relative flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">Kontak utama</p>
                <p className="text-sm font-semibold text-white">WhatsApp Admin</p>
              </div>
            </div>
            <div className="max-w-lg mb-8">
              <h2 className="text-[25px] sm:text-[30px] font-bold tracking-[-0.035em] leading-tight">Butuh bantuan soal akun atau paket?</h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/85">
                Hubungi admin untuk pertanyaan pendaftaran, pembayaran, paket belajar, dan kendala teknis.
              </p>
            </div>
            <a
              href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-auto group inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 bg-emerald-400 px-5 py-3 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MessageCircle className="w-4 h-4" />
              Chat Admin FBK
              <span className="font-medium text-emerald-950/75">+{contacts.whatsapp}</span>
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </section>

        <section className="bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/10 p-6 sm:p-7 lg:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <AtSign className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Ikuti kabar FBK</p>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sosial Media</h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
            Tips belajar, informasi pendaftaran, dan kabar terbaru seputar persiapan sekolah kedinasan.
          </p>
          <div className="mt-auto space-y-2.5">
            <a href={`https://instagram.com/${contacts.instagram}`} target="_blank" rel="noreferrer" className="group flex min-h-11 items-center justify-between gap-3 border border-blue-100 dark:border-white/10 bg-blue-50/70 dark:bg-white/[0.03] px-4 py-3 text-sm font-semibold text-blue-900 dark:text-blue-100 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              <span>Instagram <span className="font-normal text-blue-700 dark:text-blue-300">@{contacts.instagram}</span></span>
              <ExternalLink className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a href={`https://tiktok.com/@${contacts.tiktok}`} target="_blank" rel="noreferrer" className="group flex min-h-11 items-center justify-between gap-3 border border-blue-100 dark:border-white/10 bg-blue-50/70 dark:bg-white/[0.03] px-4 py-3 text-sm font-semibold text-blue-900 dark:text-blue-100 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              <span>TikTok <span className="font-normal text-blue-700 dark:text-blue-300">@{contacts.tiktok}</span></span>
              <ExternalLink className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border border-blue-200 dark:border-blue-400/15 bg-blue-50/80 dark:bg-blue-500/[0.05] px-5 py-4 sm:px-6">
        <div className="w-10 h-10 bg-white dark:bg-[#102b54] border border-blue-100 dark:border-blue-400/20 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Jam layanan admin</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
            Senin–Sabtu, 08.00–21.00 WIB. Pesan di luar jam layanan akan dibalas pada hari kerja berikutnya.
          </p>
        </div>
        <span className="sm:ml-auto inline-flex items-center gap-2 self-start sm:self-auto border border-blue-200 dark:border-blue-400/20 bg-white/70 dark:bg-white/[0.03] px-3 py-2 text-xs font-semibold text-blue-900 dark:text-blue-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Senin–Sabtu
        </span>
      </div>
    </div>
  );
}
