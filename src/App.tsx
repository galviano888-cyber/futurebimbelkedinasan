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
import { Mail, RefreshCcw } from "lucide-react";
import type { TryoutRecord } from "@/types";

import { ResetPasswordView } from "@/components/views/ResetPasswordView";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

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

  // Handle Password Reset Flow
  const isResetFlow = path === '/reset-password' || 
                      window.location.hash.includes('type=recovery') || 
                      window.location.hash.includes('error_code=otp_expired');

  if (isResetFlow) {
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



  const [isVerified, setIsVerified] = useState<boolean>(true);

  const checkVerification = async (user: any) => {
    if (!user) return;
    setIsVerified(!!(user.email_confirmed_at || user.confirmed_at));
  };

  const fetchAllData = async (user: any) => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    checkVerification(user);
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

  // Handle Redirection after Verification and Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'verified=true') {
        // Map hash to page name if needed, or use directly
        const pageMap: Record<string, string> = {
          'dashboard': 'Dashboard',
          'paket': 'Paket dan Tryout SKD',
          'paket-saya': 'Paket Saya',
          'ranking': 'Ranking Nasional',
          'events': 'Events',
          'profile': 'Profil Saya',
          'settings': 'Settings',
          'help': 'Pusat Bantuan',
          'tryout-pre': 'TryoutPreView',
          'tryout': 'TryoutEngine',
          'tryout-result': 'TryoutResult',
          'tryout-review': 'TryoutReview'
        };
        const targetPage = pageMap[hash];
        if (targetPage) setActivePage(targetPage);
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true' || window.location.hash.includes('verified=true')) {
      if (!isAuthenticated) {
        setIsLoginOpen(true);
      }
      setActivePage("Paket dan Tryout SKD");
      window.history.replaceState(null, "", window.location.pathname);
      
      setTimeout(() => {
        toast.success("Email Berhasil Diverifikasi!", {
          description: "Akun kamu sudah aktif, Bro! Silakan masuk untuk mulai persiapan kedinasan.",
          duration: 6000
        });
      }, 500);
    }

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync activePage to Hash
  useEffect(() => {
    if (isAuthenticated) {
      const reverseMap: Record<string, string> = {
        'Dashboard': 'dashboard',
        'Paket dan Tryout SKD': 'paket',
        'Paket Saya': 'paket-saya',
        'Ranking Nasional': 'ranking',
        'Events': 'events',
        'Profil Saya': 'profile',
        'Settings': 'settings',
        'Pusat Bantuan': 'help',
        'TryoutPreView': 'tryout-pre',
        'TryoutEngine': 'tryout',
        'TryoutResult': 'tryout-result',
        'TryoutReview': 'tryout-review'
      };
      const hash = reverseMap[activePage];
      if (hash && window.location.hash !== `#${hash}`) {
        window.history.pushState(null, "", `#${hash}`);
      }
    }
  }, [activePage, isAuthenticated]);

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
        return activePackageId && questionsId ? (
          <TryoutEngineView 
            packageId={activePackageId} 
            questionsId={questionsId} 
            onFinish={handleTryoutComplete} 
            onExit={() => setActivePage("Dashboard")} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>Data tryout tidak lengkap.</p>
            <button onClick={() => setActivePage("Dashboard")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Kembali</button>
          </div>
        );
      case "TryoutResult":
        if (!tryoutResult) {
          setActivePage("Dashboard");
          return null;
        }
        return <TryoutResultView result={tryoutResult} packageId={activePackageId!} onBack={() => setActivePage("Dashboard")} onReview={() => setActivePage("TryoutReview")} />;
      case "TryoutReview":
        if (!tryoutResult) {
          setActivePage("Dashboard");
          return null;
        }
        return <TryoutReviewView result={tryoutResult} questions={tryoutResult.questions || []} onBack={() => setActivePage("Dashboard")} />;
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
          <FloatingWhatsApp number="087753646617" />
        </>
      );
    }

  // Define full-screen pages
  const isFullScreenPage = ["TryoutPreView", "TryoutEngine", "TryoutResult", "TryoutReview"].includes(activePage);

  if (isFullScreenPage) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
        <Toaster position="top-center" richColors />
        <main className="h-full overflow-y-auto transform-gpu">
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
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 p-4 lg:p-8 transform-gpu">
          {!isVerified && isAuthenticated && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-amber-900 dark:text-amber-400 font-black text-xl tracking-tight">Verifikasi Email Anda</h4>
                    <p className="text-amber-700 dark:text-amber-500/70 text-sm font-medium mt-1">Konfirmasi email diperlukan untuk membuka akses penuh dan fitur pembelian paket.</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (!supabase) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const verified = !!(user.email_confirmed_at || user.confirmed_at);
                      setIsVerified(verified);
                      if (verified) toast.success("Email berhasil diverifikasi!");
                      else toast.error("Email masih belum terverifikasi. Silakan cek inbox Anda.");
                    }
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 whitespace-nowrap group"
                >
                  <RefreshCcw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                  Cek Status Verifikasi
                </button>
              </div>
            </div>
          )}
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
