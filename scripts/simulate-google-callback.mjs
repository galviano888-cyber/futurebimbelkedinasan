// Simulasi alur Google OAuth callback tanpa akun nyata.
//
// getSession dan onAuthStateChange dipantau. Saat SIGNED_IN dikirim (dipicu
// manual), skrip mengukur waktu sampai navigasi ke /paket dan mencatat
// error console. Query jaringan ke Supabase tetap berjalan seperti asli,
// tetapi profil uji memakai ID yang tidak ada sehingga tidak menyentuh
// data siswa mana pun.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(err.message.slice(0, 160)));
const network = [];
page.on("response", (res) => {
  if (res.url().includes("/rest/v1/") && res.status() >= 400) {
    network.push({ url: res.url().split("?")[0], status: res.status() });
  }
});

await page.goto("http://127.0.0.1:4229/?google_callback=true", { waitUntil: "domcontentloaded" });

// Ukur waktu sampai aplikasi siap (spinner hilang) dengan sesi kosong.
const t0 = Date.now();
await page.waitForFunction(() => !document.querySelector(".animate-spin"), null, { timeout: 20000 }).catch(() => {});
const readyMs = Date.now() - t0;

const state = await page.evaluate(() => ({
  path: location.pathname,
  hasParams: location.search.includes("google_callback"),
  spinners: document.querySelectorAll(".animate-spin").length,
}));

console.log(JSON.stringify({ readyMs, state, network, consoleErrors }, null, 2));
await browser.close();
