import { useState, useEffect } from "react";
import { StatCards } from "@/components/StatCards";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ActivePackage } from "@/components/ActivePackage";
import { HistoryTable } from "@/components/HistoryTable";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord } from "@/types";
import { ChartLine as LineChart, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    async function checkPending() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('transactions')
        .select('*, packages(title)')
        .eq('user_id', user.id)
        .in('status', ['pending', 'verifying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setPendingTx(data);
    }
    checkPending();
  }, []);

  const isSiswaAktif = data.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
            Selamat Datang, {userName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau perkembangan belajarmu dan raih hasil terbaik di ujian kedinasan.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className={cn(
             "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
             isSiswaAktif ? "bg-blue-50 text-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "bg-emerald-50 text-emerald-600"
           )}>
             <Award className="w-5 h-5" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Belajar</p>
             <p className={cn(
               "text-xs font-bold",
               isSiswaAktif ? "text-blue-600" : "text-emerald-600"
             )}>
               {isSiswaAktif ? "Siswa Aktif FBK" : "Siswa Gratis"}
             </p>
           </div>
        </div>
      </div>

      {pendingTx && (
        <div className={`${pendingTx.status === 'verifying' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'} border rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500`}>
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 ${pendingTx.status === 'verifying' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'} rounded-2xl flex items-center justify-center shrink-0`}>
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`${pendingTx.status === 'verifying' ? 'text-blue-900' : 'text-amber-900'} font-black`}>
                {pendingTx.status === 'verifying' ? 'Pembayaran Sedang Diverifikasi' : 'Tagihan Belum Dibayar'}
              </h3>
              <p className={`${pendingTx.status === 'verifying' ? 'text-blue-700/70' : 'text-amber-700/70'} text-sm font-medium`}>
                {pendingTx.status === 'verifying' 
                  ? `Bukti pembayaran paket "${pendingTx.packages?.title}" sedang dicek oleh tim kami.` 
                  : `Kamu punya pesanan "${pendingTx.packages?.title}" yang menunggu pembayaran.`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onViewInvoice?.(pendingTx.id)}
            className={`w-full md:w-auto px-8 py-3 ${pendingTx.status === 'verifying' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'} text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95`}
          >
            {pendingTx.status === 'verifying' ? 'Lihat Detail Invoice' : 'Selesaikan Pembayaran'}
          </button>
        </div>
      )}

      <div className="mb-6">
        <StatCards data={data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {isEmpty ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex flex-col items-center justify-center h-[400px]">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <LineChart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-center font-bold text-sm">
                Belum ada data grafik.<br/>
                <span className="text-slate-400 font-medium">Ayo kerjakan tryout pertamamu!</span>
              </p>
            </div>
          ) : (
            <PerformanceChart data={data} />
          )}
        </div>
        <div className="space-y-6">
          <ActivePackage packageData={null} onNavigate={onNavigate} />
        </div>
      </div>

      <HistoryTable data={data} onReview={onReview} />
    </div>
  );
}
