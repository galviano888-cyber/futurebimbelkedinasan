import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Clock, Zap, CheckCircle2, ShoppingCart } from "lucide-react";

const premiumPackage = {
  title: "Program Intensif SKD Kedinasan",
  subtitle: "PRE-REGISTRATION BATCH 1 - BULAN MEI 2026",
  priceOriginal: "Rp 250.000",
  priceDiscount: "Rp 99.999",
  features: [
    "15x Live Class Zoom (Pembahasan Materi & Strategi SKD)",
    "Free Modul SKD (Disusun khusus Untuk SKD Tahun 2026)",
    "Free 5x Paket Tryout SKD (Disesuaikan SKD 2024 & 2025)",
    "Grup Diskusi Belajar dengan Mentor",
    "Dibimbing Langsung Oleh Mentor Mahasiswa Kedinasan"
  ],
  link: "https://bit.ly/DaftarBatch1FBK"
};

const dummyTests = [
  {
    id: 1,
    title: "Paket SKD CPNS Gelombang I",
    duration: 120,
    questions: 110,
    description: "Latihan lengkap TWK, TIU, dan TKP untuk CPNS",
  },
  {
    id: 2,
    title: "Paket Simulasi SKD Nasional",
    duration: 120,
    questions: 110,
    description: "Simulasi resmi dengan standar ujian nasional",
  },
  {
    id: 3,
    title: "Paket SKD Kedinasan Premium",
    duration: 120,
    questions: 110,
    description: "Persiapan khusus untuk ujian kedinasan",
  },
];

export function TryoutView() {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Katalog Paket & Tryout SKD
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pilih paket tryout atau ikuti program pembinaan eksklusif kami.
        </p>
      </div>

      <div className="mb-8">
        <Card className="overflow-hidden border-blue-500 bg-slate-900 shadow-xl relative">
          <div className="absolute top-0 right-0 bg-blue-500 text-slate-900 font-bold text-xs py-1 px-3 rounded-bl-lg z-10">
            HARGA SPESIAL BATCH 1
          </div>
          <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-blue-500 font-semibold text-sm mb-1">{premiumPackage.subtitle}</p>
                <h2 className="text-3xl font-black text-white leading-tight">
                  {premiumPackage.title}
                </h2>
              </div>
              
              <ul className="space-y-3 pt-2">
                {premiumPackage.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="w-full lg:w-72 bg-slate-800 p-6 rounded-xl border border-slate-700 text-center flex flex-col justify-center items-center">
              <p className="text-slate-400 line-through text-sm mb-1">{premiumPackage.priceOriginal}</p>
              <p className="text-4xl font-black text-white mb-6">{premiumPackage.priceDiscount}</p>
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-slate-900 font-bold text-lg py-6"
                onClick={() => window.open(premiumPackage.link, '_blank')}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Daftar Sekarang
              </Button>
              <p className="text-slate-400 text-xs mt-4">Kuota Terbatas!</p>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Latihan Tryout SKD</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyTests.map((test) => (
          <Card key={test.id} className="p-6 bg-slate-900 border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
            <div className="mb-4">
              <h3 className="font-semibold text-white mb-2 line-clamp-1">
                {test.title}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2">
                {test.description}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-slate-300 text-sm bg-slate-800/50 p-2 rounded-md">
                <BookOpen className="w-4 h-4 mr-3 text-blue-500" />
                <span className="font-medium text-white">{test.questions}</span>&nbsp;Soal
              </div>
              <div className="flex items-center text-slate-300 text-sm bg-slate-800/50 p-2 rounded-md">
                <Clock className="w-4 h-4 mr-3 text-blue-500" />
                <span className="font-medium text-white">{test.duration}</span>&nbsp;Menit
              </div>
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-slate-900 font-semibold border-none">
              <Zap className="w-4 h-4 mr-2" />
              Mulai Kerjakan
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
