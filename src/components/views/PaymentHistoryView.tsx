import { useState, useEffect } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/payment";

interface PaymentHistoryProps {
  onBack: () => void;
}

/**
 * Riwayat permintaan paket. Tidak ada invoice dan tidak ada tombol bayar:
 * semua transaksi terjadi lewat WhatsApp admin, jadi halaman ini hanya
 * menampilkan status permintaan.
 */
export function PaymentHistory({ onBack }: PaymentHistoryProps) {
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
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'failed':
      case 'expired':
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-white/5 dark:text-slate-400 dark:border-white/10';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'verifying':
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return 'Akses Aktif';
      case 'verifying': return 'Menunggu Konfirmasi Admin';
      case 'pending': return 'Menunggu Konfirmasi Admin';
      case 'expired': return 'Kedaluwarsa';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 tracking-wide uppercase text-[10px]">Memuat Riwayat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Riwayat Permintaan Paket</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Semua pemesanan diproses lewat WhatsApp admin.
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/5 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Belum Ada Permintaan</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pilih paket di katalog untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white dark:bg-[#0d1929] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{tx.packages?.title}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(tx.status)}`}>
                    {getStatusIcon(tx.status)}
                    {getStatusLabel(tx.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500 font-bold">
                  <span>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="text-lg font-bold text-slate-900 dark:text-white text-center sm:text-right">
                {formatRupiah(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
