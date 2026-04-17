import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, AtSign, Link as LinkIcon, HelpCircle } from "lucide-react";

export function ContactView() {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Pusat Bantuan & Kontak
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Hubungi kami jika kamu memiliki pertanyaan atau kendala seputar aplikasi dan paket belajar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">WhatsApp Admin</h3>
            <p className="text-slate-400 text-sm mb-6">
              Layanan bantuan cepat untuk pendaftaran, pembayaran, dan pertanyaan teknis.
            </p>
          </div>
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none"
            onClick={() => window.open('https://wa.me/6287753646617', '_blank')}
          >
            Chat Admin FBK (+62 877-5364-6617)
          </Button>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="bg-pink-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <AtSign className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Sosial Media</h3>
            <p className="text-slate-400 text-sm mb-6">
              Ikuti kami di Instagram dan TikTok untuk tips belajar, info pendaftaran, dan promo menarik.
            </p>
          </div>
          <Button 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-none"
            onClick={() => window.open('https://instagram.com/futurebimbelkedinasan', '_blank')}
          >
            @futurebimbelkedinasan
          </Button>
        </Card>

        <Card className="p-6 bg-blue-500 border-blue-600 md:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-slate-900 text-xl mb-2">Daftar Batch 1 Sekarang!</h3>
            <p className="text-blue-900 text-sm mb-4 max-w-xl">
              Pendaftaran Program Intensif SKD Kedinasan Batch 1 telah dibuka. Kuota terbatas! Segera daftarkan diri kamu untuk mengamankan kursi dengan harga spesial.
            </p>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white border-none"
              onClick={() => window.open('https://bit.ly/DaftarBatch1FBK', '_blank')}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              bit.ly/DaftarBatch1FBK
            </Button>
          </div>
          <HelpCircle className="absolute -right-8 -bottom-8 w-48 h-48 text-blue-600/20" />
        </Card>
      </div>
    </div>
  );
}
