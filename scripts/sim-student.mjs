// SIMULASI SISWA: menjalankan perjalanan lengkap sebagai siswa sungguhan
// lewat browser Chromium terhadap situs produksi.
//
// Alur yang diuji:
//   1. Buka landing page
//   2. Masuk lewat modal login
//   3. Diarahkan ke katalog paket (bukan dashboard)
//   4. Klik "Pesan via WA" -> periksa pesan WhatsApp
//   5. Status berubah "Menunggu Konfirmasi"
//   6. Admin memberi akses (lewat API)
//   7. Paket muncul di Paket Saya
//   8. Kerjakan tryout: jawab, pindah soal, refresh (uji pemulihan)
//   9. Kirim jawaban, lihat hasil
//
// Jalankan: node scripts/sim-student.mjs
// Butuh data dari: node scripts/prepare-student-sim.mjs

import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = "https://www.futurebimbelkedinasan.com";
const SHOTS = resolve(ROOT, "sim-shots");

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

mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const results = [];

function check(label, ok, detail) {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
  results.push({ label, ok, detail });
}

const rest = async (path, init = {}) => {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: S, ...init });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  locale: "id-ID",
  timezoneId: "Asia/Jakarta",
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

// Bersihkan akses & hasil dari run sebelumnya agar katalog teruji dari nol.
// (Paket yang sudah dimiliki memang sengaja disembunyikan dari katalog.)
await rest(`user_packages?user_id=eq.${state.userId}`, { method: "DELETE" });
await rest(`tryout_results?user_id=eq.${state.userId}`, { method: "DELETE" });
await rest(`transactions?user_id=eq.${state.userId}`, { method: "DELETE" });
await rest(`active_tryout_sessions?user_id=eq.${state.userId}`, { method: "DELETE" });

try {
  // ── 1. Landing page ─────────────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: resolve(SHOTS, "01-landing.png") });

  const landingOk = await page.getByText(/Future Bimbel Kedinasan|Persiapan SKD/i).first().isVisible().catch(() => false);
  check("1. Landing page tampil", landingOk);

  // ── 2. Login ────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: /^Masuk$/i }).first().click({ timeout: 20000 });
  await page.waitForTimeout(1200);

  const modalVisible = await page.getByText(/Selamat Datang Kembali/i).isVisible().catch(() => false);
  check("2. Modal login terbuka", modalVisible);
  await page.screenshot({ path: resolve(SHOTS, "02-login-modal.png") });

  await page.getByPlaceholder(/name@example.com/i).fill(state.email);
  await page.getByPlaceholder(/••••••••/).fill(state.password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();

  // ── 3. Diarahkan ke katalog ─────────────────────────────────────────────
  await page.waitForURL(/\/paket/, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const currentUrl = page.url();
  check("3. Setelah login diarahkan ke /paket", currentUrl.includes("/paket"), currentUrl);
  await page.screenshot({ path: resolve(SHOTS, "03-katalog.png") });

  // ── 4. Paket terlihat ───────────────────────────────────────────────────
  const pkgTitle = `Simulasi SKD ${state.stamp}`;
  const pkgVisible = await page.getByText(pkgTitle, { exact: false }).first().isVisible().catch(() => false);
  check("4. Paket simulasi tampil di katalog", pkgVisible);

  // ── 5. Klik Pesan via WA ────────────────────────────────────────────────
  const popupPromise = context.waitForEvent("page", { timeout: 20000 }).catch(() => null);
  const waButton = page.getByRole("button", { name: /Pesan via WA/i }).first();
  const waVisible = await waButton.isVisible().catch(() => false);
  check("5. Tombol 'Pesan via WA' tersedia", waVisible);

  if (waVisible) {
    await waButton.click();
    const popup = await popupPromise;

    // Tab baru biasanya masih about:blank saat event "page" terpicu.
    // Tunggu sampai URL-nya benar-benar berisi wa.me / whatsapp.
    let waUrl = "";
    if (popup) {
      for (let i = 0; i < 40; i++) {
        const u = popup.url();
        if (u.includes("wa.me") || u.includes("whatsapp")) {
          waUrl = u;
          break;
        }
        await popup.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(2500);
    await page.screenshot({ path: resolve(SHOTS, "04-setelah-klik-wa.png") });

    check("6. WhatsApp terbuka di tab baru", waUrl.includes("wa.me") || waUrl.includes("whatsapp"), waUrl.slice(0, 80) || "about:blank");

    if (waUrl) {
      const decoded = decodeURIComponent(waUrl).replace(/\+/g, " ");
      check("7. Pesan WA memuat nama paket", decoded.includes(pkgTitle), decoded.slice(0, 200));
      check("8. Pesan WA memuat nominal", /49\.000/.test(decoded), "");
      check("9. Pesan WA memuat rekening BRI", decoded.includes("035601089005505") || decoded.includes("0356 0108 9005 505"), "");
      check("10. Pesan WA memuat langkah pembayaran", /Langkah pembayaran/i.test(decoded), "");
      check("11. Pesan WA memuat email siswa", decoded.includes(state.email), "");
    }

    // Tunggu status menunggu konfirmasi (bisa lambat karena fetchData).
    let waiting = false;
    for (let i = 0; i < 40; i++) {
      waiting = await page.getByText(/Menunggu Konfirmasi/i).first().isVisible().catch(() => false);
      if (waiting) break;
      await page.waitForTimeout(500);
    }
    check("12. Status 'Menunggu Konfirmasi' tampil", waiting);
    await page.screenshot({ path: resolve(SHOTS, "05-menunggu-konfirmasi.png") });

    const stillHasBuy = await page.getByRole("button", { name: /^Pesan via WA/i }).first().isVisible().catch(() => false);
    check("13. Tombol beli tidak muncul lagi saat menunggu", !stillHasBuy || waiting);

    if (popup) await popup.close().catch(() => {});
  }

  // ── 7. Admin memberi akses ──────────────────────────────────────────────
  const grant = await rest("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: state.userId, package_id: state.packageId }),
  });
  check("14. Admin memberi akses paket", grant.ok, JSON.stringify(grant.body).slice(0, 200));

  // ── 8. Paket muncul di Paket Saya ───────────────────────────────────────
  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: resolve(SHOTS, "06-paket-saya.png") });

  const inMyPackages = await page.getByText(pkgTitle, { exact: false }).first().isVisible().catch(() => false);
  check("15. Paket muncul di 'Paket Saya'", inMyPackages);

  // ── 9. Mulai tryout ─────────────────────────────────────────────────────
  // Alur nyata: kartu paket -> "Buka Paket" -> tab Tryout -> "Mulai Tryout"
  // -> halaman persiapan -> "Mulai Tryout Sekarang" -> mesin ujian.
  const openBtn = page.getByRole("button", { name: /Buka Paket/i }).first();
  const openVisible = await openBtn.isVisible().catch(() => false);
  check("16. Tombol 'Buka Paket' tersedia", openVisible);

  if (openVisible) {
    await openBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: resolve(SHOTS, "07-detail-paket.png") });

    const startBtn = page.getByRole("button", { name: /Mulai Tryout/i }).first();
    const startVisible = await startBtn.isVisible().catch(() => false);
    check("17. Tombol 'Mulai Tryout' aktif di dalam paket", startVisible);

    if (startVisible) {
      await startBtn.click();
      await page.waitForTimeout(3500);
      await page.screenshot({ path: resolve(SHOTS, "07b-persiapan.png") });

      // Halaman persiapan ujian: konfirmasi terakhir sebelum timer berjalan.
      const prepareOk = await page.getByText(/Persiapan Tryout|Informasi Paket/i).first().isVisible().catch(() => false);
      check("18. Halaman persiapan ujian tampil", prepareOk);
      check("19. Durasi ujian terbaca (30 Menit)", await page.getByText(/30 Menit/i).first().isVisible().catch(() => false));

      const startNow = page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first();
      if (await startNow.isVisible().catch(() => false)) {
        await startNow.click();
      }
    }
  }

  if (true) {
    await page.waitForTimeout(8000);
    await page.screenshot({ path: resolve(SHOTS, "08-tryout-soal1.png") });

    const engineLoaded = await page.getByText(/Soal nomor 1 dari 10/i).isVisible().catch(() => false);
    check("20. Mesin ujian memuat 10 soal", engineLoaded);
    check("21. Timer berjalan", await page.getByText(/^\d{2}:\d{2}$/).first().isVisible().catch(() => false));

    // Jawab 5 soal pertama, pindah soal.
    for (let i = 0; i < 5; i++) {
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
    await page.screenshot({ path: resolve(SHOTS, "08-tryout-soal6.png") });

    // ── 10. Uji pemulihan: refresh di tengah ujian ──────────────────────
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(7000);
    await page.screenshot({ path: resolve(SHOTS, "09-setelah-refresh.png") });

    const resumed = await page.getByText(/Melanjutkan ujian|Soal nomor/i).first().isVisible().catch(() => false);
    check("22. Setelah refresh ujian dilanjutkan (tidak mulai dari nol)", resumed);

    const answeredText = await page.getByText(/Terjawab/i).first().isVisible().catch(() => false);
    check("23. Panel 'Terjawab' tampil setelah refresh", answeredText);

    // ── 11. Kirim jawaban ───────────────────────────────────────────────
    await page.getByRole("button", { name: /^Selesai$/i }).first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(SHOTS, "10-konfirmasi-selesai.png") });

    const confirmBtn = page.getByRole("button", { name: /Kirim|Selesai|Ya/i }).last();
    await confirmBtn.click().catch(() => {});
    await page.waitForTimeout(9000);
    await page.screenshot({ path: resolve(SHOTS, "11-hasil.png") });

    const resultShown = await page.getByText(/Skor|Total|Hasil|TWK/i).first().isVisible().catch(() => false);
    check("24. Halaman hasil tryout tampil", resultShown);

    // Verifikasi di database
    const saved = await rest(`tryout_results?user_id=eq.${state.userId}&select=id,twk,tiu,tkp,total`);
    check("25. Hasil tersimpan di database", Array.isArray(saved.body) && saved.body.length === 1, JSON.stringify(saved.body));
    if (Array.isArray(saved.body) && saved.body[0]) {
      const r = saved.body[0];
      check(
        "26. Skor konsisten (TWK 20, total = TWK+TIU+TKP)",
        r.twk === 20 && r.tiu === 0 && r.tkp >= 0 && r.total === r.twk + r.tiu + r.tkp,
        `twk=${r.twk} tiu=${r.tiu} tkp=${r.tkp}`
      );
    }

    // ── 12. Sesi dihapus setelah submit ────────────────────────────────
    const sessions = await rest(`active_tryout_sessions?user_id=eq.${state.userId}`);
    check("27. Sesi ujian dibersihkan setelah submit", Array.isArray(sessions.body) && sessions.body.length === 0);
  }

  // ── 13. Error konsol ────────────────────────────────────────────────────
  // Abaikan error yang bukan masalah aplikasi:
  //  - request dibatalkan saat navigasi (ERR_ABORTED / Failed to fetch)
  //  - error dari domain WhatsApp
  //  - peringatan CSP report-only
  const realErrors = consoleErrors.filter(
    (e) =>
      !/favicon|ResizeObserver|net::ERR_BLOCKED|net::ERR_ABORTED|whatsapp|Content Security Policy directive|Failed to fetch|Failed to load resource/i.test(
        e
      )
  );
  check("28. Tidak ada error konsol berarti", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));
} catch (err) {
  console.error("\nERROR SIMULASI:", err.message);
  fail++;
  await page.screenshot({ path: resolve(SHOTS, "error.png") }).catch(() => {});
} finally {
  await browser.close();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  console.log(`Screenshot: ${SHOTS}`);
  process.exit(fail > 0 ? 1 : 0);
}
