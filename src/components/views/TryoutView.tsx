import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingBag, ChevronRight, Loader2, FileEdit, Clock, Zap, MessageCircle, Hourglass, Users, Lock } from "lucide-react";
import { ExpandableDesc } from "@/components/ExpandableDesc";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { packageSeatLabel, packageIsFull } from "@/lib/packages";
import {
  buildOrderMessage,
  buildWaHref,
  getPaymentSettings,
} from "@/lib/payment";
import { track, trackOnce } from "@/lib/analytics";

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
  product_type: 'SATUAN' | 'BUNDLE' | 'INTENSIF' | 'KELAS' | 'PRIVAT_SATUAN' | 'PRIVAT_PAKET';
  is_active: boolean;
  sales_status?: 'OPEN' | 'CLOSED' | 'HIDDEN' | null;
  cover_image_url?: string | null;
  quota?: number | null;
  seats_taken?: number | null;
  content_count?: number;
  contents: PackageContent[];
}

interface TryoutViewProps {
  isAuthenticated: boolean;
  onLoginClick?: () => void;
}

export function TryoutView({ isAuthenticated, onLoginClick }: TryoutViewProps) {
  const [searchParams] = useSearchParams();
  const selectedPackageId = searchParams.get("selected");
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Paket yang sedang menunggu konfirmasi admin: packageId -> batas waktu
  const [pendingUntil, setPendingUntil] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const lastPurchaseTime = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!selectedPackageId || loading) return;
    document.getElementById(`package-${selectedPackageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedPackageId, loading]);

  // Hitung ulang sisa waktu tiap 30 detik supaya status hilang sendiri di 24 jam.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);

  /**
   * `silent` dipakai saat menyegarkan data setelah aksi (mis. setelah memesan):
   * katalog tidak boleh berubah menjadi layar loading penuh, karena siswa akan
   * melihat halaman kosong selama beberapa detik.
   */
  const fetchData = useCallback(async (silent = false) => {
    if (!supabase) return;
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Ambil data yang tidak saling bergantung secara paralel agar tidak
      // menunggu berurutan (sebelumnya 5 request berantai).
      const pendingQuery = user
        ? supabase
            .from('transactions')
            .select('package_id, expiry_date')
            .eq('user_id', user.id)
            .in('status', ['pending', 'verifying'])
            .gt('expiry_date', new Date().toISOString())
        : Promise.resolve({ data: [] as any[] });

      const ownedQuery = user
        ? supabase.from('user_packages').select('package_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] as any[] });

      const [{ data: pending }, { data: owned }, { data: allPackages, error: pkgError }, { data: counts }] =
        await Promise.all([
          pendingQuery,
          ownedQuery,
          supabase.from('packages').select('*, cover_image_url').eq('is_active', true),
          supabase.from('package_content_counts').select('package_id, content_count'),
        ]);

      const map: Record<string, number> = {};
      (pending || []).forEach((tx: any) => {
        if (!tx.package_id || !tx.expiry_date) return;
        map[tx.package_id] = new Date(tx.expiry_date).getTime();
      });
      setPendingUntil(map);
      setNow(Date.now());

      const ownedPackageIds = (owned || []).map((item: any) => item.package_id);

      if (!pkgError && allPackages) {
        const countMap = new Map((counts || []).map((c: any) => [c.package_id, c.content_count]));
        const filtered = allPackages
          .filter((p: any) => p.id !== '11111111-1111-1111-1111-111111111111' && !ownedPackageIds.includes(p.id))
          .map((p: any) => ({
            ...p,
            content_count: countMap.get(p.id) ?? 0,
            contents: [],
          }));
        setPackages(filtered as Package[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Catat kunjungan katalog sekali per sesi.
  useEffect(() => { trackOnce("view_paket"); }, []);

  // Buka lagi chat admin untuk paket yang masih menunggu konfirmasi,
  // misalnya kalau tab WhatsApp tertutup atau bukti transfer perlu dikirim ulang.
  const reopenWhatsApp = useCallback(async (pkg: Package) => {
    if (!supabase) return;
    setProcessingId(pkg.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sesi berakhir. Silakan login ulang.");
        return;
      }
      const { bank, waNumber } = await getPaymentSettings();
      const message = buildOrderMessage({
        packageTitle: pkg.title,
        amount: pkg.price,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        bank,
      });
      window.open(buildWaHref(waNumber, message), '_blank', 'noopener');
      void track("click_wa", {
        package_id: pkg.id,
        package_title: pkg.title,
        amount: pkg.price,
        source: "reopen",
      });
    } catch (err: any) {
      toast.error("Gagal membuka WhatsApp", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  }, []);

  const handlePurchase = useCallback(async (pkg: Package) => {
    if (!isAuthenticated) { onLoginClick?.(); return; }
    if (!supabase) return;
    if (packageIsFull(pkg)) {
      toast.error("Kelas sudah penuh", {
        description: "Semua kursi untuk kelas ini sudah terisi. Silakan pilih kelas lain.",
      });
      return;
    }
    if (pkg.sales_status === 'CLOSED') {
      toast.error("Pendaftaran ditutup", {
        description: "Paket ini sedang tidak menerima pendaftar baru. Hubungi admin kalau butuh bantuan.",
      });
      return;
    }
    // Rate limit: cegah double-click dalam 3 detik per paket
    const now = Date.now();
    if (lastPurchaseTime.current[pkg.id] && now - lastPurchaseTime.current[pkg.id] < 3000) return;
    lastPurchaseTime.current[pkg.id] = now;

    // Tab WhatsApp harus dibuka langsung dari klik, kalau tidak akan diblokir
    // popup blocker (proses di bawah ini menunggu beberapa request jaringan).
    const waTab = pkg.price > 0 ? window.open('', '_blank') : null;

    setProcessingId(pkg.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login kembali.");

      if (!user.email_confirmed_at && !user.confirmed_at) {
        waTab?.close();
        toast.error("Email Belum Terverifikasi", {
          description: "Silakan verifikasi email Anda sebelum melakukan pembelian.",
          duration: 5000
        });
        return;
      }

      // Paket gratis: langsung aktif, tanpa admin.
      if (pkg.price === 0) {
        const { error } = await supabase.rpc('claim_free_package', { p_package_id: pkg.id });
        if (error) {
          toast.error("Gagal menambahkan paket: " + error.message);
        } else {
          void track("free_claimed", { package_id: pkg.id, package_title: pkg.title });
          toast.success("Paket gratis berhasil ditambahkan!", {
            description: "Cek menu 'Paket Saya' untuk mulai belajar.",
            duration: 5000
          });
          fetchData();
        }
        return;
      }

      // Paket berbayar: catat permintaan (24 jam), lalu langsung ke WhatsApp admin.
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email
      }, { onConflict: 'id' });

      const { data: ownedPkg } = await supabase
        .from('user_packages').select('id')
        .eq('user_id', user.id).eq('package_id', pkg.id)
        .maybeSingle();
      if (ownedPkg) {
        waTab?.close();
        toast.error('Anda sudah memiliki paket ini. Silakan cek menu Paket Saya.');
        return;
      }

      const { error: reqError } = await supabase.rpc('request_package_access', {
        p_package_id: pkg.id,
      });
      if (reqError) throw reqError;

      void track("request_created", {
        package_id: pkg.id,
        package_title: pkg.title,
        amount: pkg.price,
      });

      const { bank, waNumber } = await getPaymentSettings();
      const message = buildOrderMessage({
        packageTitle: pkg.title,
        amount: pkg.price,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        bank,
      });
      const waHref = buildWaHref(waNumber, message);

      void track("click_wa", {
        package_id: pkg.id,
        package_title: pkg.title,
        amount: pkg.price,
        source: "paket",
      });

      // Simpan status "menunggu konfirmasi" dulu, baru pindah ke WhatsApp.
      // silent: jangan tampilkan layar loading penuh — katalog tetap terlihat
      // dan badge status muncul tanpa membuat halaman kosong.
      await fetchData(true);

      if (waTab && !waTab.closed) {
        waTab.location.href = waHref;
      } else {
        // Popup diblokir: buka di tab yang sama supaya siswa tetap sampai ke WhatsApp.
        window.location.href = waHref;
      }

      toast.success("Lanjutkan di WhatsApp", {
        description:
          "Kirim pesan yang sudah terisi, transfer sesuai nominal, lalu kirim bukti transfernya. Admin akan mengaktifkan paket kamu.",
        duration: 8000,
      });
    } catch (err: any) {
      waTab?.close();
      toast.error(`Gagal memproses: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  }, [isAuthenticated, onLoginClick, fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
        <p className="text-slate-400 dark:text-slate-600 font-bold uppercase text-[10px] tracking-wide">Memuat katalog...</p>
      </div>
    );
  }

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.16em] mb-2">Katalog</p>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-[-0.03em]">Paket persiapan SKD</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 font-normal">Bandingkan isi paket, harga, dan ketersediaan sebelum memilih.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
          <span className="text-[11px] font-semibold">{packages.length} paket tersedia</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-y border-slate-200 dark:border-white/10">
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
            const until = pendingUntil[pkg.id];
            const diff = until ? until - now : 0;
            const pendingWait = diff > 0
              ? (() => {
                  const hours = Math.floor(diff / 3_600_000);
                  const minutes = Math.floor((diff % 3_600_000) / 60_000);
                  return hours > 0 ? `${hours} jam ${minutes} mnt` : `${minutes} mnt`;
                })()
              : null;
            const seats = packageSeatLabel(pkg);
            const full = packageIsFull(pkg);
            // Paket yang pendaftarannya ditutup tetap tampil, tapi tidak bisa dibeli.
            const closed = pkg.sales_status === 'CLOSED';
            return (
              <div key={pkg.id} id={`package-${pkg.id}`} className={`scroll-mt-24 bg-white dark:bg-[#0d1929] border-b sm:border-r sm:last:border-r-0 border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transition-colors ${selectedPackageId === pkg.id ? "ring-2 ring-inset ring-blue-600 bg-blue-50/40 dark:bg-blue-500/5" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}>
                {pkg.cover_image_url ? (
                  <div className="relative h-40 overflow-hidden shrink-0 bg-slate-100 dark:bg-white/5">
                    <img src={pkg.cover_image_url} alt={`Sampul ${pkg.title}`} className="w-full h-full object-cover transition-transform duration-500" onError={(e) => { const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                ) : null}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {closed && (
                    <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1">
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Pendaftaran Ditutup
                      </span>
                    </div>
                  )}
                  <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white leading-snug mb-2">
                    {pkg.title}
                  </h3>
                  <ExpandableDesc text={pkg.description || "Dapatkan akses penuh ke materi dan tryout kualitas terbaik."} />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                      <FileEdit className="w-3 h-3" /> {pkg.content_count ?? pkg.contents?.length ?? 0} Konten
                    </div>
                    {pkg.product_type === 'SATUAN' && (
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                        <Clock className="w-3 h-3" /> 100 Menit
                      </div>
                    )}
                    {seats && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold",
                        full ? "text-red-500 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        <Users className="w-3 h-3" />
                        {full ? `Kuota penuh (${pkg.seats_taken ?? 0}/${pkg.quota})` : seats}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
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
                  {pendingWait ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                        <Hourglass className="w-3.5 h-3.5" /> Menunggu Konfirmasi
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        sisa {pendingWait}
                      </span>
                      <button
                        type="button"
                        onClick={() => reopenWhatsApp(pkg)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                      >
                        <MessageCircle className="w-3 h-3" /> Buka WhatsApp lagi
                      </button>
                    </div>
                  ) : full ? (
                    <button
                      type="button"
                      disabled
                      title="Kuota kelas sudah penuh"
                      className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold text-xs cursor-not-allowed"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Kuota Penuh ({pkg.seats_taken ?? 0}/{pkg.quota})
                    </button>
                  ) : closed ? (
                    <button
                      type="button"
                      disabled
                      title="Pendaftaran paket ini sudah ditutup"
                      className="flex items-center gap-2 px-3 py-2.5 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Pendaftaran Ditutup
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={isProcessing}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-white font-semibold text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60 disabled:pointer-events-none",
                        pkg.price === 0
                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                          : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20"
                      )}
                    >
                      {isProcessing
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : pkg.price === 0
                          ? <Zap className="w-3.5 h-3.5" />
                          : <MessageCircle className="w-3.5 h-3.5" />
                      }
                      {pkg.price === 0 ? 'Ambil Gratis' : 'Pesan via WA'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
