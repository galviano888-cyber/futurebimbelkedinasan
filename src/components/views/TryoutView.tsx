import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  ShoppingCart, 
  Loader2,
  PackageSearch
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

export function TryoutView() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('packages')
          .select(`
            id,
            title,
            description,
            price,
            contents:package_contents (
              id,
              type,
              title,
              url,
              order_index
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Sort contents by order_index
        const formattedData = (data as any[] || []).map(pkg => ({
          ...pkg,
          contents: (pkg.contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
        })) as Package[];

        setPackages(formattedData);
      } catch (error) {
        console.error("Gagal mengambil katalog:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
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
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat katalog paket...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-7">
        <h1 className="text-slate-900 font-black text-3xl tracking-tight">
          Katalog Paket Belajar
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Pilih paket bimbingan terbaik untuk persiapan ujian Kedinasan Anda.
        </p>
      </div>

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
                <Card key={pkg.id} className="lg:col-span-2 overflow-hidden border-none bg-slate-900 shadow-xl relative group rounded-xl">
                  {/* Badge */}
                  <div className="absolute top-0 right-0 bg-blue-500 text-slate-900 font-bold text-xs py-1.5 px-4 rounded-bl-lg z-10">
                    HARGA SPESIAL BATCH 1
                  </div>
                  
                  <div className="p-8 md:p-10 flex flex-col lg:flex-row gap-10 items-center">
                    {/* Content Section */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <p className="text-blue-500 font-semibold text-xs uppercase tracking-wide mb-2">
                          PRE-REGISTRATION BATCH 1 - BULAN MEI 2026
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                          {pkg.title}
                        </h2>
                      </div>
                      
                      <div className="space-y-3.5">
                        {pkg.contents.length > 0 ? pkg.contents.map((item) => (
                          <div key={item.id} className="flex items-center text-slate-200">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                            <span className="text-sm">{item.title}</span>
                          </div>
                        )) : (
                          <>
                            <div className="flex items-center text-slate-200">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-sm">15x Live Class Zoom (Pembahasan Materi & Strategi SKD)</span>
                            </div>
                            <div className="flex items-center text-slate-200">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-sm">Free Modul SKD (Disusun khusus Untuk SKD Tahun 2026)</span>
                            </div>
                            <div className="flex items-center text-slate-200">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-sm">Free 5x Paket Tryout SKD (Disesuaikan SKD 2024 & 2025)</span>
                            </div>
                            <div className="flex items-center text-slate-200">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-sm">Grup Diskusi Belajar dengan Mentor</span>
                            </div>
                            <div className="flex items-center text-slate-200">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                              <span className="text-sm">Dibimbing Langsung Oleh Mentor Mahasiswa Kedinasan</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Card Section */}
                    <div className="w-full lg:w-[320px] bg-slate-800 p-8 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center min-h-[280px]">
                      <p className="text-slate-400 line-through text-sm mb-2">Rp 250.000</p>
                      <p className="text-4xl font-bold text-white mb-6">
                        {formatPrice(pkg.price)}
                      </p>
                      <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-slate-900 font-semibold text-base py-6 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Daftar Sekarang
                      </Button>
                      <p className="text-slate-400 text-xs mt-4">Kuota Terbatas!</p>
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
