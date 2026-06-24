import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSkeleton, FBKLoader } from "@/components/ui/skeleton";
import { LandingPageView } from "@/components/views/LandingPageView";

// Lazy loaded views
const DashboardView = lazy(() => import("@/components/views/DashboardView").then(m => ({ default: m.DashboardView })));
const TryoutView = lazy(() => import("@/components/views/TryoutView").then(m => ({ default: m.TryoutView })));
const PaketSayaView = lazy(() => import("@/components/views/PaketSayaView").then(m => ({ default: m.PaketSayaView })));
const ContactView = lazy(() => import("@/components/views/ContactView").then(m => ({ default: m.ContactView })));
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // default full/expanded

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tryoutResult, setTryoutResult] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [forceNameModal, setForceNameModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(() => {
    return localStorage.getItem("fbk_selected_transaction_id");
  });
  const [paketSayaKey, setPaketSayaKey] = useState(0);

  const isAuthenticated = !!session;
  const currentUser = profile?.full_name || 
    session?.user?.user_metadata?.full_name || 
    session?.user?.user_metadata?.name || 
    session?.user?.email;
  const isOnline = useOnlineStatus();

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

  interface AuthUser {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
    app_metadata?: { provider?: string };
    user_metadata?: { full_name?: string; name?: string };
  }

  const checkVerification = (user: AuthUser) => {
    if (!user) return;
    setIsVerified(!!(user.email_confirmed_at || user.confirmed_at));
  };

  const fetchAllData = async (user: AuthUser) => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    checkVerification(user);
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone, created_at')
        .eq('id', user.id)
        .single();
      if (pData) setProfile(pData);

      const { data: results, error } = await supabase
        .from("fair_package_leaderboard")
        .select('id, user_id, package_id, tryout_id, date, package_name, twk, tiu, tkp, total, answers, score_details')
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          fetchAllData(s.user);

          // Google OAuth callback: INITIAL_SESSION atau SIGNED_IN setelah redirect
          const isGoogleUser = s.user.app_metadata?.provider === 'google';
          const isOAuthCallback = window.location.hash.includes('access_token') ||
            document.referrer.includes('accounts.google.com') ||
            sessionStorage.getItem('supabase.auth.token') !== null;

          if (isGoogleUser && (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && isOAuthCallback))) {
            navigate('/dashboard', { replace: true });
            const { data: prof } = await supabase!.from('profiles').select('full_name').eq('id', s.user.id).single();
            if (!prof?.full_name) {
              // Coba ambil nama dari Google user_metadata dulu
              const googleName = s.user.user_metadata?.full_name || s.user.user_metadata?.name;
              if (googleName) {
                // Auto-simpan nama dari Google tanpa modal
                await supabase!.from('profiles').upsert(
                  { id: s.user.id, full_name: googleName },
                  { onConflict: 'id' }
                );
                setProfile((prev: any) => ({ ...prev, full_name: googleName }));
              } else {
                // Tidak ada nama dari Google, pakai email sebagai fallback
                const fallbackName = s.user.email?.split('@')[0] || 'Siswa FBK';
                await supabase!.from('profiles').upsert(
                  { id: s.user.id, full_name: fallbackName },
                  { onConflict: 'id' }
                );
                setProfile((prev: any) => ({ ...prev, full_name: fallbackName }));
              }
            }
          }
        }
      } else {
        setProfile(null);
        setData([]);
        setLoading(false);
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
    // Google OAuth callback — bersihkan param dari URL, biarkan onAuthStateChange yang navigate
    if (params.get('google_callback') === 'true') {
      // Hapus query param tanpa navigate dulu — session belum tentu siap saat ini
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
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
            <FBKLoader text="Memuat sesi tryout..." />
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
        
        {/* Admin — requires authenticated session; AdminPanelView enforces role check internally */}
        <Route path="/admin-panel" element={isAuthenticated ? <AdminPanelView /> : <Navigate to="/" replace />} />

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
            ? <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center"><FBKLoader /></div>
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
    const bgClass = isTryoutEngine ? 'engine-surface dark:bg-[#0b0b0e]' : 'app-surface dark:bg-[#0b0b0e]';
    const tryoutFallback = (
      <div className="fixed inset-0 engine-surface flex items-center justify-center">
        <FBKLoader text="Memuat sesi tryout..." />
      </div>
    );

    return (
      <div className={`h-[100dvh] ${bgClass} overflow-hidden transition-colors duration-500`}>
        <SEO title={`${activePage} | Future Bimbel Kedinasan`} noIndex={true} />
        <Toaster position="top-center" richColors />
        <main className="h-full overflow-y-auto custom-scrollbar">
          <ErrorBoundary>
            <Suspense fallback={isTryoutEngine ? tryoutFallback : <DashboardSkeleton />}>
              {renderRoutes()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] app-surface dark:bg-[#0b0b0e] flex flex-col lg:flex-row overflow-hidden transition-colors duration-500">
      <SEO title={`${activePage} | Future Bimbel Kedinasan`} noIndex={true} />
      <Toaster position="top-center" richColors />
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center text-[13px] font-semibold py-2 px-4 animate-in slide-in-from-top-2 duration-300">
          Tidak ada koneksi internet. Periksa jaringan Anda.
        </div>
      )}
      {isAuthenticated && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activePage={activePage}
          onPageChange={handleNavigate}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[calc(1rem+56px+env(safe-area-inset-bottom,0px))] lg:pb-6 custom-scrollbar">
          {!isVerified && isAuthenticated && (
            <div className="mb-6 animate-in slide-in-from-top-2 duration-400">
              <div className="bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-400">Verifikasi email diperlukan</p>
                    <p className="text-[12px] text-amber-600/80 dark:text-amber-500/60 mt-0.5">Konfirmasi email untuk membuka akses penuh dan fitur pembelian paket.</p>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium text-[12px] rounded-lg transition-colors whitespace-nowrap shrink-0 group"
                >
                  <RefreshCcw className="w-3.5 h-3.5 group-active:rotate-180 transition-transform duration-300" />
                  Cek Status
                </button>
              </div>
            </div>
          )}
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              {renderRoutes()}
            </Suspense>
          </ErrorBoundary>
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
        onClose={() => { setIsLoginOpen(false); setForceNameModal(false); if (location.pathname === '/login' || location.pathname === '/register') navigate('/'); }}
        initialMode={authMode}
        forceNameModal={forceNameModal}
      />
      {!isAuthenticated && <FloatingWhatsApp number="087753646617" />}
    </div>
  );
}
