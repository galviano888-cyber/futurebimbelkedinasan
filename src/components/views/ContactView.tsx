import { useState, useEffect } from "react";
import { MessageCircle, Loader2, ExternalLink, Clock, CreditCard, Package, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SEO } from "@/components/SEO";

export function ContactView() {
  const [whatsapp, setWhatsapp] = useState("6287753646617");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "official_contacts")
          .maybeSingle();
        if (data?.value?.whatsapp) setWhatsapp(data.value.whatsapp);
      } catch (err) {
        console.error("Gagal ambil kontak:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-4">
        <Loader2 className="w-7 h-7 text-blue-500 dark:text-blue-400 animate-spin" />
        <span className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-wide">
          Memuat kontak...
        </span>
      </div>
    );
  }

  const waNumber = whatsapp.replace(/\D/g, "");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <SEO
        title="Pusat Bantuan"
        description="Hubungi admin Future Bimbel Kedinasan melalui WhatsApp untuk pertanyaan seputar akun, paket belajar, pembayaran, dan tryout SKD."
        url="https://www.futurebimbelkedinasan.com/help"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.18em] mb-2">Bantuan FBK</p>
          <h1 className="text-[30px] sm:text-[34px] font-bold text-slate-900 dark:text-white tracking-[-0.04em]">
            Ada yang bisa kami bantu?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-xl leading-relaxed text-justify">
            Tanyakan soal akun, paket belajar, pembayaran, atau kendala saat menggunakan platform.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-2.5 border border-blue-200 dark:border-blue-400/20 bg-blue-50 dark:bg-blue-500/5 text-blue-900 dark:text-blue-100">
          <Clock className="w-4 h-4 text-blue-700 dark:text-blue-300" />
          <span className="text-xs font-semibold">
            Senin–Sabtu <span className="text-blue-700 dark:text-blue-300">08.00–21.00 WIB</span>
          </span>
        </div>
      </div>

      {/* WhatsApp — satu-satunya kanal kontak */}
      <section className="relative overflow-hidden bg-[#102b54] text-white p-6 sm:p-8 lg:p-10 border border-blue-900/20">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full border border-white/[0.08] pointer-events-none" />
        <div className="absolute -right-10 -top-14 w-52 h-52 rounded-full border border-white/[0.07] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">Kanal kontak</p>
              <p className="text-sm font-semibold text-white">WhatsApp Admin</p>
            </div>
          </div>

          <div className="max-w-xl mb-8">
            <h2 className="text-[25px] sm:text-[31px] font-bold tracking-[-0.035em] leading-tight">
              Hubungi kami lewat WhatsApp
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-100/85 text-justify">
              Semua pertanyaan seputar akun, pembayaran, paket belajar, dan kendala teknis
              dilayani melalui WhatsApp. Kami balas pada jam layanan admin.
            </p>
          </div>

          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 bg-emerald-400 px-6 py-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <MessageCircle className="w-4 h-4" />
            Chat Admin FBK
            <span className="font-medium text-emerald-950/75">+{whatsapp}</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* Topik yang bisa ditanyakan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-slate-200 dark:border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
        {[
          { icon: Package, title: "Paket belajar", text: "Isi paket, masa akses, dan cara mulai belajar." },
          { icon: CreditCard, title: "Pembayaran", text: "Konfirmasi transfer dan aktivasi akses paket." },
          { icon: HelpCircle, title: "Kendala teknis", text: "Masalah login, tryout, atau hasil ujian." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="p-5 sm:p-6 bg-white dark:bg-[#0d1929]">
            <Icon className="w-5 h-5 text-blue-700 dark:text-blue-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Jam layanan */}
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
