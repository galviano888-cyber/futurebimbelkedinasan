import { useState, useEffect } from "react";
import { 
  Trophy, 
  Medal, 
  Filter, 
  Loader2, 
  User, 
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function LeaderboardView({ onLoginClick }: { onLoginClick?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [userRank, setUserRank] = useState<{ position: number; total: number; score: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchPackages();
    fetchLeaderboard();
    fetchUserRank();

    // Realtime subscription
    if (!supabase) return;
    const channel = supabase
      .channel('leaderboard_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tryout_results' },
        () => {
          fetchLeaderboard();
          fetchUserRank();
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [selectedPackage]);

  const fetchPackages = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('packages').select('id, title').eq('is_active', true);
    if (data && data.length > 0) {
      setPackages(data);
      if (!selectedPackage) {
        setSelectedPackage("all");
      }
    } else {
      setSelectedPackage("all");
    }
  };

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (selectedPackage === "all") {
        const { data, error } = await supabase
          .from('leaderboard_averages')
          .select('*')
          .order('avg_total', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        const formatted = (data || []).map((item: any) => ({
            ...item,
            twk: item.avg_twk,
            tiu: item.avg_tiu,
            tkp: item.avg_tkp,
            total: item.avg_total,
            profiles: { full_name: item.full_name }
        }));
        setLeaderboard(formatted);
      } else {
        const { data, error } = await supabase
          .from('fair_package_leaderboard')
          .select('*')
          .eq('package_id', selectedPackage)
          .order('total', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        const formatted = (data || []).map((item: any) => ({
            ...item,
            profiles: { full_name: item.full_name }
        }));
        setLeaderboard(formatted);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!supabase) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData.user);
      if (!userData.user) return;

      const table = selectedPackage === "all" ? 'leaderboard_averages' : 'fair_package_leaderboard';
      const scoreCol = selectedPackage === "all" ? 'avg_total' : 'total';

      const query = supabase
        .from(table)
        .select(`user_id, ${scoreCol}`)
        .order(scoreCol, { ascending: false });
      
      if (selectedPackage !== "all") {
        query.eq('package_id', selectedPackage);
      }

      const { data: allRanks } = await query;

      if (allRanks) {
        const position = allRanks.findIndex(r => r.user_id === userData.user?.id) + 1;
        const userStats: any = allRanks.find(r => r.user_id === userData.user?.id);
        if (position > 0 && userStats) {
          setUserRank({ position, total: allRanks.length, score: userStats[scoreCol] });
        } else {
          setUserRank(null);
        }
      }
    } catch (error) {
      console.error("Error fetching user rank:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 p-4">
      {/* GLOWING HERO SECTION */}
      <section className="relative pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none will-change-transform" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-800">
               <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
               <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Global Hall of Fame</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Ranking <span className="text-blue-600">Nasional</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
              Rayakan prestasi terbaik siswa Future Bimbel Kedinasan dari seluruh pelosok Nusantara. Apakah namamu ada di puncak?
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
             <div className="bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center group">
                <div className="flex items-center gap-3 pl-4 pr-2">
                   <Filter className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                   <select 
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="bg-transparent py-4 pr-10 text-sm font-black text-slate-800 dark:text-white focus:outline-none appearance-none cursor-pointer"
                   >
                    <option value="all">🏆 Ranking Nasional (Global)</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id} className="dark:bg-slate-900">{pkg.title}</option>
                    ))}
                   </select>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                   <ChevronRight className="w-6 h-6" />
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      <div className="relative min-h-[500px]">
        {/* ACCESS OVERLAY FOR GUESTS */}
        <AnimatePresence>
          {!currentUser && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 inset-y-0 z-50 flex items-center justify-center rounded-[3rem] overflow-hidden"
            >
               <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/40" />
               <div className="relative z-10 text-center space-y-8 p-12 max-w-md animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40">
                     <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ranking Terkunci! 🔒</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium mt-3 leading-relaxed">
                      Silakan masuk ke akun Anda untuk melihat Ranking Nasional Future Bimbel Kedinasan.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={onLoginClick} 
                      className="h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 text-base"
                    >
                      Login Sekarang
                    </Button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Akses eksklusif untuk siswa FBK</p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("space-y-12 transition-all duration-700", (!currentUser && !loading) && "blur-3xl pointer-events-none grayscale opacity-30 select-none")}>
          {/* PREMIUM USER RANK CARD */}
          <AnimatePresence>
            {userRank && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-8 md:p-12 overflow-hidden border border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[80px] -mr-48 -mt-48 pointer-events-none will-change-transform" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[60px] -ml-32 -mb-32 pointer-events-none will-change-transform" />
                   
                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="flex items-center gap-8">
                         <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl">
                               <User className="w-12 h-12" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center border-4 border-slate-900 text-yellow-950 shadow-lg">
                               <Star className="w-5 h-5 fill-current" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.3em]">Status Performa Anda</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">
                              #{userRank.position} <span className="text-slate-500 text-2xl font-bold">/ {userRank.total}</span>
                            </h2>
                         </div>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto">
                         <div className="flex-1 md:flex-none px-8 py-5 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Skor Tertinggi</p>
                            <p className="text-3xl font-black text-white tracking-tighter">{userRank.score}</p>
                         </div>
                         <div className="flex-1 md:flex-none px-8 py-5 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 text-center">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Top Persentil</p>
                            <div className="flex items-center justify-center gap-2">
                               <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                               <p className="text-3xl font-black text-white tracking-tighter">
                                 {Math.round((1 - userRank.position / userRank.total) * 100)}%
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOP 3 PODIUM */}
          {!loading && leaderboard.length >= 3 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              {/* RANK 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:order-1 flex flex-col justify-end"
              >
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl text-center relative group hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-500 border-8 border-slate-50 dark:border-slate-950 shadow-xl group-hover:scale-110 transition-transform">
                       <Medal className="w-10 h-10" />
                    </div>
                    <div className="pt-10">
                       <h4 className="font-black text-slate-800 dark:text-white text-xl truncate mb-1">
                          {leaderboard[1]?.profiles?.full_name || "Peserta FBK"}
                       </h4>
                       <div className="text-4xl font-black text-slate-300 dark:text-slate-700 tracking-tighter mb-4">{leaderboard[1]?.total}</div>
                       <div className="inline-block px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-full border border-slate-100 dark:border-slate-800 uppercase tracking-widest">Runner Up</div>
                    </div>
                 </div>
              </motion.div>

              {/* RANK 1 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="md:order-2"
              >
                 <div className="relative group">
                    {/* Background Layer with clipping */}
                    <div className="absolute inset-0 bg-blue-600 rounded-[3.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700" />
                       <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[40px] -mr-24 -mt-24 pointer-events-none will-change-transform" />
                    </div>

                    {/* Content Layer (No clipping) */}
                    <div className="relative z-10 p-10 text-center">
                       <div className="w-24 h-24 bg-yellow-400 rounded-[2.5rem] flex items-center justify-center text-yellow-950 border-8 border-blue-600 shadow-2xl mx-auto -mt-20 group-hover:scale-110 transition-transform">
                          <Trophy className="w-12 h-12" />
                       </div>
                       <div className="pt-8">
                          <h4 className="font-black text-white text-3xl truncate mb-1">
                             {leaderboard[0]?.profiles?.full_name || "Peserta FBK"}
                          </h4>
                          <div className="text-6xl font-black text-yellow-400 tracking-tighter mb-6">{leaderboard[0]?.total}</div>
                          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md text-white text-xs font-black rounded-full border border-white/20 uppercase tracking-[0.2em]">
                             <Star className="w-4 h-4 text-yellow-400 fill-current" /> Champion
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>

              {/* RANK 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:order-3 flex flex-col justify-end"
              >
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl text-center relative group hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-[2rem] flex items-center justify-center text-orange-600 dark:text-orange-400 border-8 border-slate-50 dark:border-slate-950 shadow-xl group-hover:scale-110 transition-transform">
                       <Award className="w-10 h-10" />
                    </div>
                    <div className="pt-10">
                       <h4 className="font-black text-slate-800 dark:text-white text-xl truncate mb-1">
                          {leaderboard[2]?.profiles?.full_name || "Peserta FBK"}
                       </h4>
                       <div className="text-4xl font-black text-orange-400 dark:text-orange-900/50 tracking-tighter mb-4">{leaderboard[2]?.total}</div>
                       <div className="inline-block px-4 py-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black rounded-full border border-orange-100 dark:border-orange-800 uppercase tracking-widest">Third Place</div>
                    </div>
                 </div>
              </motion.div>
            </section>
          )}

          {/* MAIN TABLE SECTION */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative">
             <div className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <TrendingUp className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Leaderboard Lengkap</h3>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Analisis Performa Siswa FBK</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Updates</span>
                </div>
             </div>

             {loading ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                   <p className="text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Menganalisis Skor Nasional...</p>
                </div>
             ) : leaderboard.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="overflow-x-auto"
                >
                   <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                         <tr className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            <th className="px-10 py-6">Rank</th>
                            <th className="px-6 py-6">Siswa</th>
                            <th className="px-6 py-6 text-center">{selectedPackage === 'all' ? 'AVG TWK' : 'TWK'}</th>
                            <th className="px-6 py-6 text-center">{selectedPackage === 'all' ? 'AVG TIU' : 'TIU'}</th>
                            <th className="px-6 py-6 text-center">{selectedPackage === 'all' ? 'AVG TKP' : 'TKP'}</th>
                            <th className="px-6 py-6 text-center">Jumlah Tryout</th>
                            <th className="px-6 py-6 text-right">{selectedPackage === 'all' ? 'AVG SKD' : 'SKD Total'}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                         {leaderboard.map((item, index) => (
                            <motion.tr 
                              key={index}
                              variants={itemVariants}
                              className={cn(
                                "group transition-all duration-300 transform-gpu",
                                item.user_id === userRank?.score ? "bg-blue-50/30 dark:bg-blue-900/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                              )}
                            >
                               <td className="px-10 py-6">
                                  <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all",
                                    index === 0 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 shadow-sm" :
                                    index === 1 ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm" :
                                    index === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 shadow-sm" : 
                                    "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:border-blue-200 group-hover:text-blue-500"
                                  )}>
                                     {index + 1}
                                  </div>
                               </td>
                               <td className="px-6 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                           <User className="w-5 h-5" />
                                        </div>
                                     </div>
                                     <div>
                                        <div className="text-base font-black text-slate-800 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">
                                           {item.profiles?.full_name || "Siswa FBK"}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Aktif: {item.date && !isNaN(new Date(item.date).getTime()) 
                                              ? new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()
                                              : (item.last_active && !isNaN(new Date(item.last_active).getTime())
                                                  ? new Date(item.last_active).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()
                                                  : 'BARU SAJA')}
                                          </span>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.twk || 0}</span>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.tiu || 0}</span>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.tkp || 0}</span>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-black rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-100 transition-all">
                                     {selectedPackage === 'all' ? (item.packages_completed || 1) : 1}x <span className="text-[9px] font-bold text-slate-400">Selesai</span>
                                  </div>
                               </td>
                               <td className="px-6 py-6 text-right">
                                  <div className="flex items-center justify-end gap-3 text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter group-hover:scale-105 transition-transform">
                                     {item.total}
                                  </div>
                               </td>
                            </motion.tr>
                         ))}
                      </tbody>
                   </table>
                </motion.div>
             ) : (
                <div className="py-32 text-center">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto mb-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                      <Award className="w-12 h-12" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Belum Ada Peringkat</h3>
                   <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">Jadilah yang pertama mengerjakan tryout dan catatkan namamu di sejarah!</p>
                </div>
             )}
          </section>

          {/* MOTIVATIONAL BANNER */}
          <section className="relative h-64 rounded-[3.5rem] overflow-hidden group">
             <div className="absolute inset-0 bg-slate-900" />
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-indigo-700/40 opacity-50" />
             <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none will-change-transform" />
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none will-change-transform" />
             
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
                >
                   <Zap className="w-8 h-8 text-yellow-400 fill-current" />
                </motion.div>
                <div className="space-y-2">
                   <h3 className="text-3xl font-black text-white tracking-tight">Siap Menembus Peringkat Nasional?</h3>
                   <p className="text-blue-100 font-medium max-w-lg">Konsistensi adalah kunci. Kerjakan tryout setiap hari dan evaluasi kelemahanmu.</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
