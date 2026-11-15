// Diagnostik: apakah to_idx_ benar-benar tertulis di localStorage sebelum refresh?
//
// Jalankan: node scripts/diag-idx-storage.mjs

import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = process.env.SIM_BASE || "https://www.futurebimbelkedinasan.com";
mkdirSync(resolve(ROOT, "sim-shots"), { recursive: true });

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);
const url = env.VITE_SUPABASE_URL;
const service = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const PACKAGE_ID = "1171baaf-5d08-4755-8677-9966626320a9";

const stamp = Date.now();
const email = `diag.${stamp}@fbk-diag.dev`;
const password = `Di!${stamp}Aa`;

const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: S,
  body: JSON.stringify({ email, password, email_confirm: true }),
});
const u = await created.json();
const userId = u.id ?? u.user?.id;

await fetch(`${url}/rest/v1/user_packages`, {
  method: "POST",
  headers: { ...S, Prefer: "return=minimal" },
  body: JSON.stringify({ user_id: userId, package_id: PACKAGE_ID }),
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "id-ID" });
const page = await context.newPage();

try {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /^Masuk$/i }).first().click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/name@example.com/i).fill(email);
  await page.getByPlaceholder(/••••••••/).fill(password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();
  await page.waitForTimeout(8000);

  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: /Buka Paket/i }).first().click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Mulai Tryout/i }).first().click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first().click().catch(() => {});
  await page.waitForTimeout(9000);

  // Lompat ke soal 50
  await page.getByRole("button", { name: /^50$/ }).first().click();
  await page.waitForTimeout(1500);

  const before = await page.evaluate(() => {
    const out = {};
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("to_")) out[k] = localStorage.getItem(k);
    }
    return out;
  });
  console.log("localStorage sebelum refresh:");
  for (const [k, v] of Object.entries(before)) {
    console.log(`  ${k} = ${String(v).slice(0, 70)}`);
  }

  const body = await page.locator("body").innerText().catch(() => "");
  console.log("\nposisi sebelum refresh:", (body.match(/Soal nomor \d+ dari \d+/) || ["?"])[0]);

  // Cek server
  const sess = await fetch(
    `${url}/rest/v1/active_tryout_sessions?user_id=eq.${userId}&select=current_idx`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  ).then((r) => r.json());
  console.log("server current_idx:", sess[0]?.current_idx);

  // Refresh
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(14000);
  const body2 = await page.locator("body").innerText().catch(() => "");
  console.log("posisi setelah refresh:", (body2.match(/Soal nomor \d+ dari \d+/) || ["?"])[0]);

  const after = await page.evaluate(() => {
    const out = {};
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("to_")) out[k] = localStorage.getItem(k);
    }
    return out;
  });
  console.log("\nlocalStorage setelah refresh:");
  for (const [k, v] of Object.entries(after)) {
    console.log(`  ${k} = ${String(v).slice(0, 70)}`);
  }
} catch (err) {
  console.error("ERROR:", err.message);
} finally {
  await browser.close();
  for (const t of ["user_packages", "tryout_results", "active_tryout_sessions"]) {
    await fetch(`${url}/rest/v1/${t}?user_id=eq.${userId}`, { method: "DELETE", headers: S });
  }
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}
