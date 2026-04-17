import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Header } from "@/components/Header";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TryoutView } from "@/components/views/TryoutView";
import { PaketSayaView } from "@/components/views/PaketSayaView";
import { EmptyView } from "@/components/views/EmptyView";
import { LandingPageView } from "@/components/views/LandingPageView";
import { ContactView } from "@/components/views/ContactView";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord } from "@/types";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || null);
      if (session) setShowLanding(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || null);
      if (session) {
        setShowLanding(false);
      } else {
        setData([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          if (!supabase) {
            throw new Error("Supabase client not configured — missing env vars");
          }

          const fetchPromise = supabase
            .from("tryout_results")
            .select("id, date, package_name, twk, tiu, tkp, total")
            .order("date", { ascending: true });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 8000)
          );

          const { data: supabaseData, error } = await Promise.race([
            fetchPromise,
            timeoutPromise,
          ]);

          if (error || !supabaseData || supabaseData.length === 0) {
            throw new Error("No data from Supabase");
          }

          const normalized: TryoutRecord[] = supabaseData.map((row) => ({
            id: String(row.id),
            date: row.date,
            packageName: row.package_name,
            twk: row.twk,
            tiu: row.tiu,
            tkp: row.tkp,
            total: row.total,
          }));

          setData(normalized);
        } catch {
          setData([]);
          toast.warning("Mode Simulasi: Gagal terhubung ke database.", {
            description: "Data ditampilkan menggunakan contoh kosong.",
            duration: 5000,
          });
        } finally {
          setLoading(false);
        }
      };

      setLoading(true);
      fetchData();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const renderView = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} />;
      case "Paket dan Tryout SKD":
        return <TryoutView />;
      case "Paket Saya":
        return <PaketSayaView />;
      case "Jadwal Ujian":
        return <EmptyView title="Jadwal Ujian" />;
      case "Pusat Bantuan":
        return <ContactView />;
      case "Pengaturan":
        return <EmptyView title="Pengaturan" />;
      default:
        return <DashboardView data={data} userName={currentUser || "Siswa FBK"} />;
    }
  };

  return (
    <>
      <Toaster
        theme="light"
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
          },
        }}
      />

      {showLanding ? (
        <LandingPageView onEnter={() => setShowLanding(false)} />
      ) : (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activePage={activePage}
            onPageChange={setActivePage}
            currentUser={currentUser || "Siswa FBK"}
          />

          <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
            <Header 
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
              currentUser={currentUser || "Siswa FBK"}
              isAuthenticated={isAuthenticated}
            />
            <main className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-screen-2xl mx-auto">
                {renderView()}
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
