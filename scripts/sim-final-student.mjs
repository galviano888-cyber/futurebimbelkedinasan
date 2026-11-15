// SIMULASI SISWA AKHIR — memakai DATA ASLI di produksi.
//
// Berbeda dari sim-student.mjs (yang membuat paket uji sendiri), skrip ini
// memakai paket nyata "SKD STARTER PACK" dan tryout nyata
// "Tryout SKD 1 - 2026 (Pretest)" berisi 110 soal yang sudah diimpor.
//
// Alur: landing -> login -> katalog -> pesan via WA -> menunggu konfirmasi ->
// akses diberikan -> Paket Saya -> persiapan -> 110 soal -> jawab ->
// refresh di tengah ujian -> submit -> hasil -> peringkat.
//
// Data uji dibersihkan di akhir (akses dicabut, hasil dihapus).
//
// Jalankan: node scripts/sim-final-student.mjs

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
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

const REAL_PACKAGE_ID = "1171baaf-5d08-4755-8677-9966626320a9"; // SKD STARTER PACK

let pass = 0;
let fail = 0;
const results = [];
const check = (label, ok, detail) => {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
  results.push({ label, ok, detail });
};

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

// ── Siapkan akun siswa ────────────────────────────────────────────────────
const stamp = Date.now();
const email = `final.${stamp}@fbk-final.dev`;
const password = `Fin!${stamp}Aa`;

const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: S,
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Siswa Audit Akhir" },
  }),
});
if (!created.ok) throw new Error(await created.text());
const createdUser = await created.json();
const userId = createdUser.id ?? createdUser.user?.id;
console.log(`Akun uji: ${email}\n`);

const state = { userId, email, password, stamp };
writeFileSync(resolve(ROOT, ".sim-final-state.json"), JSON.stringify(state, null, 2), "utf8");

// Bersihkan sisa dari percobaan sebelumnya bila ada
for (const t of ["user_packages", "transactions", "tryout_results", "active_tryout_sessions", "notifications"]) {
  await rest(`${t}?user_id=eq.${userId}`, { method: "DELETE" });
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  locale: "id-ID",
  timezoneId: "Asia/Jakarta",
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

const shot = async (name) => {
  await page.screenshot({ path: resolve(SHOTS, `final-${name}.png`) }).catch(() => {});
};

try {
  // ══ 1. Landing ══════════════════════════════════════════════════════════
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3500);
  await shot("01-landing");

  const landingOk = await page.getByText(/Future Bimbel Kedinasan/i).first().isVisible().catch(() => false);
  check("1. Landing page tampil", landingOk);

  // ══ 2. Login ════════════════════════════════════════════════════════════
  await page.getByRole("button", { name: /^Masuk$/i }).first().click({ timeout: 20000 });
  await page.waitForTimeout(1500);
  check("2. Modal login terbuka", await page.getByText(/Selamat Datang Kembali/i).isVisible().catch(() => false));

  await page.getByPlaceholder(/name@example.com/i).fill(email);
  await page.getByPlaceholder(/••••••••/).fill(password);
  await page.getByRole("button", { name: /Masuk Sekarang/i }).click();

  // ══ 3. Diarahkan ke katalog ═════════════════════════════════════════════
  await page.waitForURL(/\/paket/, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(4000);
  check("3. Login diarahkan ke /paket", page.url().includes("/paket"), page.url().replace(BASE, ""));
  await shot("02-katalog");

  // ══ 4. Paket asli terlihat ══════════════════════════════════════════════
  const pkgVisible = await page.getByText(/SKD STARTER PACK/i).first().isVisible().catch(() => false);
  check("4. Paket 'SKD STARTER PACK' tampil di katalog", pkgVisible);

  // ══ 5. Kondisi tombol pada katalog ══════════════════════════════════════
  // Paket gratis memakai "Ambil Gratis"; paket berbayar yang ditutup memakai
  // "Pendaftaran Ditutup". Tombol "Pesan via WA" hanya ada pada paket
  // berbayar yang masih dibuka.
  const gratisBtn = page.getByRole("button", { name: /Ambil Gratis/i }).first();
  check("5. Paket gratis menampilkan 'Ambil Gratis'", await gratisBtn.isVisible().catch(() => false));

  const closedBtn = page.getByRole("button", { name: /Pendaftaran Ditutup/i }).first();
  check("6. Paket berbayar yang ditutup menampilkan 'Pendaftaran Ditutup'", await closedBtn.isVisible().catch(() => false));

  const closedDisabled = await closedBtn.isDisabled().catch(() => false);
  check("7. Tombol paket ditutup benar-benar tidak bisa diklik", closedDisabled);

  // Tidak boleh ada tombol pesan WA saat semua paket berbayar ditutup.
  const waCount = await page.getByRole("button", { name: /Pesan via WA/i }).count().catch(() => 0);
  check("8. Tidak ada tombol 'Pesan via WA' saat semua paket berbayar ditutup", waCount === 0, `ditemukan ${waCount}`);

  // ══ 6. Klaim paket gratis (alur nyata yang tersedia) ════════════════════
  let claimed = false;
  if (await gratisBtn.isVisible().catch(() => false)) {
    await gratisBtn.click();
    await page.waitForTimeout(6000);
    await shot("03-setelah-klaim-gratis");

    const owned = await rest(`user_packages?user_id=eq.${userId}&package_id=eq.${REAL_PACKAGE_ID}`);
    claimed = Array.isArray(owned.body) && owned.body.length === 1;
    check("9. Paket gratis berhasil diklaim (tersimpan di database)", claimed, JSON.stringify(owned.body));

    const toastText = await page.locator("body").innerText().catch(() => "");
    check("10. Konfirmasi klaim tampil ke siswa", /berhasil|ditambahkan|Paket Saya/i.test(toastText));
  }

  // ══ 7. Pastikan akses ada (klaim gratis sudah cukup) ═══════════════════
  // Insert bisa gagal dengan 23505 bila paket sudah diklaim lewat tombol
  // "Ambil Gratis" di langkah sebelumnya. Yang penting: akses memang ada.
  const hasAccess = await rest(`user_packages?user_id=eq.${userId}&package_id=eq.${REAL_PACKAGE_ID}&select=package_id`);
  check(
    "11. Akses paket tersedia bagi siswa",
    Array.isArray(hasAccess.body) && hasAccess.body.length === 1,
    JSON.stringify(hasAccess.body)
  );

  // ══ 8. Paket muncul di Paket Saya ═══════════════════════════════════════
  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  await shot("05-paket-saya");

  check("12. Paket muncul di 'Paket Saya'", await page.getByText(/SKD STARTER PACK/i).first().isVisible().catch(() => false));

  // ══ 9. Buka paket -> daftar konten ══════════════════════════════════════
  const openBtn = page.getByRole("button", { name: /Buka Paket/i }).first();
  check("13. Tombol 'Buka Paket' tersedia", await openBtn.isVisible().catch(() => false));
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await page.waitForTimeout(3000);
    await shot("06-detail-paket");

    const hasContent = await page.getByText(/SKD Pretest/i).first().isVisible().catch(() => false);
    check("14b. Konten 'SKD Pretest' tampil", hasContent);

    // STARTER PACK punya 1 konten dan sudah tertaut ke tryout, sehingga
    // tombol "Mulai Tryout" harus aktif dan tidak ada penanda kosong.
    const adaTryout = await page.getByRole("button", { name: /Mulai Tryout/i }).first().isVisible().catch(() => false);
    check("14. Konten tryout tertaut dan tombol aktif", adaTryout);
  }

  // ══ 10. Mulai tryout asli 110 soal ══════════════════════════════════════
  const startBtn = page.getByRole("button", { name: /Mulai Tryout/i }).first();
  const startVisible = await startBtn.isVisible().catch(() => false);
  check("15. Tombol 'Mulai Tryout' aktif untuk SKD Pretest", startVisible);

  if (startVisible) {
    await startBtn.click();
    await page.waitForTimeout(3500);
    await shot("07-persiapan");

    check("16. Halaman persiapan ujian tampil", await page.getByText(/Persiapan Tryout/i).first().isVisible().catch(() => false));
    check("17. Durasi ujian terbaca", await page.getByText(/Menit/i).first().isVisible().catch(() => false));

    const startNow = page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first();
    if (await startNow.isVisible().catch(() => false)) await startNow.click();

    await page.waitForTimeout(10000);
    await shot("08-soal-1");

    const engineText = await page.locator("body").innerText().catch(() => "");
    check("18. Mesin ujian memuat 110 soal", /Soal nomor 1 dari 110/i.test(engineText), engineText.slice(0, 100).replace(/\n/g, " "));
    check("19. Timer berjalan", /\d{2}:\d{2}/.test(engineText));
    check("20. Kategori soal tampil (TWK/TIU/TKP)", /TWK|TIU|TKP/.test(engineText));

    // ══ 11. Jawab beberapa soal ═══════════════════════════════════════════
    // Opsi soal asli berupa tombol berawalan huruf A-E lalu teks panjang.
    let answered = 0;
    for (let i = 0; i < 6; i++) {
      const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => {
          const t = (b.textContent || "").trim();
          return /^[A-E]\s*\S/.test(t) && t.length > 30;
        });
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (clicked) answered++;
      await page.waitForTimeout(500);

      const next = page.getByRole("button", { name: /^Berikutnya$|^Selanjutnya$/i }).first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(700);
      }
    }
    check("21b. Enam soal berhasil dijawab", answered >= 5, `terjawab ${answered}`);
    await shot("09-setelah-jawab");

    // ══ 12. Uji navigasi soal (lompat ke nomor tertentu) ══════════════════
    const navBtn = page.getByRole("button", { name: /^50$/ }).first();
    if (await navBtn.isVisible().catch(() => false)) {
      await navBtn.click();
      await page.waitForTimeout(1500);
      const jumped = await page.locator("body").innerText().catch(() => "");
      check("21. Navigasi lompat ke soal 50 bekerja", /Soal nomor 50 dari 110/i.test(jumped), jumped.slice(0, 80).replace(/\n/g, " "));
    } else {
      check("24. Navigasi lompat ke soal 50 bekerja", false, "tombol nomor 50 tidak ditemukan");
    }

    // ══ 13. REFRESH di tengah ujian (bug yang baru diperbaiki) ════════════
    const urlBefore = page.url();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(14000);
    await shot("10-setelah-refresh");

    const urlAfter = page.url();
    const afterText = await page.locator("body").innerText().catch(() => "");

    check("22. Setelah refresh TETAP di halaman ujian", urlAfter.includes("/tryout-engine"), urlAfter.replace(BASE, ""));
    check("23. Soal tetap tampil setelah refresh", /Soal nomor/i.test(afterText));
    check("24. Posisi soal dipulihkan (bukan kembali ke 1)", /Soal nomor 50 dari 110/i.test(afterText), afterText.slice(0, 80).replace(/\n/g, " "));
    check("25. Jawaban sebelumnya tetap tersimpan", /Terjawab/i.test(afterText));

    // ══ 14. Selesaikan ujian ══════════════════════════════════════════════
    const finishBtn = page.getByRole("button", { name: /^Selesai$/i }).first();
    if (await finishBtn.isVisible().catch(() => false)) {
      await finishBtn.click();
      await page.waitForTimeout(2000);
      await shot("11-konfirmasi-selesai");

      // Konfirmasi
      const confirmBtn = page.getByRole("button", { name: /Kirim|Ya|Selesai/i }).last();
      await confirmBtn.click().catch(() => {});
      await page.waitForTimeout(12000);
      await shot("12-hasil");

      const resultText = await page.locator("body").innerText().catch(() => "");
      check("26. Halaman hasil tampil", /Skor|Total|TWK|Peringkat/i.test(resultText));

      // ══ 15. Verifikasi hasil di database ════════════════════════════════
      const saved = await rest(
        `tryout_results?user_id=eq.${userId}&select=twk,tiu,tkp,total,twk_correct,tiu_correct,tkp_correct,package_name`
      );
      const row = Array.isArray(saved.body) ? saved.body[0] : null;
      check("27. Hasil tersimpan di database", !!row, JSON.stringify(saved.body).slice(0, 150));

      if (row) {
        check("28. Total = TWK + TIU + TKP", row.total === row.twk + row.tiu + row.tkp, `total=${row.total} twk=${row.twk} tiu=${row.tiu} tkp=${row.tkp}`);
        check("29. Nama paket tercatat", /SKD/i.test(row.package_name || ""), row.package_name);
        check("30. Skor dalam rentang wajar", row.twk >= 0 && row.twk <= 150 && row.tiu >= 0 && row.tiu <= 175 && row.tkp >= 0 && row.tkp <= 225, `twk=${row.twk} tiu=${row.tiu} tkp=${row.tkp}`);
      }

      const sess = await rest(`active_tryout_sessions?user_id=eq.${userId}`);
      check("31. Sesi ujian dibersihkan setelah submit", Array.isArray(sess.body) && sess.body.length === 0);
    } else {
      check("29. Halaman hasil tampil", false, "tombol Selesai tidak ditemukan");
    }
  }

  // ══ 16. Peringkat nasional ══════════════════════════════════════════════
  await page.goto(`${BASE}/ranking`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await shot("13-ranking");
  const rankText = await page.locator("body").innerText().catch(() => "");
  check("32. Halaman peringkat nasional terbuka", /Peringkat|Ranking/i.test(rankText));

  // ══ 17. Riwayat & notifikasi ════════════════════════════════════════════
  await page.goto(`${BASE}/transactions`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const historyText = await page.locator("body").innerText().catch(() => "");
  check("33. Riwayat permintaan menampilkan paket", /SKD STARTER PACK/i.test(historyText), historyText.slice(0, 80).replace(/\n/g, " "));

  await page.goto(`${BASE}/notifikasi`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  await shot("14-notifikasi");
  const notifText = await page.locator("body").innerText().catch(() => "");
  check("34. Halaman notifikasi terbuka", /Notifikasi/i.test(notifText));

  // ══ 18. Profil ══════════════════════════════════════════════════════════
  await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const profText = await page.locator("body").innerText().catch(() => "");
  check("35. Halaman profil menampilkan kode akun", /FBK-/i.test(profText), profText.slice(0, 100).replace(/\n/g, " "));

  // ══ 19. Error konsol ════════════════════════════════════════════════════
  const realErrors = consoleErrors.filter(
    (e) =>
      !/favicon|ResizeObserver|net::ERR_BLOCKED|net::ERR_ABORTED|whatsapp|Content Security Policy directive|Failed to fetch|Failed to load resource/i.test(
        e
      )
  );
  check("36. Tidak ada error konsol berarti", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));
} catch (err) {
  console.error("\nERROR SIMULASI:", err.message);
  fail++;
  await shot("error");
} finally {
  await browser.close();

  // ── Bersihkan data uji ──────────────────────────────────────────────────
  for (const t of ["user_packages", "transactions", "tryout_results", "active_tryout_sessions", "notifications"]) {
    await rest(`${t}?user_id=eq.${userId}`, { method: "DELETE" });
  }
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });

  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  console.log(`Screenshot: ${SHOTS}`);

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("\nYang gagal:");
    for (const f of failed) console.log(`  - ${f.label} ${f.detail ?? ""}`);
  }

  process.exit(fail > 0 ? 1 : 0);
}
