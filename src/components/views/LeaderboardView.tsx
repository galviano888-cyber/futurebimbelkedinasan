import { useState, useEffect } from "react";
import { 
  Trophy, 
  Medal, 
  Filter, 
  Loader2, 
  User, 
  Target, 
  TrendingUp,
  Award
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function LeaderboardView() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [userRank, setUserRank] = useState<{ position: number; total: number; score: number } | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchLeaderboard();
    fetchUserRank();
  }, [selectedPackage]);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('packages').select('id, title').eq('is_active', true);
    if (data) setPackages(data);
  };

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tryout_results')
        .select(`
          total_score,
          created_at,
          user_id,
          package_id,
          profiles:user_id (full_name)
        `)
        .order('total_score', { ascending: false })
        .limit(20);

      if (selectedPackage !== "all") {
        query = query.eq('package_id', selectedPackage);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Group by user to get their best score only
      const uniqueLeaders: any[] = [];
      const userSeen = new Set();
      
      (data || []).forEach(item => {
        if (!userSeen.has(item.user_id)) {
          userSeen.add(item.user_id);
          uniqueLeaders.push(item);
        }
      });

      setLeaderboard(uniqueLeaders);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('tryout_results')
        .select('total')
        .eq('user_id', user.id)
        .order('total', { ascending: false })
        .limit(1);

      if (selectedPackage !== "all") {
        query = query.eq('package_id', selectedPackage);
      }

      const { data: userData } = await query;
      if (!userData || userData.length === 0) {
        setUserRank(null);
        return;
      }

      const userScore = userData[0].total;

      let totalQuery = supabase
        .from('tryout_results')
        .select('user_id', { count: 'exact', head: true });

      if (selectedPackage !== "all") {
        totalQuery = totalQuery.eq('package_id', selectedPackage);
      }

      const { count: totalParticipants } = await totalQuery;

      let rankQuery = supabase
        .from('tryout_results')
        .select('user_id', { count: 'exact', head: true })
        .gte('total', userScore);

      if (selectedPackage !== "all") {
        rankQuery = rankQuery.eq('package_id', selectedPackage);
      }

      const { count: rankPosition } = await rankQuery;

      if (rankPosition !== null && totalParticipants !== null) {
        setUserRank({ position: rankPosition, total: totalParticipants, score: userScore });
      }
    } catch (err) {
      console.error("Error fetching user rank:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Ranking */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-slate-900 font-black text-4xl tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
               <Trophy className="w-7 h-7" />
            </div>
            Ranking Nasional
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Lihat peringkat tertinggi siswa FBK dari seluruh Indonesia.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm cursor-pointer hover:border-slate-300 transition-all"
              >
                <option value="all">Semua Paket Tryout</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                ))}
              </select>
           </div>
        </div>
      </div>

      {/* User Status Card */}
      {userRank && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                 <User className="w-10 h-10 text-white" />
              </div>
              <div>
                 <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Peringkat Kamu</p>
                 <h2 className="text-4xl font-black text-white tracking-tighter">#{userRank.position} <span className="text-blue-300 text-lg">/ {userRank.total}</span></h2>
              </div>
           </div>
           
           <div className="relative z-10 flex gap-4">
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                 <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest mb-1">Skor Tertinggi</p>
                 <p className="text-xl font-black text-white">{userRank.score}</p>
              </div>
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                 <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest mb-1">Persentil</p>
                 <p className="text-xl font-black text-white">{Math.round((1 - userRank.position / userRank.total) * 100)}%</p>
              </div>
           </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && leaderboard.length >= 3 && selectedPackage === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
           {/* Rank 2 */}
           <div className="md:order-1 flex flex-col items-center justify-end h-full pt-8">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm w-full text-center relative">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 border-4 border-slate-50 shadow-md">
                    <Medal className="w-6 h-6" />
                 </div>
                 <h4 className="font-black text-slate-800 mt-4 truncate px-2">
                    {leaderboard[1]?.profiles?.full_name || "Peserta FBK"}
                 </h4>
                 <div className="text-2xl font-black text-slate-400 mt-1">{leaderboard[1]?.total_score}</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Peringkat 2</div>
              </div>
           </div>

           {/* Rank 1 */}
           <div className="md:order-2">
              <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl shadow-blue-900/20 w-full text-center relative border-4 border-blue-500/30 overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white border-4 border-slate-900 shadow-xl">
                    <Trophy className="w-8 h-8" />
                 </div>
                 <h4 className="font-black text-white text-xl mt-6 truncate px-2">
                    {leaderboard[0]?.profiles?.full_name || "Peserta FBK"}
                 </h4>
                 <div className="text-4xl font-black text-blue-400 mt-2">{leaderboard[0]?.total_score}</div>
                 <div className="text-xs font-bold text-blue-300 uppercase tracking-[0.2em] mt-2">Juara Nasional</div>
                 <div className="mt-6 flex justify-center">
                    <div className="px-4 py-1.5 bg-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase border border-blue-500/20">Skor Tertinggi</div>
                 </div>
              </div>
           </div>

           {/* Rank 3 */}
           <div className="md:order-3 flex flex-col items-center justify-end h-full pt-8">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm w-full text-center relative">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border-4 border-white shadow-md">
                    <Award className="w-6 h-6" />
                 </div>
                 <h4 className="font-black text-slate-800 mt-4 truncate px-2">
                    {leaderboard[2]?.profiles?.full_name || "Peserta FBK"}
                 </h4>
                 <div className="text-2xl font-black text-orange-400 mt-1">{leaderboard[2]?.total_score}</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Peringkat 3</div>
              </div>
           </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-600" /> Daftar Peringkat
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Real-time</span>
         </div>

         {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
               <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
               <p className="text-slate-500 text-sm font-medium mt-4">Menghitung peringkat nasional...</p>
            </div>
         ) : leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-4">Rank</th>
                        <th className="px-6 py-4">Siswa</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4 text-right">Skor SKD</th>
                     </tr>
                  </thead>
                  <tbody>
                     {leaderboard.map((item, index) => (
                        <tr key={index} className="group border-t border-slate-50 hover:bg-slate-50/80 transition-colors">
                           <td className="px-8 py-5">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                                index === 0 ? "bg-amber-100 text-amber-600" :
                                index === 1 ? "bg-slate-100 text-slate-600" :
                                index === 2 ? "bg-orange-100 text-orange-600" : "text-slate-400"
                              )}>
                                 {index + 1}
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <User className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <div className="text-sm font-black text-slate-800 tracking-tight">
                                       {item.profiles?.full_name || "Peserta Rahasia"}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                       Siswa Kedinasan
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 inline-block uppercase tracking-wider">
                                 SKD CAT
                              </div>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 text-lg font-black text-slate-900 tracking-tight">
                                 <Target className="w-4 h-4 text-blue-500" />
                                 {item.total_score}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         ) : (
            <div className="py-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Award className="w-8 h-8" />
               </div>
               <p className="text-slate-500 font-medium">Belum ada data peringkat untuk kategori ini.</p>
            </div>
         )}
      </div>

      {/* Motivation Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
         <h3 className="text-2xl font-black text-white relative z-10">Ingin Namamu Ada di Sini?</h3>
         <p className="text-blue-100 mt-2 font-medium relative z-10 max-w-lg mx-auto">Tingkatkan terus pengerjaan tryout kamu dan raih skor tertinggi untuk menduduki peringkat Juara Nasional!</p>
      </div>
    </div>
  );
}
