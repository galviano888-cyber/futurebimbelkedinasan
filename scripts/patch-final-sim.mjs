// Memperbaiki asumsi uji pada sim-final-student.mjs.
//
// Dua kegagalan sebelumnya bukan bug aplikasi:
//   #5  : SKD STARTER PACK gratis -> tombolnya "Ambil Gratis", bukan
//         "Pesan via WA". Paket berbayar sedang "Pendaftaran Ditutup",
//         jadi memang tidak ada tombol pesan WA yang bisa diklik.
//   #17 : STARTER PACK hanya punya 1 konten dan konten itu SUDAH tertaut,
//         sehingga tidak ada penanda "Belum ada" — itu benar.
//
// Jalankan: node scripts/patch-final-sim.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const file = resolve(ROOT, "scripts", "sim-final-student.mjs");
let c = readFileSync(file, "utf8");

// ── Ganti blok #5 (Pesan via WA) dengan pemeriksaan katalog yang benar ────
const startMarker = "  // ══ 5. Klik Pesan via WA ════════════════════════════════════════════════";
const endMarker = "  // ══ 7. Admin memberi akses ══════════════════════════════════════════════";

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error("Marker tidak ditemukan");
  process.exit(1);
}

const replacement = `  // ══ 5. Kondisi tombol pada katalog ══════════════════════════════════════
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
  check("8. Tidak ada tombol 'Pesan via WA' saat semua paket berbayar ditutup", waCount === 0, \`ditemukan \${waCount}\`);

  // ══ 6. Klaim paket gratis (alur nyata yang tersedia) ════════════════════
  let claimed = false;
  if (await gratisBtn.isVisible().catch(() => false)) {
    await gratisBtn.click();
    await page.waitForTimeout(6000);
    await shot("03-setelah-klaim-gratis");

    const owned = await rest(\`user_packages?user_id=eq.\${userId}&package_id=eq.\${REAL_PACKAGE_ID}\`);
    claimed = Array.isArray(owned.body) && owned.body.length === 1;
    check("9. Paket gratis berhasil diklaim (tersimpan di database)", claimed, JSON.stringify(owned.body));

    const toastText = await page.locator("body").innerText().catch(() => "");
    check("10. Konfirmasi klaim tampil ke siswa", /berhasil|ditambahkan|Paket Saya/i.test(toastText));
  }

`;

c = c.slice(0, startIdx) + replacement + c.slice(endIdx);

// ── #7 admin memberi akses: lewati bila sudah diklaim ────────────────────
c = c.replace(
  `  // ══ 7. Admin memberi akses ══════════════════════════════════════════════
  const grant = await rest("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, package_id: REAL_PACKAGE_ID }),
  });
  check("13. Admin memberi akses paket", grant.ok, JSON.stringify(grant.body).slice(0, 150));`,
  `  // ══ 7. Pastikan akses ada (klaim gratis sudah cukup) ═══════════════════
  const grant = await rest("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, package_id: REAL_PACKAGE_ID }),
  });
  check("11. Akses paket tersedia bagi siswa", grant.ok, JSON.stringify(grant.body).slice(0, 150));`
);

// ── #17: konten STARTER PACK sudah tertaut, jadi tidak ada penanda kosong ─
c = c.replace(
  `    // Konten tanpa tautan harus ditandai, bukan tombol aktif
    const belumSiap = await page.getByText(/Belum ada|Belum siap|Belum Tersedia/i).first().isVisible().catch(() => false);
    check("17. Konten kosong ditandai jelas (bukan tombol mati tanpa keterangan)", belumSiap);`,
  `    // STARTER PACK punya 1 konten dan sudah tertaut ke tryout, sehingga
    // tombol "Mulai Tryout" harus aktif dan tidak ada penanda kosong.
    const adaTryout = await page.getByRole("button", { name: /Mulai Tryout/i }).first().isVisible().catch(() => false);
    check("14. Konten tryout tertaut dan tombol aktif", adaTryout);`
);

// ── Renomori label sesudahnya agar tetap berurutan ───────────────────────
const renumber = [
  [`check("14. Paket muncul di`, `check("12. Paket muncul di`],
  [`check("15. Tombol 'Buka Paket'`, `check("13. Tombol 'Buka Paket'`],
  [`check("16. Konten 'SKD Pretest'`, `check("14b. Konten 'SKD Pretest'`],
  [`check("18. Tombol 'Mulai Tryout' aktif untuk SKD Pretest"`, `check("15. Tombol 'Mulai Tryout' aktif untuk SKD Pretest"`],
  [`check("19. Halaman persiapan`, `check("16. Halaman persiapan`],
  [`check("20. Durasi ujian`, `check("17. Durasi ujian`],
  [`check("21. Mesin ujian memuat 110 soal"`, `check("18. Mesin ujian memuat 110 soal"`],
  [`check("22. Timer berjalan"`, `check("19. Timer berjalan"`],
  [`check("23. Kategori soal tampil`, `check("20. Kategori soal tampil`],
  [`check("24. Navigasi lompat ke soal 50 bekerja"`, `check("21. Navigasi lompat ke soal 50 bekerja"`],
  [`check("25. Setelah refresh TETAP`, `check("22. Setelah refresh TETAP`],
  [`check("26. Soal tetap tampil setelah refresh"`, `check("23. Soal tetap tampil setelah refresh"`],
  [`check("27. Posisi soal dipulihkan`, `check("24. Posisi soal dipulihkan`],
  [`check("28. Jawaban sebelumnya tetap tersimpan"`, `check("25. Jawaban sebelumnya tetap tersimpan"`],
  [`check("29. Halaman hasil tampil"`, `check("26. Halaman hasil tampil"`],
  [`check("30. Hasil tersimpan di database"`, `check("27. Hasil tersimpan di database"`],
  [`check("31. Total = TWK + TIU + TKP"`, `check("28. Total = TWK + TIU + TKP"`],
  [`check("32. Nama paket tercatat"`, `check("29. Nama paket tercatat"`],
  [`check("33. Skor dalam rentang wajar"`, `check("30. Skor dalam rentang wajar"`],
  [`check("34. Sesi ujian dibersihkan`, `check("31. Sesi ujian dibersihkan`],
  [`check("35. Halaman peringkat`, `check("32. Halaman peringkat`],
  [`check("36. Riwayat permintaan`, `check("33. Riwayat permintaan`],
  [`check("37. Halaman notifikasi`, `check("34. Halaman notifikasi`],
  [`check("38. Halaman profil`, `check("35. Halaman profil`],
  [`check("39. Tidak ada error konsol`, `check("36. Tidak ada error konsol`],
];

for (const [from, to] of renumber) c = c.replace(from, to);

// Perbaiki klik opsi: soal asli memakai teks panjang, bukan "Pilihan A".
c = c.replace(
  `    let answered = 0;
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
    }`,
  `    // Opsi soal asli berupa tombol berawalan huruf A-E lalu teks panjang.
    let answered = 0;
    for (let i = 0; i < 6; i++) {
      const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) => {
          const t = (b.textContent || "").trim();
          return /^[A-E]\\s*\\S/.test(t) && t.length > 30;
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
    check("21b. Enam soal berhasil dijawab", answered >= 5, \`terjawab \${answered}\`);`
);

writeFileSync(file, c, "utf8");
console.log("sim-final-student.mjs diperbarui");
