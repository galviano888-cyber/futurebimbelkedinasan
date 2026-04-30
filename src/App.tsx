import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
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
          description: "Akun kamu sudah aktif, Bro! Silakan masuk untuk mulai persiapan kedinasan.",
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

  const renderRoutes = () => {
    if (loading) return <DashboardSkeleton />;

    return (
      <Routes>
        {/* Landing/Auth */}
        <Route path="/" element={!isAuthenticated ? <LandingPageView onEnter={() => setIsLoginOpen(true)} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        
        {/* Admin */}
        <Route path="/admin-panel" element={<AdminPanelView />} />

        {/* User Protected Routes */}
        <Route path="/dashboard" element={isAuthenticated ? <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={(p) => navigate(`/${p.toLowerCase().replace(/ /g, '-')}`)} onViewInvoice={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} onReview={handleHistoryReview} /> : <Navigate to="/" replace />} />
        <Route path="/paket" element={isAuthenticated ? <TryoutView isAuthenticated={isAuthenticated} onPurchaseSuccess={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} onLoginClick={() => setIsLoginOpen(true)} /> : <Navigate to="/" replace />} />
        <Route path="/paket-saya" element={isAuthenticated ? <PaketSayaView onStartTryout={handleStartTryout} /> : <Navigate to="/" replace />} />
        <Route path="/ranking" element={<LeaderboardView onLoginClick={() => setIsLoginOpen(true)} />} />
        <Route path="/profile" element={isAuthenticated ? <ProfileView /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsView /> : <Navigate to="/" replace />} />
        <Route path="/transactions" element={isAuthenticated ? <PaymentHistory onBack={() => navigate("/dashboard")} onViewInvoice={(txId) => { setSelectedTransactionId(txId); navigate('/invoice'); }} /> : <Navigate to="/" replace />} />
        <Route path="/help" element={<ContactView />} />
        <Route path="/invoice" element={selectedTransactionId ? <InvoiceView transactionId={selectedTransactionId} onBack={() => navigate("/paket")} /> : <Navigate to="/dashboard" replace />} />
        
        {/* Tryout Engine Routes */}
        <Route path="/tryout-pre/:pId/:qId" element={<TryoutPreView packageId={activePackageId} questionsId={questionsId} onStart={() => navigate("/tryout-engine")} onCancel={() => navigate("/paket-saya")} />} />
        <Route path="/tryout-engine" element={activePackageId && questionsId ? <TryoutEngineView packageId={activePackageId} questionsId={questionsId} onFinish={handleTryoutComplete} onExit={() => navigate("/dashboard")} /> : <Navigate to="/dashboard" replace />} />
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
          onClose={() => setIsLoginOpen(false)}
        />
        <FloatingWhatsApp number="087753646617" />
      </>
    );
  }

  // Define full-screen pages based on pathname
  const isFullScreenPage = location.pathname.startsWith('/tryout') || 
                           location.pathname === '/admin-panel' || 
                           location.pathname === '/reset-password';

  if (isFullScreenPage) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
        <SEO title={`${activePage} | Future Bimbel`} />
        <Toaster position="top-center" richColors />
        <main className="h-full overflow-y-auto transform-gpu">
          <Suspense fallback={<DashboardSkeleton />}>
            {renderRoutes()}
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden transition-colors duration-500">
      <SEO title={`${activePage} | Future Bimbel`} />
      <Toaster position="top-center" richColors />
      {isAuthenticated && (
        <Sidebar
          isOpen={false}
          onClose={() => { }}
          activePage={activePage}
          onPageChange={(p) => {
            const pageMap: Record<string, string> = {
              'Dashboard': '/dashboard',
              'Paket dan Tryout SKD': '/paket',
              'Paket Saya': '/paket-saya',
              'Ranking Nasional': '/ranking',
              'Events': '/events',
              'Profil Saya': '/profile',
              'Pengaturan': '/settings',
              'Riwayat Transaksi': '/transactions',
              'Pusat Bantuan': '/help'
            };
            if (pageMap[p]) navigate(pageMap[p]);
            setActivePage(p);
          }}
        />
      )}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {isAuthenticated && (
          <Header
            onMenuToggle={() => { }}
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            profile={profile}
            onNavigate={(p) => {
              const pageMap: Record<string, string> = {
                'Dashboard': '/dashboard',
                'Paket dan Tryout SKD': '/paket',
                'Paket Saya': '/paket-saya',
                'Riwayat Transaksi': '/transactions',
                'Profil Saya': '/profile'
              };
              if (pageMap[p]) navigate(pageMap[p]);
              setActivePage(p);
            }}
            isLoginOpen={isLoginOpen}
            setIsLoginOpen={setIsLoginOpen}
          />
        )}
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
            {renderRoutes()}
          </Suspense>
        </main>
      </div>
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
      {!isAuthenticated && <FloatingWhatsApp number="087753646617" />}
    </div>
  );
}
