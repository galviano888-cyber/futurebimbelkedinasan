import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, ChevronRight, Loader2, FileEdit, Clock, Zap } from "lucide-react";
import { ExpandableDesc } from "@/components/ExpandableDesc";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  original_price?: number | null;
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF';
  is_active: boolean;
  cover_image_url?: string | null;
  contents: PackageContent[];
}

interface TryoutViewProps {
  isAuthenticated: boolean;
  onPurchaseSuccess?: (transactionId: string) => void;
  onLoginClick?: () => void;
}

export function TryoutView({ isAuthenticated, onPurchaseSuccess, onLoginClick }: TryoutViewProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: allPackages, error: pkgError } = await supabase
        .from('packages')
        .select('*, cover_image_url, contents:package_contents(*)')
        .eq('is_active', true);
      let ownedPackageIds: string[] = [];
      if (user) {
        const { data: owned } = await supabase.from('user_packages').select('package_id').eq('user_id', user.id);
        if (owned) ownedPackageIds = owned.map(item => item.package_id);
      }
      if (!pkgError && allPackages) {
        const filtered = allPackages
          .filter((p: any) => p.id !== '11111111-1111-1111-1111-111111111111' && !ownedPackageIds.includes(p.id))
          .map((p: any) => ({ ...p, contents: (p.contents || []).sort((a: any, b: any) => a.order_index - b.order_index) }));
        setPackages(filtered as Package[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePurchase = useCallback(async (pkg: Package) => {
    if (!isAuthenticated) { onLoginClick?.(); return; }
    if (!supabase) return;
    setProcessingId(pkg.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login kembali.");

      if (!user.email_confirmed_at && !user.confirmed_at) {
        toast.error("Email Belum Terverifikasi", {
          description: "Silakan verifikasi email Anda sebelum melakukan pembelian.",
          duration: 5000
        });
        return;
      }

      if (pkg.price === 0) {
        const { error } = await supabase.from('user_packages').insert([{ user_id: user.id, package_id: pkg.id }]);
        if (error) {
          if (error.code === '23505') toast.error("Anda sudah memiliki paket ini!");
          else toast.error("Gagal menambahkan paket: " + error.message);
        } else {
          toast.success("Paket gratis berhasil ditambahkan!", {
            description: "Cek menu 'Paket Saya' untuk mulai belajar.",
            duration: 5000
          });
          fetchData();
        }
        return;
      }

      // Paket berbayar
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email
      }, { onConflict: 'id' });

      // Cek transaksi sukses sebelumnya (edge case)
      const { data: successTx } = await supabase
        .from('transactions').select('id')
        .eq('user_id', user.id).eq('package_id', pkg.id).eq('status', 'success')
        .maybeSingle();
      if (successTx) {
        toast.error('Anda sudah memiliki paket ini. Silakan cek menu Paket Saya.');
        return;
      }

      // Cek transaksi pending yang sudah ada
      const { data: existingTxs } = await supabase
        .from('transactions').select('id, status')
        .eq('user_id', user.id).eq('package_id', pkg.id).eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (existingTxs && existingTxs.length > 0) {
        onPurchaseSuccess?.(existingTxs[0].id);
        return;
      }

      // Buat transaksi baru
      const invoice_id = `INV-SKD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const expiry_date = new Date();
      expiry_date.setHours(expiry_date.getHours() + 48);

      const { data: newTx, error: txError } = await supabase
        .from('transactions')
        .insert([{ id: crypto.randomUUID(), user_id: user.id, package_id: pkg.id, amount: pkg.price, invoice_id, status: 'pending', expiry_date: expiry_date.toISOString() }])
        .select().single();
      if (txError) throw txError;

      toast.success("Invoice Berhasil Dibuat!", {
        description: "Selesaikan pembayaran sesuai petunjuk pada invoice.",
        duration: 5000
      });
      if (newTx) onPurchaseSuccess?.(newTx.id);

    } catch (err: any) {
      toast.error(`Gagal memproses: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  }, [isAuthenticated, onLoginClick, onPurchaseSuccess, fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
        <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-wide">Memuat katalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em] mb-2">Katalog</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Katalog Paket</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1 font-medium">Pilih paket bimbingan dan uji kemampuan SKD kamu.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{packages.length} Paket Tersedia</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/5 rounded-2xl text-center px-6">
            <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Paket Tersedia</h3>
            <p className="text-slate-500 dark:text-slate-600 mt-1 text-sm max-w-sm">Maaf, saat ini belum ada paket aktif. Silakan hubungi admin.</p>
          </div>
        ) : (
          packages.map((pkg) => {
            const isProcessing = processingId === pkg.id;
            return (
              <div key={pkg.id} className="bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-blue-200 dark:hover:border-blue-500/20 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none">
                {pkg.cover_image_url ? (
                  <div className="relative h-36 overflow-hidden shrink-0">
                    <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                ) : null}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {pkg.title}
                  </h3>
                  <ExpandableDesc text={pkg.description || "Dapatkan akses penuh ke materi dan tryout kualitas terbaik."} />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                      <FileEdit className="w-3 h-3" /> {pkg.contents?.length || 0} Konten
                    </div>
                    {pkg.product_type === 'SATUAN' && (
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                        <Clock className="w-3 h-3" /> 100 Menit
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide mb-0.5">Harga</p>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-lg font-bold tracking-tighter", pkg.price === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
                        {pkg.price === 0 ? "GRATIS" : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                      </p>
                      {pkg.original_price && pkg.original_price > pkg.price && pkg.original_price > 0 && (
                        <p className="text-xs font-bold text-slate-300 dark:text-slate-600 line-through">Rp {pkg.original_price.toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isProcessing
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Zap className="w-3.5 h-3.5" />
                    }
                    {pkg.price === 0 ? 'Ambil Gratis' : 'Beli'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
