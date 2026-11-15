// Verifikasi pengalihan setelah login: siswa harus mendarat di /paket,
// bukan /dashboard.
//
// Menguji dua jalur masuk: dari landing page dan dari /dashboard langsung
// (mis. siswa yang mengetik URL dashboard lalu login).
//
// Jalankan: node scripts/verify-login-redirect.mjs

import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = "https://www.futurebimbelkedinasan.com";
const SHOTS = resolve(ROOT, "sim-shots");
mkdirSync(SHOTS, { recursive: true });

const state = JSON.parse(readFileSync(resolve(ROOT, ".sim-state.json"), "utf8"));

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

const browser = await chromium.launch();

async function loginFrom(startPath, label) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "id-ID" });
  const page = await context.newPage();

  await page.goto(`${BASE}${startPath}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);

  // Buka modal login
  const masuk = page.getByRole("button", { name: /^Masuk$/i }).first();
  if (await masuk.isVisible().catch(() => false)) {
    await masuk.click();
    await page.waitForTimeout(1500);
  }

  await page.getByPlaceholder(/name@example.com/i).fill(state.email);
  await page.getByPlaceholder(/••••••••/).fill(state.password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();

  // Tunggu redirected
  await page.waitForTimeout(9000);
  const url = page.url();
  console.log(`\n[${label}] mulai dari ${startPath} -> ${url.replace(BASE, "")}`);
  await page.screenshot({ path: resolve(SHOTS, `redirect-${label}.png`) });

  check(`${label}: mendarat di /paket`, url.includes("/paket"), url.replace(BASE, ""));
  check(`${label}: bukan /dashboard`, !url.includes("/dashboard"), url.replace(BASE, ""));

  // Pastikan katalog benar-benar tampil
  const katalog = await page.getByText(/Katalog Paket/i).first().isVisible().catch(() => false);
  check(`${label}: katalog paket tampil`, katalog);

  await context.close();
}

try {
  await loginFrom("/", "dari-landing");
  await loginFrom("/dashboard", "dari-dashboard");
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await browser.close();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
