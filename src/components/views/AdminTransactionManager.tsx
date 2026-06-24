import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Download, 
  Clock, 
  RotateCw, 
  FilterX,
  Loader2,
  TrendingUp,
  Users,
  ShoppingCart
} from 'lucide-react';
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
          packages:package_id (title)
        `)
        .order('created_at', { ascending: false });

      // Fetch profiles secara terpisah karena FK user_id ke auth.users, bukan profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((t: any) => t.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap: Record<string, any> = {};
        if (profilesData) profilesData.forEach((p: any) => { profileMap[p.id] = p; });

        // Gabungkan profiles ke transaksi
        data.forEach((t: any) => { t.profiles = profileMap[t.user_id] || null; });
      }

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/20 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Omzet</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">Rp {stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-2">Periode Terpilih</p>
          </div>
          <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6 group hover:border-blue-500/20 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Produk Terjual</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{stats.totalSalesCount}</h3>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-2">Penjualan Berhasil</p>
          </div>
          <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-6 group hover:border-blue-500/20 transition-all">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Siswa</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{stats.totalUsers}</h3>
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-2">Terdaftar</p>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#0d0d14] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Tren Penjualan</h3>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Omzet berdasarkan transaksi lunas.</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {(['24h', '7days', '30days', '1year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {range === '24h' ? '24J' : range === '7days' ? '7H' : range === '30days' ? '30H' : '1T'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#4b5563', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#4b5563', fontWeight: 700}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d14', padding: '0.75rem' }} itemStyle={{ fontWeight: 900, color: '#a5b4fc' }} labelStyle={{ color: '#6b7280', fontSize: 10 }} />
                <Area type="monotone" dataKey="omzet" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmzet)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 border-t border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">Verifikasi Transaksi</h2>
            <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold">
              {filteredTransactions.length} DATA
            </div>
            <button onClick={fetchTransactions} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">Kelola aliran dana masuk dan aktivasi paket siswa.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl w-full font-bold text-xs text-white outline-none focus:border-blue-500/40" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl w-full font-bold text-xs text-white outline-none focus:border-blue-500/40" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Cari</label>
            <input type="text" placeholder="Invoice / Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl w-full font-bold text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40" />
          </div>
          <button onClick={resetFilters} className="h-10 px-4 rounded-xl border border-white/8 text-slate-500 hover:text-white hover:bg-white/5 font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
            <FilterX className="w-3.5 h-3.5" /> RESET
          </button>
          <button onClick={exportToCSV} disabled={filteredTransactions.length === 0} className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> EXPORT
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl w-fit">
        {(['all', 'verifying', 'pending', 'success'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            {f === 'all' ? 'Semua' : f === 'verifying' ? 'Verifikasi' : f === 'pending' ? 'Pending' : 'Lunas'}
          </button>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="py-20 text-center bg-[#0d0d14] border border-white/5 rounded-2xl">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl p-20 text-center">
          <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-500">Tidak Ada Data</h3>
        </div>
      ) : (
        <div className="bg-[#0d0d14] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Invoice & Paket</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Siswa</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nominal</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Metode</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{t.invoice_id}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">{t.packages?.title || 'Unknown Package'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-300 text-sm">{t.profiles?.full_name}</div>
                      <div className="text-[10px] text-slate-600">{t.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">Rp {t.amount?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        t.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        t.status === 'verifying' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                        'bg-white/5 text-slate-500 border-white/8'
                      }`}>
                        {t.status === 'success' ? 'Lunas' : t.status === 'verifying' ? 'Verifikasi' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                         {t.status === 'success' ? (
                           <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Otomatis</span>
                         ) : (
                           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Menunggu</span>
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
