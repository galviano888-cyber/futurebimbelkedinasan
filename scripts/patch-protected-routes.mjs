// Membungkus seluruh route terlindungi dengan requireAuth() agar menunggu
// sesi selesai dipulihkan sebelum memutuskan redirect.
//
// Jalankan: node scripts/patch-protected-routes.mjs

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const file = resolve(ROOT, "src", "App.tsx");

let c = readFileSync(file, "utf8");
copyFileSync(file, file + ".bak");

const pairs = [
  [
    `<Route path="/dashboard" element={isAuthenticated ? <DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={handleNavigate} onReview={handleHistoryReview} /> : <Navigate to="/" replace />} />`,
    `<Route path="/dashboard" element={requireAuth(<DashboardView data={data} userName={currentUser || "Siswa FBK"} onNavigate={handleNavigate} onReview={handleHistoryReview} />)} />`,
  ],
  [
    `<Route path="/paket" element={isAuthenticated ? <TryoutView isAuthenticated={isAuthenticated} onLoginClick={() => setIsLoginOpen(true)} /> : <Navigate to="/" replace />} />`,
    `<Route path="/paket" element={requireAuth(<TryoutView isAuthenticated={isAuthenticated} onLoginClick={() => setIsLoginOpen(true)} />)} />`,
  ],
  [
    `<Route path="/paket-saya" element={isAuthenticated ? <PaketSayaView onStartTryout={handleStartTryout} /> : <Navigate to="/" replace />} />`,
    `<Route path="/paket-saya" element={requireAuth(<PaketSayaView onStartTryout={handleStartTryout} />)} />`,
  ],
  [
    `<Route path="/events" element={isAuthenticated ? <EventsView /> : <Navigate to="/" replace />} />`,
    `<Route path="/events" element={requireAuth(<EventsView />)} />`,
  ],
  [
    `<Route path="/profile" element={isAuthenticated ? <ProfileView /> : <Navigate to="/" replace />} />`,
    `<Route path="/profile" element={requireAuth(<ProfileView />)} />`,
  ],
  [
    `<Route path="/settings" element={isAuthenticated ? <SettingsView /> : <Navigate to="/" replace />} />`,
    `<Route path="/settings" element={requireAuth(<SettingsView />)} />`,
  ],
  [
    `<Route path="/transactions" element={isAuthenticated ? <PaymentHistory onBack={() => navigate("/dashboard")} /> : <Navigate to="/" replace />} />`,
    `<Route path="/transactions" element={requireAuth(<PaymentHistory onBack={() => navigate("/dashboard")} />)} />`,
  ],
  [
    `<Route path="/notifikasi" element={isAuthenticated ? <NotificationsView onBack={() => navigate("/dashboard")} /> : <Navigate to="/" replace />} />`,
    `<Route path="/notifikasi" element={requireAuth(<NotificationsView onBack={() => navigate("/dashboard")} />)} />`,
  ],
  [
    `<Route path="/event-engine/:eventId" element={isAuthenticated ? <EventEngineView /> : <Navigate to="/" replace />} />`,
    `<Route path="/event-engine/:eventId" element={requireAuth(<EventEngineView />)} />`,
  ],
];

let changed = 0;
for (const [from, to] of pairs) {
  if (c.includes(from)) {
    c = c.replace(from, to);
    changed++;
  } else {
    console.log("TIDAK COCOK:", from.slice(0, 70));
  }
}

// Route tryout-engine: pakai requireAuth untuk cek login, tetap pertahankan
// fallback ke /paket-saya bila id tryout hilang.
const oldTryout = `        <Route path="/tryout-engine" element={
          loading
            ? <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center"><FBKLoader /></div>
            : !isAuthenticated
              ? <Navigate to="/" replace />
              : activePackageId && questionsId
                ? <TryoutEngineView packageId={activePackageId} questionsId={questionsId} onFinish={handleTryoutComplete} onExit={() => navigate("/dashboard")} />
                : <Navigate to="/paket-saya" replace />
        } />`;

const newTryout = `        <Route path="/tryout-engine" element={requireAuth(
          activePackageId && questionsId
            ? <TryoutEngineView packageId={activePackageId} questionsId={questionsId} onFinish={handleTryoutComplete} onExit={() => navigate("/dashboard")} />
            : <Navigate to="/paket-saya" replace />
        )} />`;

if (c.includes(oldTryout)) {
  c = c.replace(oldTryout, newTryout);
  changed++;
} else {
  console.log("TIDAK COCOK: blok tryout-engine");
}

writeFileSync(file, c, "utf8");
console.log(`Route diperbarui: ${changed}`);
