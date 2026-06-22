import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardView } from "@/components/views/DashboardView";
import { TryoutView } from "@/components/views/TryoutView";
import { PaketSayaView } from "@/components/views/PaketSayaView";
import { ContactView } from "@/components/views/ContactView";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { LandingPageView } from "@/components/views/LandingPageView";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/lib/supabaseClient";
import { Mail, RefreshCcw } from "lucide-react";
import type { TryoutRecord } from "@/types";

import { ResetPasswordView } from "@/components/views/ResetPasswordView";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { SEO } from "@/components/SEO";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

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
const EventsView = lazy(() => import("@/components/views/EventsView").then(m => ({ default: m.EventsView })));
const EventEngineView = lazy(() => import("@/components/views/EventEngineView").then(m => ({ default: m.EventEngineView })));

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tryoutResult, setTryoutResult] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(() => {
    return localStorage.getItem("fbk_selected_transaction_id");
  });
  const [paketSayaKey, setPaketSayaKey] = useState(0);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        // Hanya fetch data saat event yang relevan, bukan saat TOKEN_REFRESHED
        // TOKEN_REFRESHED terjadi setiap jam dan tidak perlu re-fetch data
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          fetchAllData(s.user);
        }
      } else {
        setProfile(null);
        setData([]);
        setLoading(false);
        // If logout, clear persistence and redirect to landing
        localStorage.removeItem("fbk_active_page");
        localStorage.removeItem("fbk_active_package_id");
        localStorage.removeItem("fbk_active_questions_id");
        
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync activePage based on URL path
  useEffect(() => {
    const path = location.pathname;
    const pageMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/paket': 'Paket dan Tryout SKD',
      '/paket-saya': 'Paket Saya',
      '/ranking': 'Ranking Nasional',
      '/events': 'Events',
      '/profile': 'Profil Saya',
      '/settings': 'Pengaturan',
      '/transactions': 'Riwayat Transaksi',
      '/help': 'Pusat Bantuan',
      '/invoice': 'Invoice',
      '/tryout-result': 'TryoutResult',
      '/tryout-review': 'TryoutReview'
    };
    
    // Check for exact matches first
    if (pageMap[path]) {
      setActivePage(pageMap[path]);
    } else if (path.startsWith('/tryout-pre')) {
      setActivePage('TryoutPreView');
    } else if (path.startsWith('/tryout-engine')) {
      setActivePage('TryoutEngine');
    } else if (path.startsWith('/event-engine')) {
      setActivePage('EventEngine');
    } else if (path === '/login') {
      setIsLoginOpen(true);
      setAuthMode('login');
    } else if (path === '/register') {
      setIsLoginOpen(true);
      setAuthMode('register');
    }
  }, [location.pathname]);

  // Handle Redirection after Verification and Hash Routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true' || window.location.hash.includes('verified=true')) {
      if (!isAuthenticated) {
        setIsLoginOpen(true);
      }
      navigate('/paket');
      
      setTimeout(() => {
        toast.success("Email Berhasil Diverifikasi!", {
          description: "Akun Anda sudah aktif. Silakan masuk untuk mulai persiapan kedinasan.",
          duration: 6000
        });
      }, 500);
    }
  }, [isAuthenticated, navigate]);

  const handleStartTryout = (packageId: string, questionsId: string) => {
    setActivePackageId(packageId);
    setQuestionsId(questionsId);
    navigate(`/tryout-pre/${packageId}/${questionsId}`);
  };

  const handleTryoutComplete = (result: any) => {
    setTryoutResult(result);
    navigate('/tryout-result');
    // Clear tryout session persistence
    localStorage.removeItem("fbk_active_page");
    localStorage.removeItem("fbk_active_package_id");
    localStorage.removeItem("fbk_active_questions_id");

    if (session?.user) fetchAllData(session.user);
  };

  const handleHistoryReview = async (record: TryoutRecord) => {
    if (!supabase) return;
    const toastId = toast.loading("Memuat pembahasan...");
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
        toast.success("Pembahasan siap!", { id: toastId });
        navigate("/tryout-review");
      } else {
        toast.error("Pembahasan tidak ditemukan", { id: toastId });
      }
    } catch (err) {
      toast.error("Gagal memuat pembahasan", { id: toastId });
    }
  };

  const handleNavigate = (p: string) => {
    const pageMap: Record<string, string> = {
      'Dashboard': '/dashboard',
      'Paket dan Tryout SKD': '/paket',
      'Paket Saya': '/paket-saya',
      'Ranking Nasional': '/ranking',
      'Events': '/events',
      'Profil Saya': '/profile',
      'Pengaturan': '/settings',
      'Riwayat Transaksi': '/transactions',
      'Pusat Bantuan': '/help',
      'Invoice': '/invoice'
    };

    const targetPath = pageMap[p];
    if (targetPath) {
      navigate(targetPath);
      setActivePage(p);
    } else {
      const slug = p.toLowerCase().replace(/ /g, '-');
      const finalPath = slug.startsWith('/') ? slug : `/${slug}`;
      navigate(finalPath);
    }
    setIsSidebarOpen(false);
  };

  const renderRoutes = () => {
    // Untuk route tryout engine, jangan pakai DashboardSkeleton saat loading
    const isTryoutRoute = location.pathname === '/tryout-engine' || 
      location.pathname === '/tryout-result' || 
      location.pathname === '/tryout-review' ||
      location.pathname.startsWith('/tryout-pre');

    if (loading) {
      if (isTryoutRoute) {
        return (
          <div className="fixed inset-0 bg-[#eef0f4] dark:bg-slate-950 flex flex-col items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Memuat Sesi Tryout...</p>
          </div>
        );
      }
      return <DashboardSkeleton />;
    }

    return (
      <Routes>
        {/* Landing/Auth */}
        <Route path="/" element={!isAuthenticated ? <LandingPageView onLogin={() => { setAuthMode('login'); setIsLoginOpen(true); }} onRegister={() => { setAuthMode('register'); setIsLoginOpen(true); }} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!isAuthenticated ? <LandingPageView onLogin={() => { setAuthMode('login'); setIsLoginOpen(true); }} onRegister={() => { setAuthMode('register'); setIsLoginOpen(true); }} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!isAuthenticated ? <LandingPageView onLogin={() => { setAuthMode('login'); setIsLoginOpen(true); }} onRegister={() => { setAuthMode('register'); setIsLoginOpen(true); }} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        
        {/* Admin */}
        <Route path="/admin-panel" element={<AdminPanelView />} />

        {/* User Protected Routes */}
        <Route path="/dashboard" element={isAuthenticated ? <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={handleNavigate} onViewInvoice={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} onReview={handleHistoryReview} /> : <Navigate to="/" replace />} />
        <Route path="/paket" element={isAuthenticated ? <TryoutView isAuthenticated={isAuthenticated} onPurchaseSuccess={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} onLoginClick={() => setIsLoginOpen(true)} /> : <Navigate to="/" replace />} />
        <Route path="/paket-saya" element={isAuthenticated ? <PaketSayaView key={paketSayaKey} onStartTryout={handleStartTryout} /> : <Navigate to="/" replace />} />
        <Route path="/ranking" element={<LeaderboardView onLoginClick={() => setIsLoginOpen(true)} />} />
        <Route path="/events" element={isAuthenticated ? <EventsView /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={isAuthenticated ? <ProfileView /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsView /> : <Navigate to="/" replace />} />
        <Route path="/transactions" element={isAuthenticated ? <PaymentHistory onBack={() => navigate("/dashboard")} onViewInvoice={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} /> : <Navigate to="/" replace />} />
        <Route path="/help" element={<ContactView />} />
        <Route path="/invoice" element={selectedTransactionId ? <InvoiceView transactionId={selectedTransactionId} onBack={(success?: boolean) => { if (success) { setSelectedTransactionId(null); setPaketSayaKey(k => k + 1); navigate("/paket-saya"); } else { navigate("/paket"); } }} /> : <Navigate to="/dashboard" replace />} />
        
        {/* Event Engine Route */}
        <Route path="/event-engine/:eventId" element={isAuthenticated ? <EventEngineView /> : <Navigate to="/" replace />} />

        {/* Tryout Engine Routes */}
        <Route path="/tryout-pre/:pId/:qId" element={<TryoutPreView packageId={activePackageId} questionsId={questionsId} onStart={() => navigate("/tryout-engine")} onCancel={() => navigate("/paket-saya")} />} />
        <Route path="/tryout-engine" element={
          loading
            ? <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            : !isAuthenticated
              ? <Navigate to="/" replace />
              : activePackageId && questionsId
                ? <TryoutEngineView packageId={activePackageId} questionsId={questionsId} onFinish={handleTryoutComplete} onExit={() => navigate("/dashboard")} />
                : <Navigate to="/dashboard" replace />
        } />
        <Route path="/tryout-result" element={tryoutResult ? <TryoutResultView result={tryoutResult} packageId={activePackageId!} onBack={() => navigate("/dashboard")} onReview={() => navigate("/tryout-review")} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/tryout-review" element={tryoutResult ? <TryoutReviewView result={tryoutResult} questions={tryoutResult.questions || []} onBack={() => navigate("/dashboard")} /> : <Navigate to="/dashboard" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  if (!isAuthenticated && location.pathname === '/') {
    return (
      <>
        <SEO />
        <Toaster position="top-center" richColors />
        {renderRoutes()}
        <AuthModal
          isOpen={isLoginOpen}
          onClose={() => { setIsLoginOpen(false); if (location.pathname === '/login' || location.pathname === '/register') navigate('/'); }}
          initialMode={authMode}
        />
        <FloatingWhatsApp number="087753646617" />
      </>
    );
  }

  // Define full-screen pages based on pathname
  const isFullScreenPage = location.pathname.startsWith('/tryout') || 
                           location.pathname.startsWith('/event-engine') ||
                           location.pathname === '/admin-panel' || 
                           location.pathname === '/reset-password';

  if (isFullScreenPage) {
    // Background disesuaikan: tryout engine pakai #eef0f4, halaman lain pakai slate-50
    const isTryoutEngine = location.pathname === '/tryout-engine' || location.pathname.startsWith('/event-engine');
    const bgClass = isTryoutEngine ? 'bg-[#eef0f4] dark:bg-[#0a0a0f]' : 'bg-slate-50 dark:bg-[#0a0a0f]';
    const tryoutFallback = (
      <div className="fixed inset-0 bg-[#eef0f4] dark:bg-[#0a0a0f] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Memuat Sesi Tryout...</p>
      </div>
    );

    return (
      <div className={`h-[100dvh] ${bgClass} overflow-hidden transition-colors duration-500`}>
        <SEO title={`${activePage} | Future Bimbel Kedinasan`} noIndex={true} />
        <Toaster position="top-center" richColors />
        <main className="h-full overflow-y-auto custom-scrollbar">
          <Suspense fallback={isTryoutEngine ? tryoutFallback : <DashboardSkeleton />}>
            {renderRoutes()}
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#0a0a0f] flex flex-col lg:flex-row overflow-hidden transition-colors duration-500">
      <SEO title={`${activePage} | Future Bimbel Kedinasan`} noIndex={true} />
      <Toaster position="top-center" richColors />
      {isAuthenticated && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activePage={activePage}
          onPageChange={handleNavigate}
        />
      )}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
        {isAuthenticated && (
          <Header
            onMenuToggle={() => setIsSidebarOpen(true)}
            activePage={activePage}
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            profile={profile}
            onNavigate={handleNavigate}
            isLoginOpen={isLoginOpen}
            setIsLoginOpen={setIsLoginOpen}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0f] p-4 lg:p-8 pb-[calc(1rem+56px+env(safe-area-inset-bottom,0px))] lg:pb-8 custom-scrollbar">
          {!isVerified && isAuthenticated && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl shadow-amber-500/5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
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
            {renderRoutes()}
          </Suspense>
        </main>
      </div>
      {isAuthenticated && (
        <MobileBottomNav
          activePage={activePage}
          onPageChange={handleNavigate}
          onMoreClick={() => setIsSidebarOpen(true)}
        />
      )}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => { setIsLoginOpen(false); if (location.pathname === '/login' || location.pathname === '/register') navigate('/'); }}
        initialMode={authMode}
      />
      {!isAuthenticated && <FloatingWhatsApp number="087753646617" />}
    </div>
  );
}
