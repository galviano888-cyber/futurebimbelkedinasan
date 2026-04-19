import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export function AdminTransactionManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'VERIFYING' | 'PENDING' | 'SUCCESS'>('VERIFYING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          packages (title),
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tx: any) => {
    if (!supabase || !confirm(`Approve pembayaran untuk ${tx.profiles?.full_name}?`)) return;

    setProcessingId(tx.id);
    try {
      // 1. Update status transaksi
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'SUCCESS', updated_at: new Date().toISOString() })
        .eq('id', tx.id);

      if (txError) throw txError;

      // 2. Berikan akses paket
      const { error: accessError } = await supabase
        .from('user_packages')
        .insert([{
          user_id: tx.user_id,
          package_id: tx.package_id,
          transaction_id: tx.id
        }]);

      if (accessError && accessError.code !== '23505') throw accessError;

      alert("Pembayaran berhasil disetujui dan akses paket telah dibuka.");
      fetchTransactions();
    } catch (err: any) {
      alert("Gagal memproses: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tx: any) => {
    const reason = prompt("Alasan penolakan (opsional):");
    if (reason === null || !supabase) return;

    setProcessingId(tx.id);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'FAILED', 
          notes: reason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', tx.id);

      if (error) throw error;
      fetchTransactions();
    } catch (err: any) {
      alert("Gagal memproses: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Transaksi</h2>
          <p className="text-sm text-slate-500">Verifikasi bukti transfer dan berikan akses paket ke siswa.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(['VERIFYING', 'PENDING', 'SUCCESS', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f === 'VERIFYING' ? 'Butuh Verifikasi' : f === 'PENDING' ? 'Pending' : f === 'SUCCESS' ? 'Berhasil' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Memuat data transaksi...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
          <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Tidak Ada Transaksi</h3>
          <p className="text-slate-500 text-sm mt-1">Belum ada transaksi dengan status {filter}.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa & Paket</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Invoice</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bukti Transfer</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{tx.profiles?.full_name || 'User Tanpa Nama'}</div>
                    <div className="text-xs text-slate-500">{tx.profiles?.email}</div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase mt-1">
                      {tx.packages?.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono font-bold text-slate-700">{tx.invoice_id}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                      {new Date(tx.created_at).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-blue-600">Rp {tx.amount.toLocaleString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4">
                    {tx.payment_proof_url ? (
                      <a 
                        href={tx.payment_proof_url} 
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic">Belum Upload</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {tx.status === 'VERIFYING' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(tx)}
                          disabled={!!processingId}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApprove(tx)}
                          disabled={!!processingId}
                        >
                          {processingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                          Approve
                        </Button>
                      </>
                    )}
                    {tx.status === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
