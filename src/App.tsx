import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Header } from "@/components/Header";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { LoginScreen } from "@/components/LoginScreen";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TryoutView } from "@/components/views/TryoutView";
import { MateriView } from "@/components/views/MateriView";
import { EmptyView } from "@/components/views/EmptyView";
import { supabase } from "@/lib/supabaseClient";
import type { TryoutRecord } from "@/types";

const EMPTY_DATA: TryoutRecord[] = [];

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [data, setData] = useState<TryoutRecord[]>([]);
  const [loading, setLoading] = useState(false);

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
          setData(EMPTY_DATA);
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

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setCurrentUser(email);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActivePage("Dashboard");
    setData([]);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  const renderView = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardView data={data} />;
      case "Tryout SKD":
        return <TryoutView />;
      case "Materi Belajar":
        return <MateriView />;
      case "Jadwal Ujian":
        return <EmptyView title="Jadwal Ujian" />;
      case "Pembahasan Soal":
        return <EmptyView title="Pembahasan Soal" />;
      case "Peringkat":
        return <EmptyView title="Peringkat" />;
      case "Pengaturan":
        return <EmptyView title="Pengaturan" />;
      default:
        return <DashboardView data={data} />;
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
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            currentUser={currentUser || "Siswa FBK"}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-screen-2xl mx-auto">
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
