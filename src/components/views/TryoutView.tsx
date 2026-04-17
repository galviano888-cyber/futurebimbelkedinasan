import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  ShoppingCart, 
  Loader2,
  PackageSearch,
  Play,
  Clock,
  FileEdit
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PackageContent {
  id: string;
  type: string;
  title: string;
  url: string | null;
}

interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
  contents: PackageContent[];
}

interface TryoutPackage {
  id: string;
  name: string;
  duration_minutes: number;
  status: string;
  category: string;
}

interface TryoutViewProps {
  onStartTryout?: (id: string) => void;
}

export function TryoutView({ onStartTryout }: TryoutViewProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [tryoutPackages, setTryoutPackages] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [pkgRes, tryoutRes] = await Promise.all([
          supabase.from('packages').select(`id, title, description, price, contents:package_contents (id, type, title, url, order_index)`),
          supabase.from('tryout_packages').select('*').eq('status', 'Published').order('created_at', { ascending: false })
        ]);

        if (pkgRes.data) {
          const formattedPackages = pkgRes.data.map((p: any) => ({
            ...p,
            contents: (p.contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
          }));
          setPackages(formattedPackages);
        }

        if (tryoutRes.data) {
          setTryoutPackages(tryoutRes.data as TryoutPackage[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-7">
        <h1 className="text-slate-900 font-black text-3xl tracking-tight">
          Katalog Paket Belajar & Tryout
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Pilih paket bimbingan dan uji kemampuan Anda dengan Tryout SKD.
        </p>
      </div>

      {/* Daftar Tryout yang Tersedia dari Database */}
      {tryoutPackages.length > 0 && onStartTryout && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Daftar Tryout Tersedia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tryoutPackages.map((tp) => (
              <Card key={tp.id} className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 border-none overflow-hidden relative rounded-2xl shadow-xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative p-6 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FileEdit className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold backdrop-blur-sm">
                        {tp.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white mb-2 leading-tight">{tp.name}</h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-1 text-blue-100 text-sm font-medium">
                        <Clock className="w-4 h-4" /> {tp.duration_minutes} Menit
                      </span>
                      <span className="flex items-center gap-1 text-blue-100 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> 110 Soal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onStartTryout(tp.id)}
                    className="w-full mt-6 flex justify-center items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    Mulai Tryout
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <PackageSearch className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Paket Tersedia</h2>
          <p className="text-slate-500 max-w-md text-sm">
            Maaf, saat ini belum ada paket yang aktif. Silakan hubungi admin atau kembali lagi nanti.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {packages.map((pkg, idx) => {
            const isFeatured = idx === 0; // Paket terbaru jadi featured (banner besar)
            
            if (isFeatured) {
              return (
                <Card key={pkg.id} className="lg:col-span-2 overflow-hidden border-none bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 shadow-2xl relative group rounded-3xl flex flex-col lg:flex-row">
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-white text-blue-700 font-black text-xs md:text-sm py-2.5 px-6 rounded-bl-2xl z-20 shadow-lg">
                    HARGA SPESIAL BATCH 1
                  </div>
                  
                  {/* Left Side (Features) */}
                  <div className="flex-1 p-8 md:p-10 lg:pr-0 relative z-10">
                    <div className="mb-8">
                      <p className="text-white/90 font-bold text-sm uppercase tracking-wider mb-1">
                        PRE-REGISTRATION BATCH 1
                      </p>
                      <p className="text-white/80 font-medium text-xs mb-4">
                        BULAN MEI 2026
                      </p>
                      <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                        PROGRAM<br />INTENSIF SKD<br />KEDINASAN
                      </h2>
                    </div>
                    
                    {/* Black Feature Box */}
                    <div className="bg-[#1C1C1C] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative z-20 -mr-4 lg:-mr-16">
                      <div className="flex items-start">
                        <div className="bg-[#1A73E8] rounded-full p-0.5 mr-4 flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base md:text-lg">15x Live Class Zoom</h4>
                          <p className="text-slate-300 text-sm">Pembahasan Materi & Strategi SKD</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#1A73E8] rounded-full p-0.5 mr-4 flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base md:text-lg">Free Modul SKD</h4>
                          <p className="text-slate-300 text-sm">Disusun khusus Untuk SKD Tahun 2026</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#1A73E8] rounded-full p-0.5 mr-4 flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base md:text-lg">Free Paket Tryout SKD</h4>
                          <p className="text-slate-300 text-sm">5x Tryout Dengan Pola Soal Yang Sudah<br className="hidden md:block" />Disesuaikan Dari SKD Tahun 2024 & 2025</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#1A73E8] rounded-full p-0.5 mr-4 flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base md:text-lg">Grup Diskusi Belajar</h4>
                          <p className="text-slate-300 text-sm">dengan Mentor</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#1A73E8] rounded-full p-0.5 mr-4 flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base md:text-lg">Dibimbing Langsung Oleh</h4>
                          <p className="text-slate-300 text-sm">Mentor Mahasiswa Kedinasan</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side (Price & CTA) */}
                  <div className="w-full lg:w-[420px] p-8 md:p-10 pt-16 lg:pt-10 flex flex-col items-center justify-end lg:justify-center text-center relative">
                    {/* Add a dotted background pattern similar to poster */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 3px, transparent 3px)', backgroundSize: '16px 16px' }} />
                    
                    <div className="relative z-10 w-full mt-10 lg:mt-auto flex flex-col items-center lg:pl-10">
                      <p className="text-white/80 line-through text-xl font-bold mb-1 tracking-wide">Rp 250.000</p>
                      <p className="text-5xl md:text-6xl font-black text-white mb-8 drop-shadow-lg tracking-tighter">
                        Rp 99.999
                      </p>
                      
                      <Button 
                        className="w-full max-w-[280px] bg-white hover:bg-slate-100 text-blue-700 font-black text-lg py-6 md:py-7 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart className="w-6 h-6" />
                        Daftar Sekarang
                      </Button>
                      
                      <div className="mt-8 text-white text-sm text-center">
                        <p className="font-semibold text-lg mb-2 opacity-95 tracking-wide">bit.ly/DaftarBatch1FBK</p>
                        <div className="flex flex-col gap-1 text-xs opacity-80">
                          <p>TIKTOK & IG: @futurebimbelkedinasan</p>
                          <p>WA: +62-877-5364-6617</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            // Paket lainnya (Card standar)
            return (
              <Card key={pkg.id} className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden p-8 flex flex-col group">
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {pkg.description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    {pkg.contents.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                        <span className="text-xs font-semibold">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Mulai dari</p>
                    <p className="text-2xl font-black text-slate-900">{formatPrice(pkg.price)}</p>
                  </div>
                  <Button className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-6 py-5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">
                    Detail
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
