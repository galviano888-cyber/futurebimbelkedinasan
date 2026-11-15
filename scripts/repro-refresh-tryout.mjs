// Reproduksi: refresh saat berada di halaman tryout.
// Memeriksa apakah siswa tetap di tryout atau dilempar ke katalog.
//
// Jalankan: node scripts/repro-refresh-tryout.mjs

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

// Beri akses paket agar tombol tryout aktif
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

// Masuk ke tryout
await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);

const openBtn = page.getByRole("button", { name: /Buka Paket/i }).first();
if (await openBtn.isVisible().catch(() => false)) {
  await openBtn.click();
  await page.waitForTimeout(2500);
}
const startBtn = page.getByRole("button", { name: /Mulai Tryout/i }).first();
if (await startBtn.isVisible().catch(() => false)) {
  await startBtn.click();
  await page.waitForTimeout(2500);
}
const startNow = page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first();
if (await startNow.isVisible().catch(() => false)) {
  await startNow.click();
}
await page.waitForTimeout(8000);

const urlBefore = page.url();
console.log("URL sebelum refresh:", urlBefore.replace(BASE, ""));
await page.screenshot({ path: resolve(SHOTS, "refresh-1-sebelum.png") });

// Jawab 2 soal agar ada progres tersimpan
for (let i = 0; i < 2; i++) {
  const optA = page.getByText(/^Pilihan A$/i).first();
  if (await optA.isVisible().catch(() => false)) {
    await optA.click();
    await page.waitForTimeout(400);
  }
  const next = page.getByRole("button", { name: /^Berikutnya$|^Selanjutnya$/i }).first();
  if (await next.isVisible().catch(() => false)) {
    await next.click();
    await page.waitForTimeout(600);
  }
}
await page.waitForTimeout(3000);

// ── REFRESH ────────────────────────────────────────────────────────────────
nav.length = 0;
console.log("\n>>> REFRESH halaman");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(12000);

const urlAfter = page.url();
console.log("URL setelah refresh:", urlAfter.replace(BASE, ""));
console.log("Navigasi:", nav.join(" -> "));
await page.screenshot({ path: resolve(SHOTS, "refresh-2-sesudah.png") });

const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 400);
console.log("\n--- teks halaman ---");
console.log(bodyText.replace(/\n+/g, " | "));

await browser.close();
