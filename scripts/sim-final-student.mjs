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

  // ══ 5. Klik Pesan via WA ════════════════════════════════════════════════
  const popupPromise = context.waitForEvent("page", { timeout: 25000 }).catch(() => null);
  const waBtn = page.getByRole("button", { name: /Pesan via WA/i }).first();
  const waVisible = await waBtn.isVisible().catch(() => false);
  check("5. Tombol 'Pesan via WA' tersedia", waVisible);

  let waUrl = "";
  if (waVisible) {
    await waBtn.click();
    const popup = await popupPromise;
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
    await page.waitForTimeout(2000);
    await shot("03-setelah-wa");

    check("6. WhatsApp terbuka", !!waUrl, waUrl.slice(0, 60) || "tidak terbuka");
    if (waUrl) {
      const decoded = decodeURIComponent(waUrl).replace(/\+/g, " ");
      check("7. Pesan WA memuat paket", /SKD STARTER PACK/i.test(decoded));
      check("8. Pesan WA memuat rekening BRI", decoded.includes("035601089005505") || decoded.includes("0356 0108 9005 505"));
      check("9. Pesan WA memuat langkah pembayaran", /Langkah pembayaran/i.test(decoded));
      check("10. Pesan WA memuat email siswa", decoded.includes(email));
    }
    if (popup) await popup.close().catch(() => {});

    // ══ 6. Status menunggu konfirmasi ═════════════════════════════════════
    let waiting = false;
    for (let i = 0; i < 40; i++) {
      waiting = await page.getByText(/Menunggu Konfirmasi/i).first().isVisible().catch(() => false);
      if (waiting) break;
      await page.waitForTimeout(500);
    }
    check("11. Status 'Menunggu Konfirmasi' tampil", waiting);
    await shot("04-menunggu");

    const tx = await rest(`transactions?user_id=eq.${userId}&status=in.(pending,verifying)&select=status,amount`);
    check("12. Permintaan tercatat di database", Array.isArray(tx.body) && tx.body.length === 1, JSON.stringify(tx.body));
  }

  // ══ 7. Admin memberi akses ══════════════════════════════════════════════
  const grant = await rest("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, package_id: REAL_PACKAGE_ID }),
  });
  check("13. Admin memberi akses paket", grant.ok, JSON.stringify(grant.body).slice(0, 150));

  // ══ 8. Paket muncul di Paket Saya ═══════════════════════════════════════
  await page.goto(`${BASE}/paket-saya`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  await shot("05-paket-saya");

  check("14. Paket muncul di 'Paket Saya'", await page.getByText(/SKD STARTER PACK/i).first().isVisible().catch(() => false));

  // ══ 9. Buka paket -> daftar konten ══════════════════════════════════════
  const openBtn = page.getByRole("button", { name: /Buka Paket/i }).first();
  check("15. Tombol 'Buka Paket' tersedia", await openBtn.isVisible().catch(() => false));
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
    await page.waitForTimeout(3000);
    await shot("06-detail-paket");

    const hasContent = await page.getByText(/SKD Pretest/i).first().isVisible().catch(() => false);
    check("16. Konten 'SKD Pretest' tampil", hasContent);

    // Konten tanpa tautan harus ditandai, bukan tombol aktif
    const belumSiap = await page.getByText(/Belum ada|Belum siap|Belum Tersedia/i).first().isVisible().catch(() => false);
    check("17. Konten kosong ditandai jelas (bukan tombol mati tanpa keterangan)", belumSiap);
  }

  // ══ 10. Mulai tryout asli 110 soal ══════════════════════════════════════
  const startBtn = page.getByRole("button", { name: /Mulai Tryout/i }).first();
  const startVisible = await startBtn.isVisible().catch(() => false);
  check("18. Tombol 'Mulai Tryout' aktif untuk SKD Pretest", startVisible);

  if (startVisible) {
    await startBtn.click();
    await page.waitForTimeout(3500);
    await shot("07-persiapan");

    check("19. Halaman persiapan ujian tampil", await page.getByText(/Persiapan Tryout/i).first().isVisible().catch(() => false));
    check("20. Durasi ujian terbaca", await page.getByText(/Menit/i).first().isVisible().catch(() => false));

    const startNow = page.getByRole("button", { name: /Mulai Tryout Sekarang/i }).first();
    if (await startNow.isVisible().catch(() => false)) await startNow.click();

    await page.waitForTimeout(10000);
    await shot("08-soal-1");

    const engineText = await page.locator("body").innerText().catch(() => "");
    check("21. Mesin ujian memuat 110 soal", /Soal nomor 1 dari 110/i.test(engineText), engineText.slice(0, 100).replace(/\n/g, " "));
    check("22. Timer berjalan", /\d{2}:\d{2}/.test(engineText));
    check("23. Kategori soal tampil (TWK/TIU/TKP)", /TWK|TIU|TKP/.test(engineText));

    // ══ 11. Jawab beberapa soal ═══════════════════════════════════════════
    let answered = 0;
    for (let i = 0; i < 6; i++) {
      const opt = page.getByText(/^Pilihan [A-E]$/i).nth(i % 5);
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        answered++;
        await page.waitForTimeout(350);
      }
      const next = page.getByRole("button", { name: /^Berikutnya$|^Selanjutnya$/i }).first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(700);
      }
    }
    await shot("09-setelah-jawab");

    // ══ 12. Uji navigasi soal (lompat ke nomor tertentu) ══════════════════
    const navBtn = page.getByRole("button", { name: /^50$/ }).first();
    if (await navBtn.isVisible().catch(() => false)) {
      await navBtn.click();
      await page.waitForTimeout(1500);
      const jumped = await page.locator("body").innerText().catch(() => "");
      check("24. Navigasi lompat ke soal 50 bekerja", /Soal nomor 50 dari 110/i.test(jumped), jumped.slice(0, 80).replace(/\n/g, " "));
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

    check("25. Setelah refresh TETAP di halaman ujian", urlAfter.includes("/tryout-engine"), urlAfter.replace(BASE, ""));
    check("26. Soal tetap tampil setelah refresh", /Soal nomor/i.test(afterText));
    check("27. Posisi soal dipulihkan (bukan kembali ke 1)", /Soal nomor 50 dari 110/i.test(afterText), afterText.slice(0, 80).replace(/\n/g, " "));
    check("28. Jawaban sebelumnya tetap tersimpan", /Terjawab/i.test(afterText));

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
      check("29. Halaman hasil tampil", /Skor|Total|TWK|Peringkat/i.test(resultText));

      // ══ 15. Verifikasi hasil di database ════════════════════════════════
      const saved = await rest(
        `tryout_results?user_id=eq.${userId}&select=twk,tiu,tkp,total,twk_correct,tiu_correct,tkp_correct,package_name`
      );
      const row = Array.isArray(saved.body) ? saved.body[0] : null;
      check("30. Hasil tersimpan di database", !!row, JSON.stringify(saved.body).slice(0, 150));

      if (row) {
        check("31. Total = TWK + TIU + TKP", row.total === row.twk + row.tiu + row.tkp, `total=${row.total} twk=${row.twk} tiu=${row.tiu} tkp=${row.tkp}`);
        check("32. Nama paket tercatat", /SKD/i.test(row.package_name || ""), row.package_name);
        check("33. Skor dalam rentang wajar", row.twk >= 0 && row.twk <= 150 && row.tiu >= 0 && row.tiu <= 175 && row.tkp >= 0 && row.tkp <= 225, `twk=${row.twk} tiu=${row.tiu} tkp=${row.tkp}`);
      }

      const sess = await rest(`active_tryout_sessions?user_id=eq.${userId}`);
      check("34. Sesi ujian dibersihkan setelah submit", Array.isArray(sess.body) && sess.body.length === 0);
    } else {
      check("29. Halaman hasil tampil", false, "tombol Selesai tidak ditemukan");
    }
  }

  // ══ 16. Peringkat nasional ══════════════════════════════════════════════
  await page.goto(`${BASE}/ranking`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await shot("13-ranking");
  const rankText = await page.locator("body").innerText().catch(() => "");
  check("35. Halaman peringkat nasional terbuka", /Peringkat|Ranking/i.test(rankText));

  // ══ 17. Riwayat & notifikasi ════════════════════════════════════════════
  await page.goto(`${BASE}/transactions`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const historyText = await page.locator("body").innerText().catch(() => "");
  check("36. Riwayat permintaan menampilkan paket", /SKD STARTER PACK/i.test(historyText), historyText.slice(0, 80).replace(/\n/g, " "));

  await page.goto(`${BASE}/notifikasi`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  await shot("14-notifikasi");
  const notifText = await page.locator("body").innerText().catch(() => "");
  check("37. Halaman notifikasi terbuka", /Notifikasi/i.test(notifText));

  // ══ 18. Profil ══════════════════════════════════════════════════════════
  await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const profText = await page.locator("body").innerText().catch(() => "");
  check("38. Halaman profil menampilkan kode akun", /FBK-/i.test(profText), profText.slice(0, 100).replace(/\n/g, " "));

  // ══ 19. Error konsol ════════════════════════════════════════════════════
  const realErrors = consoleErrors.filter(
    (e) =>
      !/favicon|ResizeObserver|net::ERR_BLOCKED|net::ERR_ABORTED|whatsapp|Content Security Policy directive|Failed to fetch|Failed to load resource/i.test(
        e
      )
  );
  check("39. Tidak ada error konsol berarti", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));
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
