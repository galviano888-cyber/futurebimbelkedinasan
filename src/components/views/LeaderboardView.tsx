import { useState, useEffect } from "react";
import { Trophy, Filter, Loader2, User, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export function LeaderboardView({ onLoginClick }: { onLoginClick?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [userRank, setUserRank] = useState<{ position: number; total: number; score: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    fetchPackages(); fetchLeaderboard(1, false); fetchUserRank();
    if (!supabase) return;
    // Gunakan channel name unik per selectedPackage agar tidak konflik saat cleanup
    const channelName = `leaderboard_live_${selectedPackage}`;
    const channel = supabase!.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tryout_results' }, () => { fetchLeaderboard(1, false); fetchUserRank(); })
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [selectedPackage]);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('packages').select('id, title').eq('is_active', true);
    if (data && data.length > 0) {
      setPackages(data);
      // Default ke paket pertama, bukan "all"
      if (!selectedPackage) setSelectedPackage(data[0].id);
    }
  };

  const fetchLeaderboard = async (currentPage = 1, append = false) => {
    if (!supabase) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (!selectedPackage) return;
      const { data, error } = await supabase
        .from('fair_package_leaderboard')
        .select('user_id, full_name, package_id, twk, tiu, tkp, total, tryout_count, date')
        .eq('package_id', selectedPackage)
        .order('total', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const mapped = (data || []).map((item: any) => ({ ...item, profiles: { full_name: item.full_name } }));
      setLeaderboard(prev => append ? [...prev, ...mapped] : mapped);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (error) { console.error("Error:", error); setLeaderboard([]); }
    finally { setLoading(false); }
  };

  const fetchUserRank = async () => {
    if (!supabase) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user);
      if (!userData.user) return;

      if (!selectedPackage) { setUserRank(null); return; }

      // Fetch only the current user's row
      const { data: userRows } = await supabase
        .from('fair_package_leaderboard')
        .select('user_id, total')
        .eq('user_id', userData.user.id)
        .eq('package_id', selectedPackage)
        .limit(1);
      const userStats: any = userRows?.[0];
      if (!userStats) { setUserRank(null); return; }

      // Count how many users scored strictly higher to determine rank
      const { count: above } = await supabase
        .from('fair_package_leaderboard')
        .select('user_id', { count: 'exact', head: true })
        .eq('package_id', selectedPackage)
        .gt('total', userStats.total);

      // Total participants
      const { count: total } = await supabase
        .from('fair_package_leaderboard')
        .select('user_id', { count: 'exact', head: true })
        .eq('package_id', selectedPackage);

      setUserRank({ position: (above ?? 0) + 1, total: total ?? 0, score: userStats.total });
    } catch (error) { console.error("Error:", error); }
  };

  // Warna rank nomor
  const rankColor = (index: number) => {
    if (index === 0) return "text-yellow-600 dark:text-yellow-400 font-bold";
    if (index === 1) return "text-slate-500 dark:text-slate-400 font-semibold";
    if (index === 2) return "text-orange-500 dark:text-amber-500 font-semibold";
    return "text-slate-400 dark:text-slate-500";
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ranking Nasional</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Peringkat siswa FBK dari seluruh Indonesia.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-xl px-4 py-2.5 self-start md:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-white focus:outline-none cursor-pointer appearance-none"
          >
            {packages.map(pkg => <option key={pkg.id} value={pkg.id} className="bg-white dark:bg-slate-900">{pkg.title}</option>)}
          </select>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Guest Overlay */}
      {!currentUser && !loading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md z-10 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-4 p-8 max-w-sm">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Masuk untuk melihat ranking</h2>
                <p className="text-slate-500 text-sm mt-1">Login terlebih dahulu untuk mengakses Ranking Nasional.</p>
              </div>
              <Button onClick={onLoginClick} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                Masuk Sekarang
              </Button>
            </div>
          </div>
          <div className="opacity-10 pointer-events-none select-none blur-sm h-56 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl" />
        </div>
      )}

      {currentUser && (
        <>
          {/* Peringkat kamu */}
          {userRank && (
            <div className="bg-white dark:bg-[#181818] border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">Peringkat kamu</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                    #{userRank.position}
                    <span className="text-sm font-normal text-slate-400 ml-1">dari {userRank.total} peserta</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center px-5 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-1">Skor SKD</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{userRank.score}</p>
                </div>
                <div className="text-center px-5 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-400 mb-1">Persentil</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{Math.round((1 - userRank.position / userRank.total) * 100)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabel ranking */}
          <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-[14px] font-semibold text-slate-800 dark:text-white">Leaderboard</h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Top {PAGE_SIZE}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Menampilkan {leaderboard.length} peserta</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                <p className="text-slate-400 text-[12px]">Memuat data ranking...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              <>
                {/* Desktop: tabel */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                        {['#', 'Nama', 'TWK', 'TIU', 'TKP', 'Avg SKD', 'Tryout'].map((h, i) => (
                          <th key={h} className={cn(
                            "px-5 py-3 text-[11px] font-medium text-slate-400 dark:text-slate-500",
                            i === 0 ? 'text-left w-12' : i === 1 ? 'text-left' : i === 6 ? 'text-right' : 'text-center'
                          )}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                      {leaderboard.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={cn("text-[14px]", rankColor(index))}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 dark:bg-white/[0.05] rounded-lg flex items-center justify-center shrink-0 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                {(item.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[13.5px] font-medium text-slate-800 dark:text-white">{item.profiles?.full_name || 'Siswa FBK'}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {item.date && !isNaN(new Date(item.date).getTime())
                                    ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                    : 'Baru saja'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center"><span className="text-[13px] text-slate-600 dark:text-slate-300">{item.twk || 0}</span></td>
                          <td className="px-5 py-3.5 text-center"><span className="text-[13px] text-slate-600 dark:text-slate-300">{item.tiu || 0}</span></td>
                          <td className="px-5 py-3.5 text-center"><span className="text-[13px] text-slate-600 dark:text-slate-300">{item.tkp || 0}</span></td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400">{item.total}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{item.tryout_count ?? 1}x</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-slate-50 dark:divide-white/[0.03]">
                  {leaderboard.map((item, index) => (
                    <div key={index} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Rank */}
                      <div className="w-8 shrink-0 text-center">
                        <span className={cn("text-[14px]", rankColor(index))}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </span>
                      </div>
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-slate-100 dark:bg-white/[0.05] rounded-lg flex items-center justify-center shrink-0 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        {(item.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      {/* Nama + detail */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 dark:text-white truncate">{item.profiles?.full_name || 'Siswa FBK'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">TWK {item.twk || 0}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[10px] text-slate-400">TIU {item.tiu || 0}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[10px] text-slate-400">TKP {item.tkp || 0}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[10px] text-slate-400">{item.tryout_count ?? 1}x tryout</span>
                        </div>
                      </div>
                      {/* Skor */}
                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-bold text-blue-600 dark:text-blue-400">{item.total}</p>
                        <p className="text-[10px] text-slate-400">Avg SKD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Belum ada data ranking</p>
                <p className="text-[12px] text-slate-400 dark:text-slate-600 mt-1">Jadilah yang pertama mengerjakan tryout!</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-white/[0.05] flex justify-center">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchLeaderboard(nextPage, true);
                  }}
                  className="px-6 py-2.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all border border-blue-200 dark:border-blue-500/20"
                >
                  Muat lebih banyak
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
