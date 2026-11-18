import { useState, useEffect } from "react";
import { StatCards } from "@/components/StatCards";
import { PerformanceChart } from "@/components/PerformanceChart";
import { HistoryTable } from "@/components/HistoryTable";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord, ActivePackageData } from "@/types";
import { Clock, BookMarked, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

interface DashboardViewProps {
  data: TryoutRecord[];
  userName?: string;
  onNavigate?: (page: string) => void;
  onReview?: (record: TryoutRecord) => void;
}

export function DashboardView({ data, userName = "Siswa FBK", onNavigate, onReview }: DashboardViewProps) {
  const isEmpty = data.length === 0;
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [now, setNow] = useState(() => Date.now());
  const [activePackageData, setActivePackageData] = useState<ActivePackageData | null>(null);

  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  // Status "menunggu konfirmasi" hanya berlaku 24 jam; hitung ulang berkala.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);

  // Channel setup terpisah — hanya re-subscribe saat pendingTxId berubah, bukan tiap data re-fetch
  useEffect(() => {
    if (!supabase || !pendingTxId) return;
    const channel = supabase
      .channel(`dashboard-tx-${pendingTxId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `id=eq.${pendingTxId}` }, (payload: any) => {
        if (payload.new?.status === 'success') setPendingTx(null);
      })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [pendingTxId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId || !isMounted) return;

      const [txResult, pkgResult] = await Promise.all([
        supabase.from('transactions').select('*, packages(title)').eq('user_id', userId).in('status', ['pending', 'verifying']).gt('expiry_date', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_packages').select('*, packages(*)').eq('user_id', userId)
      ]);

      if (!isMounted) return;

      if (txResult.data) {
        setPendingTx(txResult.data);
        setPendingTxId(txResult.data.id);
      }

      const userPkgs = pkgResult.data;
      if (pkgResult.error) console.error("Dashboard fetch error:", pkgResult.error);

      let foundPackage: any = null;
      if (userPkgs && userPkgs.length > 0) {
        foundPackage = userPkgs.find((up: any) => {
          const p = Array.isArray(up.packages) ? up.packages[0] : up.packages;
          return p?.product_type?.toUpperCase() === 'INTENSIF' || p?.title?.toUpperCase().includes('INTENSIF');
        });
        if (!foundPackage) foundPackage = userPkgs[0];
      }

      if (!foundPackage && data.length > 0) {
        const lastResult = data[0];
        if (lastResult.packageId) {
          const { data: pkg } = await supabase.from('packages').select('*').eq('id', lastResult.packageId).single();
          if (pkg) foundPackage = { packages: pkg, created_at: lastResult.date };
        }
      }

      if (foundPackage) {
        const pkg = Array.isArray(foundPackage.packages) ? foundPackage.packages[0] : foundPackage.packages;
        if (pkg) {
          const expiryDate = new Date(foundPackage.activated_at || foundPackage.created_at || new Date());
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          setActivePackageData({ id: pkg.id, name: pkg.title, description: pkg.description || "Program bimbingan intensif persiapan sekolah kedinasan.", totalSoal: 0, duration: 100, expiresAt: expiryDate.toISOString(), category: "Paket SKD" });
          const { data: contents } = await supabase.from('package_contents').select('id').eq('package_id', pkg.id);
          if (contents) setActivePackageData(prev => prev ? ({ ...prev, totalSoal: contents.length }) : null);
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [data]);

  const isSiswaAktif = data.length > 0 || activePackageData !== null;
  const firstName = userName.split(' ')[0];

  // Sisa waktu konfirmasi; null berarti sudah lewat 24 jam / tidak ada.
  const pendingRemaining = (() => {
    if (!pendingTx?.expiry_date) return null;
    const diff = new Date(pendingTx.expiry_date).getTime() - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return hours > 0 ? `${hours} jam ${minutes} mnt` : `${minutes} mnt`;
  })();

  return (
      <div className="space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SEO
        title={`Dashboard ${userName} | Future Bimbel Kedinasan`}
        description="Pantau statistik belajar, hasil tryout SKD, dan peringkat nasional Anda di Future Bimbel Kedinasan."
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.16em] mb-2">Dashboard</p>
          <h1 className="text-slate-900 dark:text-white font-bold text-[28px] tracking-[-0.03em]">
            Selamat datang, <span className="text-blue-600 dark:text-blue-400">{firstName}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 font-normal">
            Ringkasan progres latihan dan hasil tryout kamu.
          </p>
        </div>

        <div className={cn(
          "inline-flex items-center gap-2.5 px-3 py-2 border text-[12px] self-start sm:self-auto shrink-0",
          isSiswaAktif
            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
            : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-slate-500"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isSiswaAktif ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
          )} />
          {isSiswaAktif ? "Siswa Aktif" : "Siswa Gratis"}
        </div>
      </div>

      {/* Menunggu konfirmasi admin */}
      {pendingTx && pendingRemaining && (
        <div className="border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-500/[0.05] border-amber-100 dark:border-amber-500/20">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-[13px] font-medium text-amber-700 dark:text-amber-300">
                Menunggu konfirmasi admin
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingTx.packages?.title}
                <span className="text-slate-400 dark:text-slate-600 ml-2 text-[11px]">
                  sisa {pendingRemaining}
                </span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Kirim bukti transfer ke WhatsApp admin
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <StatCards data={data} />

      {/* Chart / Empty State */}
      <div className="w-full">
        {isEmpty ? (
          <div className="bg-white dark:bg-[#181818] border-y border-slate-200 dark:border-white/[0.07] p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[280px]">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-4">
              <BookMarked className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-[15px] mb-1">Belum ada paket aktif</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[13px] mb-6 max-w-sm leading-relaxed">
              Kamu belum memiliki hasil tryout. Pilih paket untuk melihat latihan yang tersedia.
            </p>
            <button
              onClick={() => onNavigate?.("Paket dan Tryout SKD")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-medium text-[13px] transition-colors"
            >
              Lihat Katalog Paket
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <PerformanceChart data={data} />
        )}
      </div>

      <HistoryTable data={data} onReview={onReview} />
    </div>
  );
}
