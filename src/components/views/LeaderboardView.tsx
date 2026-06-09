import { useState, useEffect } from "react";
import { Trophy, Medal, Filter, Loader2, User, TrendingUp, Award, ChevronRight, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function LeaderboardView({ onLoginClick }: { onLoginClick?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [userRank, setUserRank] = useState<{ position: number; total: number; score: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchPackages(); fetchLeaderboard(); fetchUserRank();
    if (!supabase) return;
    const channel = supabase.channel('leaderboard_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tryout_results' }, () => { fetchLeaderboard(); fetchUserRank(); })
      .subscribe();
    return () => { if (supabase) supabase.removeChannel(channel); };
  }, [selectedPackage]);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('packages').select('id, title').eq('is_active', true);
    if (data && data.length > 0) { setPackages(data); if (!selectedPackage) setSelectedPackage("all"); }
    else setSelectedPackage("all");
  };

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (selectedPackage === "all") {
        const { data, error } = await supabase.from('leaderboard_averages').select('*').order('avg_total', { ascending: false }).limit(50);
        if (error) throw error;
        setLeaderboard((data || []).map((item: any) => ({ ...item, twk: item.avg_twk, tiu: item.avg_tiu, tkp: item.avg_tkp, total: item.avg_total, profiles: { full_name: item.full_name } })));
      } else {
        const { data, error } = await supabase.from('fair_package_leaderboard').select('*').eq('package_id', selectedPackage).order('total', { ascending: false }).limit(50);
        if (error) throw error;
        setLeaderboard((data || []).map((item: any) => ({ ...item, profiles: { full_name: item.full_name } })));
      }
    } catch (error) { console.error("Error:", error); setLeaderboard([]); }
    finally { setLoading(false); }
  };

  const fetchUserRank = async () => {
    if (!supabase) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user);
      if (!userData.user) return;
      const table = selectedPackage === "all" ? 'leaderboard_averages' : 'fair_package_leaderboard';
      const scoreCol = selectedPackage === "all" ? 'avg_total' : 'total';
      const query = supabase.from(table).select(`user_id, ${scoreCol}`).order(scoreCol, { ascending: false });
      if (selectedPackage !== "all") query.eq('package_id', selectedPackage);
      const { data: allRanks } = await query;
      if (allRanks) {
        const position = allRanks.findIndex(r => r.user_id === userData.user?.id) + 1;
        const userStats: any = allRanks.find(r => r.user_id === userData.user?.id);
        if (position > 0 && userStats) setUserRank({ position, total: allRanks.length, score: userStats[scoreCol] });
        else setUserRank(null);
      }
    } catch (error) { console.error("Error:", error); }
  };

  const rankStyle = (index: number) => {
    if (index === 0) return "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    if (index === 1) return "bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20 text-slate-500 dark:text-slate-400";
    if (index === 2) return "bg-orange-50 dark:bg-amber-600/10 border-orange-100 dark:border-amber-600/20 text-orange-600 dark:text-amber-600";
    return "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] mb-2">Hall of Fame</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ranking Nasional</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Peringkat siswa FBK dari seluruh Indonesia.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/8 rounded-xl px-4 py-2.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)}
            className="bg-transparent text-sm font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer appearance-none">
            <option value="all" className="bg-white dark:bg-slate-900">Ranking Global</option>
            {packages.map(pkg => <option key={pkg.id} value={pkg.id} className="bg-white dark:bg-slate-900">{pkg.title}</option>)}
          </select>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        </div>
      </div>

      {/* Guest Overlay */}
      {!currentUser && !loading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md z-10 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-5 p-8 max-w-sm">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Ranking Terkunci</h2>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Masuk ke akun Anda untuk melihat Ranking Nasional.</p>
              </div>
              <Button onClick={onLoginClick} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20">
                Login Sekarang
              </Button>
            </div>
          </div>
          <div className="opacity-10 pointer-events-none select-none blur-sm h-64 bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl" />
        </div>
      )}

      {currentUser && (
        <>
          {/* User Rank Card */}
          {userRank && (
            <div className="bg-white dark:bg-[#0d0d14] border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <User className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-white dark:border-[#0d0d14]">
                    <Star className="w-3 h-3 text-yellow-900 fill-current" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Peringkat Kamu</p>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    #{userRank.position} <span className="text-slate-400 dark:text-slate-600 text-xl font-bold">/ {userRank.total}</span>
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-center">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Skor</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{userRank.score}</p>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-center">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Persentil</p>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round((1 - userRank.position / userRank.total) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Podium */}
          {!loading && leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="flex flex-col justify-end">
                <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 p-5 rounded-2xl text-center group hover:border-slate-300 dark:hover:border-slate-500/30 transition-all">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Medal className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm truncate mb-1">{leaderboard[1]?.profiles?.full_name || "Peserta FBK"}</h4>
                  <p className="text-2xl font-black text-slate-400 dark:text-slate-400 tracking-tighter mb-2">{leaderboard[1]?.total}</p>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded">Runner Up</span>
                </div>
              </div>
              <div className="relative -mt-4">
                <div className="bg-indigo-600 border border-indigo-500 p-6 rounded-2xl text-center shadow-2xl shadow-indigo-500/20">
                  <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-3 border-4 border-indigo-500">
                    <Trophy className="w-7 h-7 text-yellow-900" />
                  </div>
                  <h4 className="font-black text-white text-base truncate mb-1">{leaderboard[0]?.profiles?.full_name || "Peserta FBK"}</h4>
                  <p className="text-3xl font-black text-yellow-400 tracking-tighter mb-2">{leaderboard[0]?.total}</p>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-white/80 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-lg">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" /> Champion
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 p-5 rounded-2xl text-center group hover:border-orange-200 dark:hover:border-amber-600/30 transition-all">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-amber-600/10 border border-orange-100 dark:border-amber-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-orange-500 dark:text-amber-600" />
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm truncate mb-1">{leaderboard[2]?.profiles?.full_name || "Peserta FBK"}</h4>
                  <p className="text-2xl font-black text-orange-500 dark:text-amber-600 tracking-tighter mb-2">{leaderboard[2]?.total}</p>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded">Third Place</span>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-[#0d0d14] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Leaderboard Lengkap</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Analisis Performa Siswa FBK</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
                <p className="text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-widest">Menganalisis Skor Nasional...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      {['Rank','Siswa', selectedPackage === 'all' ? 'AVG TWK' : 'TWK', selectedPackage === 'all' ? 'AVG TIU' : 'TIU', selectedPackage === 'all' ? 'AVG TKP' : 'TKP', 'Tryout', selectedPackage === 'all' ? 'AVG SKD' : 'Total'].map(h => (
                        <th key={h} className={cn("px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest", h === 'Rank' || h === 'Siswa' ? 'text-left' : h === 'Total' || h === 'AVG SKD' ? 'text-right' : 'text-center')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                    {leaderboard.map((item, index) => (
                      <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border", rankStyle(index))}>{index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-all">
                              <User className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.profiles?.full_name || "Siswa FBK"}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                                  {item.date && !isNaN(new Date(item.date).getTime()) ? new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase() : (item.last_active && !isNaN(new Date(item.last_active).getTime()) ? new Date(item.last_active).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase() : 'BARU SAJA')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.twk || 0}</span></td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.tiu || 0}</span></td>
                        <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.tkp || 0}</span></td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500 text-[10px] font-black rounded-lg">
                            {selectedPackage === 'all' ? (item.packages_completed || 1) : 1}x
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{item.total}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Belum Ada Peringkat</h3>
                <p className="text-slate-500 dark:text-slate-600 mt-1 text-sm">Jadilah yang pertama mengerjakan tryout!</p>
              </div>
            )}
          </div>

          {/* Banner */}
          <div className="bg-indigo-600 border border-indigo-500 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-yellow-400 fill-current" />
              </div>
              <h3 className="text-xl font-black text-white">Siap Menembus Peringkat Nasional?</h3>
              <p className="text-indigo-200 text-sm max-w-md mx-auto">Konsistensi adalah kunci. Kerjakan tryout setiap hari dan evaluasi kelemahanmu.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
