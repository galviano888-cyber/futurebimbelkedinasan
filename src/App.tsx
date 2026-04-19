import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TryoutView } from "@/components/views/TryoutView";
import { PaketSayaView } from "@/components/views/PaketSayaView";
import { EmptyView } from "@/components/views/EmptyView";
import { LandingPageView } from "@/components/views/LandingPageView";
import { ContactView } from "@/components/views/ContactView";
import { TryoutEngineView } from "@/components/views/TryoutEngineView";
import { TryoutResultView } from "@/components/views/TryoutResultView";
import { TryoutPreView } from "@/components/views/TryoutPreView";
import { TryoutReviewView } from "@/components/views/TryoutReviewView";
import { AdminPanelView } from "@/components/views/AdminPanelView";
import { InvoiceView } from "@/components/views/InvoiceView";
import { ProfileView } from "@/components/views/ProfileView";
import { LeaderboardView } from "@/components/views/LeaderboardView";
import type { TryoutResult } from "@/data/tryoutQuestions";
import { DashboardSkeleton, PaketSkeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { PaymentHistory } from "@/components/views/PaymentHistoryView";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord } from "@/types";

export function App() {
  if (window.location.pathname === '/admin-panel') {
    return <AdminPanelView />;
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState(() => localStorage.getItem('activePage') || "Dashboard");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(() => localStorage.getItem('selectedTransactionId'));
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [showLanding, setShowLanding] = useState(false);
  const [tryoutResult, setTryoutResult] = useState<TryoutResult | null>(null);
  const [activePackageId, setActivePackageId] = useState<string | null>(() => localStorage.getItem('activePackageId'));
  const [questionsId, setQuestionsId] = useState<string | null>(() => localStorage.getItem('questionsId'));
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || null);
      if (session) {
        setShowLanding(false);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || null);
      if (session) {
        setShowLanding(false);
      } else {
        // Logout Cleanup: Hapus SEMUA jejak navigasi agar tidak "nyangkut" ke user berikutnya
        setData([]);
        localStorage.removeItem('activePage');
        localStorage.removeItem('activePackageId');
        localStorage.removeItem('questionsId');
        localStorage.removeItem('selectedTransactionId');
        
        // Sapu bersih semua data sesi ujian yang tersimpan di browser
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('tryout_session_')) {
            localStorage.removeItem(key);
          }
        });

        setActivePage("Dashboard");
        setActivePackageId(null);
        setQuestionsId(null);
        setSelectedTransactionId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    if (activePackageId) localStorage.setItem('activePackageId', activePackageId);
    else localStorage.removeItem('activePackageId');
  }, [activePackageId]);

  useEffect(() => {
    if (questionsId) localStorage.setItem('questionsId', questionsId);
    else localStorage.removeItem('questionsId');
  }, [questionsId]);


  const fetchData = async () => {
    if (!supabase || !isAuthenticated) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mengambil data performa adil (hanya percobaan pertama tiap paket) dari view SQL
      const { data: supabaseData, error } = await supabase
        .from("fair_package_leaderboard")
        .select(`*`)
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;

      if (supabaseData) {
        const normalized: TryoutRecord[] = supabaseData.map((row: any) => ({
          id: String(row.id),
          packageId: row.package_id,
          tryoutId: row.tryout_id,
          date: row.date,
          packageName: row.package_name || "Paket Tidak Teridentifikasi",
          twk: row.twk || 0,
          tiu: row.tiu || 0,
          tkp: row.tkp || 0,
          total: row.total || 0,
          answers: row.answers || {},
          score_details: row.score_details || null
        }));

        setData(normalized);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session } = await supabase
        .from('active_tryout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) {
        const endTime = new Date(session.end_time).getTime();
        const now = new Date().getTime();
        
        if (endTime > now) {
          setActivePackageId(session.package_id);
          setQuestionsId(session.tryout_id);
          // JANGAN PAKSA ke halaman TryoutEngine secara otomatis
          // Biarkan user yang navigasi sendiri agar tidak kaget pas refresh
          console.log("Sesi aktif ditemukan di database, data dipulihkan di background.");
        }
      }
    } catch (err) {
      console.error("Gagal mengecek sesi aktif:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      checkActiveSession();
    }
  }, [isAuthenticated]);

  const handleHistoryReview = async (record: TryoutRecord) => {
    if (!supabase) return;
    
    const tId = record.tryoutId;
    if (!tId) {
      alert("Maaf, riwayat pengerjaan ini tidak memiliki data soal untuk dibahas.");
      return;
    }

    try {
      // 1. Fetch questions for this tryout
      const { data: questionsData, error } = await supabase
        .from('tryout_questions')
        .select('*')
        .eq('package_id', tId)
        .order('number', { ascending: true });

      if (error) throw error;
      if (!questionsData || questionsData.length === 0) {
        alert("Soal tidak ditemukan untuk paket ini.");
        return;
      }

      // 2. Construct TryoutResult with calculated stats to prevent NaN
      const answers = record.answers || record.score_details?.answers || {};
      let correctCount = 0;
      let wrongCount = 0;
      
      questionsData.forEach(q => {
        const ans = answers[q.id];
        if (ans) {
          if (q.category === 'TKP') correctCount++;
          else if (ans === q.correct_answer) correctCount++;
          else wrongCount++;
        }
      });

      const mockResult: any = {
        packageId: record.packageId,
        score: record.total,
        twk: record.twk,
        tiu: record.tiu,
        tkp: record.tkp,
        total: record.total,
        timeUsed: 0,
        correctCount,
        wrongCount,
        unansweredCount: questionsData.length - (correctCount + wrongCount),
        questions: questionsData,
        answers: answers,
        fromHistory: true // Flag untuk tahu asal navigasi
      };

      setTryoutResult(mockResult);
      setActivePage("TryoutReview");
    } catch (err) {
      console.error("Error loading review:", err);
      alert("Gagal memuat pembahasan soal.");
    }
  };

  const handleStartTryout = (packageId: string, tryoutId: string) => {
    setActivePackageId(packageId);
    setQuestionsId(tryoutId);
    // Paksa Reset Timer & Jawaban
    localStorage.removeItem(`timer_${tryoutId}`);
    localStorage.removeItem(`answers_${tryoutId}`);
    localStorage.removeItem(`flagged_${tryoutId}`);
    setActivePage("TryoutPreView");
  };

  const handleTryoutComplete = (res: any) => {
    if (questionsId) {
      localStorage.removeItem(`timer_${questionsId}`);
      localStorage.removeItem(`answers_${questionsId}`);
      localStorage.removeItem(`flagged_${questionsId}`);
    }
    setTryoutResult(res);
    setActivePage("TryoutResult");
    fetchData();
  };

  const renderView = () => {
    if (loading) {
      if (activePage === "Dashboard") return <DashboardSkeleton />;
      if (activePage === "Paket Saya") return <PaketSkeleton />;
      return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      );
    }

    switch (activePage) {
      case "Dashboard":
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} onViewInvoice={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} onReview={handleHistoryReview} />;
      case "Paket dan Tryout SKD":
        return <TryoutView isAuthenticated={isAuthenticated} onPurchaseSuccess={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} onLoginClick={() => setIsLoginOpen(true)} />;
      case "Invoice":
        return selectedTransactionId ? <InvoiceView transactionId={selectedTransactionId} onBack={() => setActivePage("Paket dan Tryout SKD")} /> : <div className="p-20 text-center"><h2 className="text-xl font-bold">Invoice Tidak Ditemukan</h2><button onClick={() => setActivePage("Dashboard")} className="text-blue-600 mt-4">Dashboard</button></div>;
      case "TryoutPreView":
        return <TryoutPreView packageId={activePackageId} questionsId={questionsId} onStart={() => setActivePage("TryoutEngine")} onCancel={() => setActivePage("Paket Saya")} />;
      case "Paket Saya":
        return <PaketSayaView onStartTryout={handleStartTryout} />;
      case "Profil Saya":
        return <ProfileView onNavigate={setActivePage} />;
      case "Riwayat Transaksi":
        return <PaymentHistory onBack={() => setActivePage("Dashboard")} onViewInvoice={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} />;
      case "Ranking Nasional":
        return <LeaderboardView onLoginClick={() => setIsLoginOpen(true)} />;
      case "Events":
        return <EmptyView title="Events" />;
      case "Pusat Bantuan":
        return <ContactView />;
      case "TryoutEngine":
        if (!activePackageId || !questionsId) return <PaketSayaView onStartTryout={handleStartTryout} />;
        return <TryoutEngineView packageId={activePackageId} questionsId={questionsId} onFinish={handleTryoutComplete} onExit={() => { setActivePackageId(null); setQuestionsId(null); setActivePage("Paket Saya"); }} />;
      case "TryoutResult":
        return tryoutResult ? <TryoutResultView result={tryoutResult} packageId={activePackageId || ""} onBack={() => { setTryoutResult(null); setActivePage("Dashboard"); }} onReview={() => setActivePage("TryoutReview")} /> : <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} />;
      case "TryoutReview":
        return tryoutResult ? <TryoutReviewView result={tryoutResult} onBack={() => setActivePage(tryoutResult.fromHistory ? "Dashboard" : "TryoutResult")} /> : <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} />;
      default:
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} />;
    }
  };

  // REMOVED LOADING CHECK TO PREVENT WHITE SCREEN
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster theme="dark" position="top-right" />

      {showLanding ? (
        <LandingPageView onEnter={() => { setShowLanding(false); setIsLoginOpen(true); }} />
      ) : activePage === "TryoutEngine" && activePackageId && questionsId ? (
        <TryoutEngineView
          packageId={activePackageId}
          questionsId={questionsId}
          onFinish={handleTryoutComplete}
          onExit={() => { setActivePackageId(null); setQuestionsId(null); setActivePage("Paket Saya"); }}
        />
      ) : (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePage={activePage} onPageChange={setActivePage} currentUser={currentUser || "Siswa FBK"} isAuthenticated={isAuthenticated} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 bg-slate-50">
            <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} currentUser={currentUser || "Siswa FBK"} isAuthenticated={isAuthenticated} onNavigate={setActivePage} isLoginOpen={isLoginOpen} setIsLoginOpen={setIsLoginOpen} />
            <main className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-screen-2xl mx-auto">
                {renderView()}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
