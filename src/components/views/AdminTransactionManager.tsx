import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  Eye, 
  FilterX,
  Loader2,
  TrendingUp,
  Users,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export function AdminTransactionManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'success' | 'verifying'>('all');

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalSalesCount: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7days' | '30days' | '1year'>('7days');
  const [rawSalesData, setRawSalesData] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filter, startDate, endDate, transactions]);

  useEffect(() => {
    if (rawSalesData.length >= 0) {
      processChartData(rawSalesData);
    }
  }, [timeRange, rawSalesData]);

  const fetchStats = async () => {
    if (!supabase) return;
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: salesData } = await supabase.from('transactions').select('amount, created_at').eq('status', 'success');
      
      setRawSalesData(salesData || []);
      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0
      }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const processChartData = (salesData: any[]) => {
    let daysToFetch = 7;
    let groupBy: 'hour' | 'day' | 'month' = 'day';

    if (timeRange === '24h') {
      daysToFetch = 1;
      groupBy = 'hour';
    } else if (timeRange === '30days') {
      daysToFetch = 30;
    } else if (timeRange === '1year') {
      daysToFetch = 365;
      groupBy = 'month';
    }

    const rangeStartDate = new Date();
    rangeStartDate.setDate(rangeStartDate.getDate() - daysToFetch);
    const filteredSales = salesData.filter(t => new Date(t.created_at) >= rangeStartDate);
    const rangeTotal = filteredSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    setStats(prev => ({
      ...prev,
      totalRevenue: rangeTotal,
      totalSalesCount: filteredSales.length
    }));

    if (groupBy === 'hour') {
      const hoursArr = Array.from({ length: 24 }).map((_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (23 - i), 0, 0, 0);
        const hourLabel = d.getHours() + ":00";
        const hourTotal = salesData?.filter(t => {
          const td = new Date(t.created_at);
          return td.getHours() === d.getHours() && td.toDateString() === d.toDateString();
        }).reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        return { name: hourLabel, omzet: hourTotal };
      });
      setRevenueData(hoursArr);
    } else if (groupBy === 'day') {
      const chartArr = Array.from({ length: daysToFetch }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (daysToFetch - 1 - i));
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const dayTotal = salesData?.filter(t => {
          const td = new Date(t.created_at);
          return td.toDateString() === d.toDateString();
        }).reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        return { name: dateStr, omzet: dayTotal };
      });
      setRevenueData(chartArr);
    } else {
      const monthsArr = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const monthName = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const monthTotal = salesData?.filter(t => {
          const td = new Date(t.created_at);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        }).reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        return { name: monthName, omzet: monthTotal };
      });
      setRevenueData(monthsArr);
    }
  };

  const fetchTransactions = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (full_name, email),
          packages:package_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error('Gagal mengambil data transaksi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...transactions];

    // Filter by Status
    if (filter !== 'all') {
      result = result.filter(t => t.status === (filter === 'verifying' ? 'verifying' : filter));
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.invoice_id?.toLowerCase().includes(q)) || 
        (t.profiles?.full_name?.toLowerCase().includes(q)) ||
        (t.profiles?.email?.toLowerCase().includes(q))
      );
    }

    // Filter by Date
    if (startDate) {
      result = result.filter(t => new Date(t.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.created_at) <= end);
    }

    setFilteredTransactions(result);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // If success, automatically add to user_packages
      if (newStatus === 'success') {
        const trans = transactions.find(t => t.id === id);
        if (trans) {
          await supabase.from('user_packages').upsert({
            user_id: trans.user_id,
            package_id: trans.package_id,
            transaction_id: trans.id
          });
        }
        // Refresh stats after success
        fetchStats();
      }

      toast.success(`Transaksi berhasil diupdate ke ${newStatus}`);
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status');
      console.error(error);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = ["Invoice ID", "Nama Siswa", "Email", "Paket", "Nominal", "Status", "Tanggal"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        t.invoice_id,
        t.profiles?.full_name,
        t.profiles?.email,
        t.packages?.title,
        t.amount,
        t.status,
        new Date(t.created_at).toLocaleDateString('id-ID')
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* REVENUE OVERVIEW WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Omzet</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Rp {stats.totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Periode Terpilih</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl shadow-blue-900/30 text-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/10 text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                 <ShoppingCart className="w-6 h-6" />
               </div>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Produk Terjual</p>
               <h3 className="text-3xl font-black text-white tracking-tight">{stats.totalSalesCount}</h3>
               <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Penjualan Berhasil</p>
              </div>
             </div>
          </div>

          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                 <Users className="w-6 h-6" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Siswa</p>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalUsers}</h3>
               <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Global Aktif</p>
              </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Tren Penjualan 
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {timeRange === '24h' ? '24 Jam' : timeRange === '7days' ? '7 Hari' : timeRange === '30days' ? '30 Hari' : '1 Tahun'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold mt-1">Visualisasi omzet harian berdasarkan transaksi lunas.</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {(['24h', '7days', '30days', '1year'] as const).map((range) => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${timeRange === range ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {range === '24h' ? '24J' : range === '7days' ? '7H' : range === '30days' ? '30H' : '1T'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  itemStyle={{ fontWeight: 900, color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="omzet" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorOmzet)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4 border-t border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verifikasi Transaksi</h2>
            <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black shadow-lg shadow-blue-500/20">
              {filteredTransactions.length} DATA
            </div>
            <button onClick={fetchTransactions} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola aliran dana masuk dan aktivasi paket siswa secara real-time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-2xl w-full font-bold text-xs shadow-sm text-slate-900" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-2xl w-full font-bold text-xs shadow-sm text-slate-900" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Pencarian</label>
              <input type="text" placeholder="Invoice / Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-2xl w-full font-bold text-xs shadow-sm text-slate-900" />
           </div>
           <Button variant="outline" onClick={resetFilters} className="h-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 font-black text-[10px] tracking-widest gap-2"><FilterX className="w-4 h-4" /> RESET</Button>
           <Button onClick={exportToCSV} disabled={filteredTransactions.length === 0} className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-500/20"><Download className="w-4 h-4" /> EXPORT CSV</Button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
        {(['all', 'verifying', 'pending', 'success'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
            {f === 'all' ? 'Semua' : f === 'verifying' ? 'Perlu Verifikasi' : f === 'pending' ? 'Pending' : 'Lunas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-32 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm"><Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" /><p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Memuat Data...</p></div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-24 text-center shadow-sm"><Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" /><h3 className="text-xl font-black text-slate-800">Tidak Ada Data</h3></div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Invoice & Paket</th>
                  <th className="px-6 py-4 text-left">Siswa</th>
                  <th className="px-6 py-4 text-left">Nominal</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 text-sm">{t.invoice_id}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.packages?.title || 'Unknown Package'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 text-sm">{t.profiles?.full_name}</div>
                      <div className="text-[10px] text-slate-400">{t.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">Rp {t.amount?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        t.status === 'verifying' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {t.status === 'success' ? 'Lunas' : t.status === 'verifying' ? 'Verifikasi' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {t.payment_proof_url && (
                          <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {t.status !== 'success' && (
                          <>
                            <button onClick={() => handleUpdateStatus(t.id, 'success')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleUpdateStatus(t.id, 'failed')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
