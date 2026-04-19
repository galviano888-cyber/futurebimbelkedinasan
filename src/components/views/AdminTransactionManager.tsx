import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Loader2,
  RotateCw,
  Search,
  Calendar,
  FilterX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export function AdminTransactionManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verifying' | 'pending' | 'success'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter, startDate, endDate]);

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

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59Z`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tx: any) => {
    if (!supabase || !confirm(`Approve invoice ${tx.invoice_id}?`)) return;
    setProcessingId(tx.id);
    try {
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('id', tx.id);
      if (txError) throw txError;

      const { error: accessError } = await supabase
        .from('user_packages')
        .insert([{
          user_id: tx.user_id,
          package_id: tx.package_id,
          transaction_id: tx.id
        }]);

      if (accessError && accessError.code !== '23505') throw accessError;
      alert("Berhasil disetujui!");
      fetchTransactions();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tx: any) => {
    const reason = prompt("Alasan penolakan:");
    if (reason === null || !supabase) return;
    setProcessingId(tx.id);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'failed', notes: reason, updated_at: new Date().toISOString() })
        .eq('id', tx.id);
      if (error) throw error;
      fetchTransactions();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilter("all");
    setSearchQuery("");
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verifikasi Transaksi</h2>
            <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black shadow-lg shadow-blue-500/20">
              {filteredTransactions.length} SHOWN
            </div>
            <button 
              onClick={fetchTransactions} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola aliran dana masuk dan aktivasi paket siswa secara real-time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
           {/* Date From */}
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Dari Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-xs text-slate-900 shadow-sm"
                />
              </div>
           </div>

           {/* Date To */}
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Sampai Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-xs text-slate-900 shadow-sm"
                />
              </div>
           </div>

           {/* Search Input */}
           <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Invoice / Nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>
           </div>

           {/* Reset */}
           <Button 
            variant="outline" 
            onClick={resetFilters}
            className="h-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 font-black text-[10px] tracking-widest gap-2"
           >
             <FilterX className="w-4 h-4" /> RESET
           </Button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
        {(['all', 'verifying', 'pending', 'success'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {f === 'all' ? 'Semua Status' : f === 'verifying' ? 'Perlu Verifikasi' : f === 'pending' ? 'Pending' : 'Lunas / Berhasil'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-32 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Memfilter Data...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <Clock className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Data Tidak Ditemukan</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">Coba sesuaikan filter tanggal atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siswa & Paket</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Invoice</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nominal</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Berkas Bukti</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                            {tx.profiles?.full_name?.charAt(0) || 'U'}
                         </div>
                         <div>
                            <div className="font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                               {tx.profiles?.full_name || `User: ${tx.user_id?.substring(0, 8)}`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold">
                               {tx.profiles?.email}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider group-hover:border-blue-200 group-hover:bg-blue-50/50">
                               {tx.packages?.title || 'Standalone Product'}
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                         <span className="text-xs font-mono font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg self-start">
                            {tx.invoice_id}
                         </span>
                         <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-lg font-black text-blue-600 tracking-tighter">
                         Rp {tx.amount?.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {tx.payment_proof_url ? (
                        <a 
                          href={tx.payment_proof_url} 
                          target="_blank" rel="noreferrer" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> BUKA BUKTI
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold italic">
                           <Clock className="w-3.5 h-3.5" /> Belum Upload
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {tx.status === 'verifying' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 px-4 text-[10px] font-black border-red-200 text-red-600 hover:bg-red-50 rounded-xl" 
                            onClick={() => handleReject(tx)}
                            disabled={!!processingId}
                          >
                            TOLAK
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-9 px-4 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20" 
                            onClick={() => handleApprove(tx)}
                            disabled={!!processingId}
                          >
                            {processingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'APPROVE'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${
                            tx.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                            tx.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' : 
                            'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {tx.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : tx.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : null}
                            {tx.status === 'success' ? 'LUNAS' : tx.status === 'failed' ? 'GAGAL' : tx.status}
                          </div>
                          {tx.status === 'success' && (
                            <span className="text-[9px] text-emerald-500 font-bold mt-1">Akses Terbuka ✓</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
