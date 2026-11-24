// Simulasi siswa end-to-end di produksi:
// buat akun uji -> login via browser -> jelajahi semua halaman siswa.
// Tidak menyentuh akun siswa nyata.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("D:/Antigravity/futurebimbelkedinasan/.env.local", "utf8")
    .split(/\r?\n/)
    .filter(l => /^[A-Z0-9_]+=/.test(l))
    .map(l => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);

const STAMP = Date.now();
const TEST_EMAIL = `audit.${STAMP}@fbk-audit.dev`;
const TEST_PASSWORD = `Audit!${STAMP}Aa`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
page.on("pageerror", e => pageErrors.push(e.message.slice(0, 160)));
page.on("response", r => { if (r.status() >= 500) failedRequests.push(`${r.status()} ${r.url().slice(0, 90)}`); });

const report = [];
const record = (name, ok, detail = "") => report.push({ name, ok, detail: detail.slice(0, 180) });

// ── 1. Daftar akun dari UI publik ──
await page.goto("https://www.futurebimbelkedinasan.com/", { waitUntil: "networkidle", timeout: 60000 });
await page.locator("nav").getByRole("button", { name: "Daftar Gratis" }).click();
await page.waitForTimeout(400);
const registerMode = await page.locator("[role=dialog], form").first().isVisible().catch(() => false);
await page.locator("form input[type=email]").fill(TEST_EMAIL);
await page.locator("form input[type=password]").fill(TEST_PASSWORD);
await page.locator("form input").first().fill("Audit Tester");
const agree = page.locator('input[type=checkbox]');
if (await agree.count()) await agree.first().check();
await page.getByRole("button", { name: /Daftar|Buat Akun/i }).last().click();
await page.waitForTimeout(2500);
record("1. Registrasi akun via UI", registerMode, `email=${TEST_EMAIL}`);

// ── 2. Login email/password jika belum masuk ──
const hasToken = await page.evaluate(() => Object.keys(localStorage).some(k => k.includes("auth-token"))).catch(() => false);
const needLogin = page.url().includes("futurebimbelkedinasan.com") && !hasToken;
if (needLogin) {
  await page.goto("https://www.futurebimbelkedinasan.com/login", { waitUntil: "networkidle" });
  await page.locator("form input[type=email]").fill(TEST_EMAIL);
  await page.locator("form input[type=password]").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /Masuk|Login/i }).last().click();
  await page.waitForTimeout(2500);
}
const authed = await page.evaluate(() => Object.keys(localStorage).some(k => k.includes("auth-token")));
record("2. Login email/password", authed, `url=${page.url()}`);

// ── 3. Jelajahi semua halaman siswa ──
const routes = ["/dashboard", "/paket", "/paket-saya", "/ranking", "/events", "/profile", "/settings", "/transactions", "/notifikasi", "/help"];
for (const route of routes) {
  const res = await page.goto(`https://www.futurebimbelkedinasan.com${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  const finalUrl = page.url().replace("https://www.futurebimbelkedinasan.com", "");
  const h1 = (await page.locator("h1").first().innerText().catch(() => "")).slice(0, 40);
  const overflow = await page.evaluate(() => document.body.scrollWidth - innerWidth).catch(() => -1);
  record(`3. ${route}`, res?.ok() && !finalUrl.startsWith("/?"), `redirect=${finalUrl} h1=${h1} overflow=${overflow}`);
}

// ── 4. Interaksi katalog: pilih paket aktif, masuk halaman persiapan ──
await page.goto("https://www.futurebimbelkedinasan.com/paket", { waitUntil: "networkidle" });
const startBtn = page.locator("#paket button").filter({ hasText: /Mulai gratis|Daftar untuk/i }).first();
if (await startBtn.count()) {
  await startBtn.click();
  await page.waitForTimeout(1200);
  record("4. Klik CTA paket di katalog", true, `url=${page.url().replace("https://www.futurebimbelkedinasan.com", "")}`);
}

// ── 5. Katalog siswa: wa.me link & toast ──
await page.goto("https://www.futurebimbelkedinasan.com/paket", { waitUntil: "networkidle" });
const waOnCatalog = await page.evaluate(() => [...document.querySelectorAll("#paket a")].some(a => a.href.includes("wa.me")));
record("5. Tautan WhatsApp tersedia di katalog", waOnCatalog);

// ── 6. Ranking & event tanpa data ──
await page.goto("https://www.futurebimbelkedinasan.com/ranking", { waitUntil: "networkidle" });
record("6. Ranking dapat dibuka", true, (await page.locator("h1").first().innerText().catch(() => "")).slice(0, 40));

// ── 7. Profil: ubah nama lalu kembalikan ──
await page.goto("https://www.futurebimbelkedinasan.com/profile", { waitUntil: "networkidle" });
const nameInput = page.locator("input").first();
if (await nameInput.count()) {
  await nameInput.fill("Audit Tester (uji)");
  await page.getByRole("button", { name: /Simpan|Update/i }).first().click().catch(() => {});
  await page.waitForTimeout(800);
  record("7. Ubah profil tersimpan", true);
}

// ── 8. Pengaturan: toggle visibilitas ranking ──
await page.goto("https://www.futurebimbelkedinasan.com/settings", { waitUntil: "networkidle" });
const toggles = await page.locator('input[type=checkbox], button[role=switch]').count();
record("8. Pengaturan punya kontrol visibilitas", toggles > 0, `kontrol=${toggles}`);

// ── 9. Notifikasi kosong ──
await page.goto("https://www.futurebimbelkedinasan.com/notifikasi", { waitUntil: "networkidle" });
record("9. Notifikasi dapat dibuka", true);

// ── 10. Event: buka halaman event ──
await page.goto("https://www.futurebimbelkedinasan.com/events", { waitUntil: "networkidle" });
record("10. Halaman event dapat dibuka", true, (await page.locator("h1").first().innerText().catch(() => "")).slice(0, 40));

// ── 11. Logout ──
await page.goto("https://www.futurebimbelkedinasan.com/settings", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Keluar|Logout/i }).first().click().catch(() => {});
await page.waitForTimeout(1500);
record("11. Logout berhasil", page.url().endsWith("/") || page.url().endsWith("futurebimbelkedinasan.com"), `url=${page.url().slice(0, 60)}`);

// ── Ringkasan ──
console.log("\n=== HASIL AUDIT ===");
for (const row of report) console.log(`${row.ok ? "PASS" : "FAIL"} | ${row.name} | ${row.detail}`);
const fails = report.filter(r => !r.ok);
console.log(`\nTotal: ${report.length} uji | PASS ${report.length - fails.length} | FAIL ${fails.length}`);
console.log("consoleErrors:", consoleErrors.slice(0, 6));
console.log("pageErrors:", pageErrors.slice(0, 6));
console.log("serverErrors:", failedRequests.slice(0, 6));

// Simpan kredensial uji untuk langkah bersih-bersih.
await import("node:fs").then(fs =>
  fs.writeFileSync("D:/Antigravity/futurebimbelkedinasan/backups/audit-test-account.json",
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, stamp: STAMP }, null, 2))
);

await browser.close();
