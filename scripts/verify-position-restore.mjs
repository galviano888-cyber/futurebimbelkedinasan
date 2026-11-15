// Uji terfokus: apakah posisi soal dipulihkan setelah refresh?
//
// Dugaan: kegagalan sebelumnya karena autosave punya debounce 2500ms,
// sedangkan uji hanya menunggu 1500ms. Uji ini menunggu cukup lama.
//
// Jalankan: node scripts/verify-position-restore.mjs

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
const url = env.VITE_SUPABASE_URL;
const service = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const PACKAGE_ID = "1171baaf-5d08-4755-8677-9966626320a9";

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

const stamp = Date.now();
const email = `pos.${stamp}@fbk-pos.dev`;
const password = `Pos!${stamp}Aa`;

const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: S,
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Uji Posisi" } }),
});
const createdUser = await created.json();
const userId = createdUser.id ?? createdUser.user?.id;

await fetch(`${url}/rest/v1/user_packages`, {
  method: "POST",
  headers: { ...S, Prefer: "return=minimal" },
  body: JSON.stringify({ user_id: userId, package_id: PACKAGE_ID }),
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "id-ID" });
const page = await context.newPage();

try {
  // Login
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /^Masuk$/i }).first().click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/name@example.com/i).fill(email);
  await page.getByPlaceholder(/••••••••/).fill(password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();
  await page.waitForURL(/\/paket/, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Masuk tryout
  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: /Buka Paket/i }).first().click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Mulai Tryout/i }).first().click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first().click().catch(() => {});
  await page.waitForTimeout(9000);

  const body1 = await page.locator("body").innerText().catch(() => "");
  check("masuk ke soal 1", /Soal nomor 1 dari 110/i.test(body1), body1.slice(0, 60).replace(/\n/g, " "));

  // Jawab soal 1 dengan benar: klik opsi pertama di daftar opsi.
  // Opsi asli berbentuk tombol berisi huruf A-E + teks panjang.
  const answered = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const target = buttons.find((b) => {
      const t = b.textContent?.trim() || "";
      return /^A\s*\S/.test(t) && t.length > 30;
    });
    if (target) {
      target.click();
      return target.textContent?.slice(0, 60) || "clicked";
    }
    return null;
  });
  console.log("klik opsi:", answered ? answered.slice(0, 50) : "TIDAK DITEMUKAN");
  await page.waitForTimeout(1200);

  const afterAnswer = await page.locator("body").innerText().catch(() => "");
  check("jawaban tercatat", /Terjawab\s*1\/110/i.test(afterAnswer.replace(/\s+/g, " ")), afterAnswer.slice(0, 60).replace(/\n/g, " "));

  // Lompat ke soal 50
  await page.getByRole("button", { name: /^50$/ }).first().click();
  await page.waitForTimeout(1200);
  const body50 = await page.locator("body").innerText().catch(() => "");
  check("lompat ke soal 50", /Soal nomor 50 dari 110/i.test(body50), body50.slice(0, 60).replace(/\n/g, " "));

  // Tunggu autosave (debounce 2500ms) + margin
  console.log("menunggu autosave 6 detik...");
  await page.waitForTimeout(6000);

  // Periksa apakah server menyimpan current_idx = 49
  const sess = await fetch(
    `${url}/rest/v1/active_tryout_sessions?user_id=eq.${userId}&select=current_idx,answers`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  ).then((r) => r.json());
  console.log("sesi di server:", JSON.stringify(sess));
  check("server menyimpan posisi soal 49", sess[0]?.current_idx === 49, `current_idx=${sess[0]?.current_idx}`);

  // Refresh
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(14000);
  await page.screenshot({ path: resolve(SHOTS, "pos-restore.png") });

  const bodyAfter = await page.locator("body").innerText().catch(() => "");
  check("setelah refresh tetap di soal 50", /Soal nomor 50 dari 110/i.test(bodyAfter), bodyAfter.slice(0, 70).replace(/\n/g, " "));
  check("jawaban tetap tercatat", /Terjawab\s*1\/110/i.test(bodyAfter.replace(/\s+/g, " ")), bodyAfter.slice(0, 60).replace(/\n/g, " "));
} catch (err) {
  console.error("ERROR:", err.message);
  fail++;
} finally {
  await browser.close();
  for (const t of ["user_packages", "tryout_results", "active_tryout_sessions"]) {
    await fetch(`${url}/rest/v1/${t}?user_id=eq.${userId}`, { method: "DELETE", headers: S });
  }
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
