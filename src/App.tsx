import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TryoutView } from "@/components/views/TryoutView";
import { PaketSayaView } from "@/components/views/PaketSayaView";
import { ContactView } from "@/components/views/ContactView";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { EmptyView } from "@/components/views/EmptyView";
import { LandingPageView } from "@/components/views/LandingPageView";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord } from "@/types";

import { ResetPasswordView } from "@/components/views/ResetPasswordView";

// Lazy Loaded Views for better mobile performance
const TryoutEngineView = lazy(() => import("@/components/views/TryoutEngineView").then(m => ({ default: m.TryoutEngineView })));
const TryoutResultView = lazy(() => import("@/components/views/TryoutResultView").then(m => ({ default: m.TryoutResultView })));
const TryoutPreView = lazy(() => import("@/components/views/TryoutPreView").then(m => ({ default: m.TryoutPreView })));
const TryoutReviewView = lazy(() => import("@/components/views/TryoutReviewView").then(m => ({ default: m.TryoutReviewView })));
const AdminPanelView = lazy(() => import("@/components/views/AdminPanelView").then(m => ({ default: m.AdminPanelView })));
const LeaderboardView = lazy(() => import("@/components/views/LeaderboardView").then(m => ({ default: m.LeaderboardView })));
const SettingsView = lazy(() => import("@/components/views/SettingsView").then(m => ({ default: m.SettingsView })));
const ProfileView = lazy(() => import("@/components/views/ProfileView").then(m => ({ default: m.ProfileView })));
const PaymentHistory = lazy(() => import("@/components/views/PaymentHistoryView").then(m => ({ default: m.PaymentHistory })));
const InvoiceView = lazy(() => import("@/components/views/InvoiceView").then(m => ({ default: m.InvoiceView })));

export default function App() {
  const path = window.location.pathname;
  
  if (path === '/admin-panel' || path === '/admin_panel') {
    return <AdminPanelView />;
  }

  if (path === '/reset-password') {
    return <ResetPasswordView />;
  }

  // 1. Initialize State from LocalStorage if exists
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("fbk_active_page") || "Dashboard";
  });
  const [activePackageId, setActivePackageId] = useState<string | null>(() => {
    return localStorage.getItem("fbk_active_package_id");
  });
  const [questionsId, setQuestionsId] = useState<string | null>(() => {
    return localStorage.getItem("fbk_active_questions_id");
  });

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tryoutResult, setTryoutResult] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(() => {
    return localStorage.getItem("fbk_selected_transaction_id");
  });

  const isAuthenticated = !!session;
  const currentUser = profile?.full_name || session?.user?.email;

  // 2. Persist State Changes
  useEffect(() => {
    localStorage.setItem("fbk_active_page", activePage);
    
    if (activePackageId) localStorage.setItem("fbk_active_package_id", activePackageId);
    else localStorage.removeItem("fbk_active_package_id");

    if (questionsId) localStorage.setItem("fbk_active_questions_id", questionsId);
    else localStorage.removeItem("fbk_active_questions_id");

    if (selectedTransactionId) localStorage.setItem("fbk_selected_transaction_id", selectedTransactionId);
    else localStorage.removeItem("fbk_selected_transaction_id");

    // Clear state if back to main menus
    if (["Dashboard", "Paket Saya", "Ranking Nasional"].includes(activePage)) {
      // Keep transaction if we might need to go back, but usually we clear it when entering main flow
    }
  }, [activePage, activePackageId, questionsId, selectedTransactionId]);

  const fetchAllData = async (user: any) => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (pData) setProfile(pData);

      const { data: results, error } = await supabase
        .from("fair_package_leaderboard")
        .select(`*`)
        .eq("user_id", user.id);

      if (!error && Array.isArray(results)) {
        const normalized = results.map((row: any) => ({
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
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchAllData(s.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        fetchAllData(s.user);
      } else {
        setProfile(null);
        setData([]);
        setLoading(false);
        // If logout, clear persistence
        localStorage.removeItem("fbk_active_page");
        localStorage.removeItem("fbk_active_package_id");
        localStorage.removeItem("fbk_active_questions_id");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStartTryout = (packageId: string, questionsId: string) => {
    setActivePackageId(packageId);
    setQuestionsId(questionsId);
    setActivePage("TryoutPreView");
  };

  const handleTryoutComplete = (result: any) => {
    setTryoutResult(result);
    setActivePage("TryoutResult");
    // Clear tryout session persistence
    localStorage.removeItem("fbk_active_page");
    localStorage.removeItem("fbk_active_package_id");
    localStorage.removeItem("fbk_active_questions_id");

    if (session?.user) fetchAllData(session.user);
  };

  const handleHistoryReview = async (record: TryoutRecord) => {
    if (!supabase) return;
    try {
      let { data: questionsData, error } = await supabase
        .rpc('get_tryout_review', { target_result_id: record.id });

      if (error || !questionsData || questionsData.length === 0) {
        const { data: manualData } = await supabase
          .from('tryout_questions')
          .select('*')
          .eq('package_id', record.tryoutId)
          .order('number', { ascending: true });
        questionsData = manualData;
      }

      if (questionsData) {
        setTryoutResult({
          ...record,
          questions: questionsData,
        });
        setActivePage("TryoutReview");
      }
    } catch (err) {
      toast.error("Gagal memuat pembahasan");
    }
  };

  const renderView = () => {
    if (!isAuthenticated) {
      return <LandingPageView onEnter={() => setIsLoginOpen(true)} />;
    }

    if (loading && activePage === "Dashboard") return <DashboardSkeleton />;

    switch (activePage) {
      case "Dashboard":
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} onViewInvoice={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} onReview={handleHistoryReview} />;
      case "Paket dan Tryout SKD":
        return <TryoutView isAuthenticated={isAuthenticated} onPurchaseSuccess={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} onLoginClick={() => setIsLoginOpen(true)} />;
      case "Invoice":
        return selectedTransactionId ? <InvoiceView transactionId={selectedTransactionId} onBack={() => setActivePage("Paket dan Tryout SKD")} /> : <div className="p-20 text-center">Invoice Not Found</div>;
      case "TryoutPreView":
        return <TryoutPreView packageId={activePackageId} questionsId={questionsId} onStart={() => setActivePage("TryoutEngine")} onCancel={() => setActivePage("Paket Saya")} />;
      case "Paket Saya":
        return <PaketSayaView onStartTryout={handleStartTryout} />;
      case "Profil Saya":
        return <ProfileView />;
      case "Pengaturan":
        return <SettingsView />;
      case "Riwayat Transaksi":
        return <PaymentHistory onBack={() => setActivePage("Dashboard")} onViewInvoice={(txId) => { setSelectedTransactionId(txId); setActivePage('Invoice'); }} />;
      case "Ranking Nasional":
        return <LeaderboardView onLoginClick={() => setIsLoginOpen(true)} />;
      case "Pusat Bantuan":
        return <ContactView />;
      case "Events":
        return <EmptyView title="Event & Kompetisi" />;
      case "TryoutEngine":
        return <TryoutEngineView packageId={activePackageId!} questionsId={questionsId!} onFinish={handleTryoutComplete} onExit={() => setActivePage("Dashboard")} />;
      case "TryoutResult":
        return tryoutResult ? <TryoutResultView result={tryoutResult} packageId={activePackageId!} onBack={() => setActivePage("Dashboard")} onReview={() => setActivePage("TryoutReview")} /> : null;
      case "TryoutReview":
        return tryoutResult ? <TryoutReviewView result={tryoutResult} questions={tryoutResult.questions || []} onBack={() => setActivePage("Dashboard")} /> : null;
      default:
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={setActivePage} onViewInvoice={() => { }} onReview={handleHistoryReview} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-center" richColors />
        {renderView()}
        <AuthModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      </>
    );
  }

  // Define full-screen pages
  const isFullScreenPage = ["TryoutEngine", "TryoutResult", "TryoutReview"].includes(activePage);

  if (isFullScreenPage) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
        <Toaster position="top-center" richColors />
        <main className="h-full overflow-y-auto">
          <Suspense fallback={<DashboardSkeleton />}>
            {renderView()}
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden transition-colors duration-500">
      <Toaster position="top-center" richColors />
      <Sidebar
        isOpen={false}
        onClose={() => { }}
        activePage={activePage}
        onPageChange={setActivePage}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onMenuToggle={() => { }}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          profile={profile}
          onNavigate={setActivePage}
          isLoginOpen={isLoginOpen}
          setIsLoginOpen={setIsLoginOpen}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 p-4 lg:p-8">
          <Suspense fallback={<DashboardSkeleton />}>
            {renderView()}
          </Suspense>
        </main>
      </div>
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
