// Reproduksi & verifikasi: pengguna login Google yang refresh di tengah tryout.
//
// Bug lama: handleGoogleCallback() memakai `location` dari closure yang basi
// (path saat pertama render = "/"), sehingga setiap SIGNED_IN — termasuk saat
// refresh — mengalihkan siswa ke /paket.
//
// Jalankan: node scripts/verify-google-refresh.mjs

import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = "https://www.futurebimbelkedinasan.com";
const SHOTS = resolve(ROOT, "sim-shots");
mkdirSync(SHOTS, { recursive: true });

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);
const state = JSON.parse(readFileSync(resolve(ROOT, ".sim-state.json"), "utf8"));
const url = env.VITE_SUPABASE_URL;
const service = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };

let pass = 0;
let fail = 0;
const check = (label, ok, detail) => {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
};

// Tandai akun uji sebagai pengguna Google.
const upd = await fetch(`${url}/auth/v1/admin/users/${state.userId}`, {
  method: "PUT",
  headers: S,
  body: JSON.stringify({
    app_metadata: { provider: "google", providers: ["google"] },
  }),
});
console.log("tandai sebagai Google user:", upd.status);

// Beri akses paket.
await fetch(`${url}/rest/v1/user_packages`, {
  method: "POST",
  headers: { ...S, Prefer: "return=minimal" },
  body: JSON.stringify({ user_id: state.userId, package_id: state.packageId }),
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "id-ID" });
const page = await context.newPage();

const nav = [];
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) nav.push(f.url().replace(BASE, ""));
});

try {
  // Login
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /^Masuk$/i }).first().click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/name@example.com/i).fill(state.email);
  await page.getByPlaceholder(/••••••••/).fill(state.password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();
  await page.waitForTimeout(8000);
  console.log("Setelah login:", page.url().replace(BASE, ""));
  check("login diarahkan ke /paket", page.url().includes("/paket"), page.url().replace(BASE, ""));

  // Masuk tryout
  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  const openBtn = page.getByRole("button", { name: /Buka Paket/i }).first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await page.waitForTimeout(2500);
  }
  const startBtn = page.getByRole("button", { name: /Mulai Tryout/i }).first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(2500);
  const startNow = page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first();
  if (await startNow.isVisible().catch(() => false)) await startNow.click();
  await page.waitForTimeout(8000);

  const before = page.url();
  console.log("Sebelum refresh:", before.replace(BASE, ""));
  check("masuk ke halaman ujian", before.includes("/tryout-engine"), before.replace(BASE, ""));

  // Jawab satu soal
  const optA = page.getByText(/^Pilihan A$/i).first();
  if (await optA.isVisible().catch(() => false)) await optA.click();
  await page.waitForTimeout(3000);

  // ── REFRESH ─────────────────────────────────────────────────────────────
  nav.length = 0;
  console.log("\n>>> REFRESH di tengah ujian");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(14000);

  const after = page.url();
  console.log("Sesudah refresh:", after.replace(BASE, ""));
  console.log("Navigasi:", nav.join(" -> "));
  await page.screenshot({ path: resolve(SHOTS, "google-refresh.png") });

  check("setelah refresh TETAP di tryout", after.includes("/tryout-engine"), after.replace(BASE, ""));
  check("tidak terlempar ke /paket", !after.endsWith("/paket"), after.replace(BASE, ""));

  const bodyText = await page.locator("body").innerText().catch(() => "");
  check("soal ujian tampil", /Soal nomor/i.test(bodyText), bodyText.slice(0, 120).replace(/\n/g, " "));
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  // Kembalikan metadata akun uji
  await fetch(`${url}/auth/v1/admin/users/${state.userId}`, {
    method: "PUT",
    headers: S,
    body: JSON.stringify({ app_metadata: { provider: "email", providers: ["email"] } }),
  });
  await browser.close();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
