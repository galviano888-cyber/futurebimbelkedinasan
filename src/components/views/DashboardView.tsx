import { useState, useEffect } from "react";
import { StatCards } from "@/components/StatCards";
import { PerformanceChart } from "@/components/PerformanceChart";
import { HistoryTable } from "@/components/HistoryTable";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord, ActivePackageData } from "@/types";
import { Clock, Award, BookMarked, ArrowRight, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

interface DashboardViewProps {
  data: TryoutRecord[];
  userName?: string;
  onNavigate?: (page: string) => void;
  onViewInvoice?: (id: string) => void;
  onReview?: (record: TryoutRecord) => void;
}

export function DashboardView({ data, userName = "Siswa FBK", onNavigate, onViewInvoice, onReview }: DashboardViewProps) {
  const isEmpty = data.length === 0;
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [activePackageData, setActivePackageData] = useState<ActivePackageData | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const [txResult, pkgResult] = await Promise.all([
        supabase.from('transactions').select('*, packages(title)').eq('user_id', userId).in('status', ['pending', 'verifying']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_packages').select('*, packages(*)').eq('user_id', userId)
      ]);

      if (txResult.data) setPendingTx(txResult.data);

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
          const expiryDate = new Date(foundPackage.created_at || new Date());
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          setActivePackageData({ id: pkg.id, name: pkg.title, description: pkg.description || "Program bimbingan intensif persiapan sekolah kedinasan.", totalSoal: 0, duration: 100, expiresAt: expiryDate.toISOString(), category: "Paket SKD" });
          const { data: contents } = await supabase.from('package_contents').select('id').eq('package_id', pkg.id);
          if (contents) setActivePackageData(prev => prev ? ({ ...prev, totalSoal: contents.length }) : null);
        }
      }
    }
    fetchData();
  }, [data]);

  const isSiswaAktif = data.length > 0 || activePackageData !== null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SEO
        title={`Dashboard ${userName} | Future Bimbel Kedinasan`}
        description="Pantau statistik belajar, hasil tryout SKD, dan peringkat nasional Anda di Future Bimbel Kedinasan."
        noIndex={true}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2">Overview</p>
          <h1 className="text-slate-900 dark:text-white font-black text-2xl lg:text-3xl tracking-tight leading-none">
            Selamat Datang, <span className="text-indigo-600 dark:text-indigo-400">{userName}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2 font-medium">
            Pantau perkembangan belajarmu dan persiapkan diri menaklukkan ujian kedinasan.
          </p>
        </div>

        <div className={cn(
          "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
          isSiswaAktif
            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
            : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isSiswaAktif ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          )}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Status Belajar</p>
            <p className={cn(
              "text-sm font-black tracking-tight",
              isSiswaAktif ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {isSiswaAktif ? "AKUN SISWA" : "SISWA GRATIS"}
            </p>
          </div>
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse ml-2",
            isSiswaAktif ? "bg-indigo-500" : "bg-emerald-500"
          )} />
        </div>
      </div>

      {/* Pending Transaction Banner */}
      {pendingTx && (
        <div className={cn(
          "border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5",
          pendingTx.status === 'verifying'
            ? 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20'
            : 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              pendingTx.status === 'verifying'
                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
            )}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn(
                "text-sm font-black tracking-tight",
                pendingTx.status === 'verifying' ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'
              )}>
                {pendingTx.status === 'verifying' ? 'Sedang Diverifikasi' : 'Menunggu Pembayaran'}
              </h3>
              <p className="text-slate-500 dark:text-slate-500 text-xs font-medium mt-0.5">
                Paket: <span className="text-slate-700 dark:text-slate-300 font-bold">{pendingTx.packages?.title}</span>
                {' · '}
                <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px]">{pendingTx.invoice_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewInvoice?.(pendingTx.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 border",
              pendingTx.status === 'verifying'
                ? 'bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                : 'bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
            )}
          >
            Lihat Invoice <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <StatCards data={data} />

      {/* Chart / Empty State */}
      <div className="w-full">
        {isEmpty ? (
          <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[360px]">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
              <BookMarked className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-black text-xl mb-2 tracking-tight">Belum Ada Paket Aktif</h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">
              Tingkatkan peluang lulusmu ke sekolah kedinasan impian dengan mengikuti program bimbingan intensif kami.
            </p>
            <button
              onClick={() => onNavigate?.("Paket dan Tryout SKD")}
              className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Zap className="w-4 h-4" />
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
