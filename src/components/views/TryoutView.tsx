import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Layout, 
  ChevronRight,
  Loader2,
  FileEdit,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface PackageContent {
  id: string;
  type: 'file' | 'video' | 'tryout';
  title: string;
  url?: string;
  order_index: number;
}

interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF';
  is_active: boolean;
  contents: PackageContent[];
}

interface TryoutViewProps {
  isAuthenticated: boolean;
  onPurchaseSuccess?: (transactionId: string) => void;
}

export function TryoutView({ isAuthenticated, onPurchaseSuccess }: TryoutViewProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        // 1. Ambil semua paket yang aktif
        const { data: allPackages, error: pkgError } = await supabase
          .from('packages')
          .select('*, contents:package_contents(*)')
          .eq('is_active', true);

        // 2. Ambil paket yang sudah dimiliki user
        const { data: { user } } = await supabase.auth.getUser();
        let ownedPackageIds: string[] = [];
        
        if (user) {
          const { data: owned } = await supabase
            .from('user_packages')
            .select('package_id')
            .eq('user_id', user.id);
          
          if (owned) {
            ownedPackageIds = owned.map(item => item.package_id);
          }
        }

        if (!pkgError && allPackages) {
          // 3. Filter: Tampilkan hanya yang BELUM dimiliki
          const filtered = allPackages
            .filter((p: any) => p.id !== '11111111-1111-1111-1111-111111111111' && !ownedPackageIds.includes(p.id))
            .map((p: any) => ({
              ...p,
              contents: (p.contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
            }));
          setPackages(filtered as Package[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat katalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Katalog */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Layout className="w-8 h-8 text-blue-600" />
            Katalog Paket Belajar & Tryout
          </h1>
          <p className="text-slate-500 text-sm mt-1">Pilih paket bimbingan dan uji kemampuan Anda dengan Tryout SKD.</p>
        </div>
      </div>

      {/* Grid Katalog Produk (Satuan, Bundle, Intensif) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Belum Ada Paket Tersedia</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Maaf, saat ini belum ada paket yang aktif. Silakan hubungi admin atau kembali lagi nanti.
            </p>
          </div>
        ) : (
          packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              {/* Badge Tipe Produk */}
              <div className="px-6 pt-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  pkg.product_type === 'INTENSIF' ? 'bg-purple-100 text-purple-700' :
                  pkg.product_type === 'BUNDLE' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {pkg.product_type === 'SATUAN' ? 'Tryout Satuan' : pkg.product_type === 'BUNDLE' ? 'Paket Tryout' : 'Program Intensif'}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                  {pkg.title}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-2 mb-6">
                  {pkg.description || "Dapatkan akses penuh ke materi dan tryout kualitas terbaik untuk persiapan tes kedinasan."}
                </p>

                {/* Detail Singkat */}
                <div className="flex items-center gap-4 mb-6">
                   <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                     <FileEdit className="w-3.5 h-3.5" /> {pkg.contents?.length || 0} Konten
                   </div>
                   {pkg.product_type === 'SATUAN' && (
                     <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                       <Clock className="w-3.5 h-3.5" /> 100 Menit
                     </div>
                   )}
                </div>

                {/* Harga & Tombol Aksi */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Paket</p>
                    <p className="text-xl font-black text-blue-600">
                      {pkg.price === 0 ? "GRATIS" : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!isAuthenticated) {
                        // Memanggil tombol login di header berdasarkan atribut yang ada
                        const loginBtn = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
                        if (loginBtn) {
                          loginBtn.click();
                        } else {
                          // Fallback jika ID tidak ketemu
                          alert("Silakan klik tombol 'Masuk' di pojok kanan atas untuk melanjutkan.");
                        }
                        return;
                      }

                      if (pkg.price === 0) {
                        if (!supabase) return;
                        setLoading(true);
                        try {
                          const { data: userData } = await supabase.auth.getUser();
                          if (!userData.user) throw new Error("Silakan login kembali.");

                          const { error } = await supabase.from('user_packages').insert([{
                            user_id: userData.user.id,
                            package_id: pkg.id
                          }]);

                          if (error) {
                            if (error.code === '23505') alert("Anda sudah memiliki paket ini!");
                            else throw error;
                          } else {
                            alert("Selamat! Paket gratis berhasil ditambahkan ke akun Anda.");
                            window.location.reload();
                          }
                        } catch (err: any) {
                          alert(`Gagal mengambil paket: ${err.message}`);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        // MANUAL PAYMENT FLOW
                        if (!supabase) return;
                        setLoading(true);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session?.user) throw new Error("Silakan login untuk membeli.");

                          // Ensure profile exists (for old users before the profile table was created)
                          await supabase.from('profiles').upsert({
                            id: session.user.id,
                            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                            email: session.user.email
                          }, { onConflict: 'id' });

                          // CHECK FOR EXISTING PENDING OR VERIFYING TRANSACTION
                          const { data: existingTxs, error: checkError } = await supabase
                            .from('transactions')
                            .select('id, status')
                            .eq('user_id', session.user.id)
                            .eq('package_id', pkg.id)
                            .in('status', ['pending', 'verifying'])
                            .order('created_at', { ascending: false });

                          if (checkError) console.error("Check error:", checkError);

                          if (existingTxs && existingTxs.length > 0) {
                            // PRIORITAS: Cari yang 'verifying' dulu, kalau nggak ada baru yang 'pending' terbaru
                            const bestTx = existingTxs.find(tx => tx.status === 'verifying') || existingTxs[0];
                            
                            if (onPurchaseSuccess) onPurchaseSuccess(bestTx.id);
                            setLoading(false);
                            return;
                          }

                          const invoice_id = `INV-SKD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
                          const expiry_date = new Date();
                          expiry_date.setHours(expiry_date.getHours() + 48);

                          const { data: newTx, error: txError } = await supabase
                            .from('transactions')
                            .insert([{
                              id: crypto.randomUUID(),
                              user_id: session.user.id,
                              package_id: pkg.id,
                              amount: pkg.price,
                              invoice_id: invoice_id,
                              status: 'pending',
                              expiry_date: expiry_date.toISOString()
                            }])
                            .select()
                            .single();

                          if (txError) throw txError;

                          if (onPurchaseSuccess && newTx) {
                            onPurchaseSuccess(newTx.id);
                          }

                        } catch (err: any) {
                          alert(`Gagal memproses pesanan: ${err.message}`);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className="px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                  >
                    Beli <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
