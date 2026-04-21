import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ArrowLeft,
  Loader2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PaymentHistoryProps {
  onBack: () => void;
  onViewInvoice: (txId: string) => void;
}

export function PaymentHistory({ onBack, onViewInvoice }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          packages (title)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'verifying':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'failed':
      case 'expired':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'verifying':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'Berhasil';
      case 'verifying': return 'Menunggu Verifikasi';
      case 'pending': return 'Menunggu Pembayaran';
      case 'expired': return 'Kadaluwarsa';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 tracking-widest uppercase text-[10px]">Memuat Riwayat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Kembali</span>
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Riwayat Transaksi</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Pantau semua status pemesanan paket belajar Anda.</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Belum Ada Transaksi</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs mx-auto font-medium">
            Anda belum pernah melakukan pemesanan paket. Silakan pilih paket di menu Katalog.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {transactions.map((tx) => (
            <div 
              key={tx.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col sm:flex-row items-center gap-6"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
                <CreditCard className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-black text-slate-900 dark:text-white">{tx.packages?.title}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(tx.status)}`}>
                    {getStatusIcon(tx.status)}
                    {getStatusLabel(tx.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500 font-bold">
                  <span>{tx.invoice_id}</span>
                  <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full hidden sm:block" />
                  <span>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-3">
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  Rp {tx.amount.toLocaleString('id-ID')}
                </div>
                
                {tx.status === 'pending' ? (
                  <button 
                    onClick={() => onViewInvoice(tx.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Bayar Sekarang <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button 
                    onClick={() => onViewInvoice(tx.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Detail Invoice <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
