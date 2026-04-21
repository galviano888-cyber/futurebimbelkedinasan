import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, AtSign, Loader2 } from "lucide-react";
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
        if (data && data.value) {
          setContacts(data.value);
        }
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 dark:text-white font-bold text-2xl tracking-tight">
          Pusat Bantuan & Kontak
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Hubungi kami jika kamu memiliki pertanyaan atau kendala seputar aplikasi dan paket belajar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div>
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">WhatsApp Admin</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Layanan bantuan cepat untuk pendaftaran, pembayaran, dan pertanyaan teknis.
            </p>
          </div>
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none"
            onClick={() => window.open(`https://wa.me/${contacts.whatsapp}`, '_blank')}
          >
            Chat Admin FBK (+{contacts.whatsapp})
          </Button>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
          <div>
            <div className="bg-pink-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <AtSign className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Sosial Media</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Ikuti kami di Instagram dan TikTok untuk tips belajar, info pendaftaran, dan promo menarik.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-none"
              onClick={() => window.open(`https://instagram.com/${contacts.instagram}`, '_blank')}
            >
              Instagram: @{contacts.instagram}
            </Button>
            <Button 
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-none"
              onClick={() => window.open(`https://tiktok.com/@${contacts.tiktok}`, '_blank')}
            >
              TikTok: @{contacts.tiktok}
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
