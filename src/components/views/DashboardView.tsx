import { useState, useEffect } from "react";
import { StatCards } from "@/components/StatCards";
import { PerformanceChart } from "@/components/PerformanceChart";
import { HistoryTable } from "@/components/HistoryTable";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord, ActivePackageData } from "@/types";
import { Clock, Award, BookMarked, ArrowRight } from "lucide-react";
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

      // 1. Check Pending Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*, packages(title)')
        .eq('user_id', userId)
        .in('status', ['pending', 'verifying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (txData) setPendingTx(txData);

      // 2. Fetch User Packages
      const { data: userPkgs, error } = await supabase
        .from('user_packages')
        .select('*, packages(*)')
        .eq('user_id', userId);

      if (error) console.error("Dashboard fetch error:", error);

      let foundPackage: any = null;

      if (userPkgs && userPkgs.length > 0) {
        // Try to find INTENSIF first
        foundPackage = userPkgs.find((up: any) => {
          const p = Array.isArray(up.packages) ? up.packages[0] : up.packages;
          return p?.product_type?.toUpperCase() === 'INTENSIF' || p?.title?.toUpperCase().includes('INTENSIF');
        });

        if (!foundPackage) foundPackage = userPkgs[0];
      }

      // Fallback: Try to find package from tryout results
      if (!foundPackage && data.length > 0) {
        const lastResult = data[0];
        if (lastResult.packageId) {
          const { data: pkg } = await supabase
            .from('packages')
            .select('*')
            .eq('id', lastResult.packageId)
            .single();
          if (pkg) {
            foundPackage = { packages: pkg, created_at: lastResult.date };
          }
        }
      }

      if (foundPackage) {
        const pkg = Array.isArray(foundPackage.packages) ? foundPackage.packages[0] : foundPackage.packages;
        
        if (pkg) {
          const expiryDate = new Date(foundPackage.created_at || new Date());
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          setActivePackageData({
            id: pkg.id,
            name: pkg.title,
            description: pkg.description || "Program bimbingan intensif persiapan sekolah kedinasan.",
            totalSoal: 0,
            duration: 100,
            expiresAt: expiryDate.toISOString(),
            category: "Paket SKD"
          });
          
          const { data: contents } = await supabase
            .from('package_contents')
            .select('id')
            .eq('package_id', pkg.id);
          
          if (contents) {
            setActivePackageData(prev => prev ? ({ ...prev, totalSoal: contents.length }) : null);
          }
        }
      }
    }
    fetchData();
  }, [data]);

  const isSiswaAktif = data.length > 0 || activePackageData !== null;

  return (
    <div className="space-y-10">
      <SEO title={`Dashboard ${userName}`} description="Pantau statistik belajar dan hasil tryout kamu di Future Bimbel Kedinasan." />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-slate-900 dark:text-white font-black text-3xl lg:text-4xl tracking-tight leading-none">
            Selamat Datang, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{userName}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-3 font-medium max-w-xl">
            Pantau perkembangan belajarmu secara real-time dan persiapkan dirimu untuk menaklukkan ujian kedinasan.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/5 px-3 py-1.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Catatan: Progress dihitung dari pengerjaan tryout pertama kali
          </div>
        </div>

        <div className="flex items-center gap-5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-4 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
           <div className={cn(
             "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg",
             isSiswaAktif 
               ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20" 
               : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/20"
           )}>
             <Award className="w-7 h-7" />
           </div>
           <div className="pr-6">
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">Status Belajar</p>
             <p className={cn(
               "text-base font-black tracking-tight",
               isSiswaAktif ? "text-blue-700 dark:text-blue-400" : "text-emerald-700 dark:text-emerald-400"
             )}>
               {isSiswaAktif ? "AKUN SISWA" : "SISWA GRATIS"}
             </p>
           </div>
        </div>
      </div>

      {pendingTx && (
        <div className={cn(
          "border rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-4 duration-700",
          pendingTx.status === 'verifying' 
            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' 
            : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
        )}>
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0",
              pendingTx.status === 'verifying' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            )}>
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className={cn(
                "text-xl font-black tracking-tight",
                pendingTx.status === 'verifying' ? 'text-blue-900 dark:text-blue-200' : 'text-amber-900 dark:text-amber-200'
              )}>
                {pendingTx.status === 'verifying' ? 'Sedang Diverifikasi' : 'Menunggu Pembayaran'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                Paket: <span className="font-bold text-slate-700 dark:text-slate-300">{pendingTx.packages?.title}</span> • 
                ID: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{pendingTx.invoice_id}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => onViewInvoice?.(pendingTx.id)}
            className={cn(
              "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all",
              pendingTx.status === 'verifying' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-amber-600 text-white hover:bg-amber-700'
            )}
          >
            Lihat Detail Invoice
          </button>
        </div>
      )}

      <StatCards data={data} />

      <div className="grid grid-cols-1 gap-10">
        <div className="w-full">
          {isEmpty ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-12 shadow-xl h-[450px] flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-inner">
                <BookMarked className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              </div>
              
              <h3 className="text-slate-900 dark:text-white font-black text-3xl mb-4 tracking-tight">
                Belum Ada Paket Aktif
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-base mb-10 max-w-[320px] mx-auto leading-relaxed font-medium">
                Tingkatkan peluang lulusmu ke sekolah kedinasan impian dengan mengikuti program bimbingan intensif kami.
              </p>
              
              <button 
                onClick={() => onNavigate?.("Paket dan Tryout SKD")}
                className="w-full sm:w-auto px-10 flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-lg"
              >
                Lihat Katalog Paket
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <PerformanceChart data={data} />
          )}
        </div>
      </div>

      <HistoryTable data={data} onReview={onReview} />
    </div>
  );
}
