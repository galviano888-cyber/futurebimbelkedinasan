# Masterplan Audit Menyeluruh — Future Bimbel Kedinasan

Dokumen kerja untuk mengaudit seluruh sistem: alur bisnis, keamanan, data,
kualitas soal, frontend, dan operasional.

**Tanggal disusun:** 14 November 2026
**Ruang lingkup:** repo `futurebimbelkedinasan` + database Supabase
`lglqbxaoxkdsfrqvuplq` + bank soal lokal `publish soal`
**Sifat:** audit baca-saja (read-only) sampai temuan disetujui untuk diperbaiki

---

## 0. Kondisi awal yang sudah terverifikasi

Fakta ini hasil pemeriksaan langsung, bukan asumsi. Menjadi titik start audit.

| Aspek | Kondisi |
|---|---|
| Migrasi | 27 file, **semua sudah applied** ke remote (`db push --dry-run` = up to date) |
| Tabel | 13 tabel, **semua RLS aktif** |
| Paket di DB | 2 paket: `INTENSIF` (Rp 99.999) dan `BUNDLE` (gratis, 27 pemilik) |
| Paket `KELAS`/`PRIVAT` | **Belum ada** di database (baru tersedia di UI) |
| Bank soal lokal | 15 paket `SKD-01..15.json` (~1.650 soal) |
| Bank soal di repo | Hanya seed SKD-01 dan SKD-06 |
| Test E2E | **2 test** (judul landing, buka modal login) |
| CI | typecheck + build + 2 E2E |
| Pakasir | Sudah dihapus total (kode, Edge Function, CSP) |
| Commit | **Belum ada** — 30 file modified, 19 untracked |
| Docker | Tidak jalan → `db diff`/`db reset` tidak bisa dipakai |
| Backup DB | Tidak ada (free plan) |

### Temuan awal yang sudah terlihat (pra-audit)

| # | Temuan | Tingkat |
|---|---|---|
| T-01 | Tidak ada constraint `quota <= 5`. Batas 5 hanya di UI + default trigger. Bisa ditembus lewat SQL langsung. | P1 |
| T-02 | `AdminPackageEditorView.tsx` (17,5 KB) adalah **dead code** — view `edit-package` tidak pernah dipanggil; semua navigasi memakai `edit-product`. | P2 |
| T-03 | Cakupan test hampir nol untuk alur bisnis (pembelian, kuota, akses, tryout). | P1 |
| T-04 | Pekerjaan hari ini belum di-commit, belum ada backup. | P1 |
| T-05 | File tak berhubungan di root repo: `ice-core-papers/`, `apply_ice_template.ps1`, `audit13.txt`, `gen.txt`, `build_ice_core_*.py`, `revise_ice_core_doc.py`, `polish_ice_core_ppt.ps1`. | P2 |
| T-06 | `submit_tryout_secure` menerima `p_user_id` dari klien. Ada pengecekan `v_user <> p_user_id`, tetapi perlu diuji apakah bisa dipakai menyuntik skor user lain. | P1 |
| T-07 | Paket `BUNDLE` gratis punya `seats_taken = 27` padahal `quota = null`. Tidak berbahaya, tapi kolom bermakna ganda. | P3 |

---

## 1. Tujuan audit

1. Memastikan **tidak ada kebocoran akses**: siswa tidak bisa membuka paket yang
   belum dibayar, dan tidak bisa memalsukan hasil tryout.
2. Memastikan **uang dan akses konsisten**: setiap paket aktif punya dasar
   pembayaran atau pemberian admin yang tercatat.
3. Memastikan **kuota kelas tidak bisa dilanggar** dari jalur mana pun.
4. Memastikan **kualitas 1.650 soal** memenuhi standar yang sudah ditulis di
   `docs/KUALITAS_SOAL.md`.
5. Memastikan sistem **bisa dioperasikan** oleh satu admin tanpa bantuan developer.
6. Menghasilkan daftar temuan berprioritas yang bisa langsung dieksekusi.

---

## 2. Area audit

Sepuluh area. Tiap area punya metode, kriteria lulus, dan risiko bila gagal.

---

### A. Alur bisnis inti (paling kritis)

**Yang diperiksa**

- [ ] Klik "Pesan via WA" membuka WhatsApp dengan pesan lengkap dan benar
- [ ] Permintaan tercatat 24 jam, bukan 24 jam lebih/kurang
- [ ] Status "Menunggu Konfirmasi Admin" muncul di katalog dan dashboard
- [ ] Setelah 24 jam status hilang sendiri tanpa cron
- [ ] Admin "Beri Akses" → paket muncul di Paket Saya
- [ ] Status menunggu hilang otomatis setelah akses diberikan
- [ ] Akses dicabut → paket hilang dari Paket Saya, siswa tidak bisa masuk
- [ ] Siswa tidak bisa memesan paket yang sudah dimiliki
- [ ] Paket gratis langsung aktif tanpa admin

**Metode**

1. Uji manual end-to-end dengan akun siswa percobaan.
2. Uji waktu: ubah `expiry_date` ke masa lalu lewat SQL, muat ulang halaman.
3. Uji balapan: dua tab klik bersamaan, pastikan tidak ada dua permintaan aktif.
4. Uji cabut akses: pastikan RLS `user_packages` menolak akses langsung ke konten.

**Kriteria lulus**

- Tidak ada paket terbuka tanpa baris `user_packages`.
- Tidak ada dua permintaan aktif untuk paket yang sama.
- Setelah 24 jam, kartu kembali normal tanpa intervensi.

**Risiko bila gagal:** siswa mendapat akses gratis, atau siswa yang sudah bayar
tidak mendapat akses.

---

### B. Kuota kelas

**Yang diperiksa**

- [ ] Chat **tidak** mengisi kursi
- [ ] Beri akses mengisi kursi 1/5 → 5/5
- [ ] Akses ke-6 ditolak di database
- [ ] Cabut akses mengembalikan kursi
- [ ] Tombol berubah "Kuota Penuh (5/5)" dan tidak bisa diklik
- [ ] Dua admin memberi akses bersamaan → hanya satu yang berhasil
- [ ] `quota` tidak bisa diisi > 5 lewat SQL (**T-01, belum ditutup**)
- [ ] Paket kelas tanpa kuota otomatis jadi 5
- [ ] Paket non-kelas tidak punya kuota

**Metode**

1. Sudah ada self-test SQL yang lolos (chat tidak mengisi, penuh menolak,
   kursi kembali). Ulangi setelah setiap perubahan trigger.
2. Uji balapan dengan dua sesi SQL paralel.
3. Coba `update packages set quota = 99` lewat SQL sebagai admin.

**Kriteria lulus:** kursi selalu sama dengan `count(user_packages)` untuk paket
kelas, dan tidak pernah melebihi kuota.

**Risiko bila gagal:** kelas kelebihan murid, atau murid yang sudah bayar tidak
bisa masuk.

---

### C. Keamanan database (RLS & RPC)

**Yang diperiksa**

- [ ] Semua 13 tabel punya RLS aktif (**terverifikasi: ya**)
- [ ] Setiap tabel punya policy untuk SELECT/INSERT/UPDATE/DELETE sesuai peran
- [ ] `profiles` tidak bisa dibaca siswa lain (cek `public_profiles` vs tabel asli)
- [ ] `tryout_questions` tidak bisa dibaca langsung (harus lewat `get_exam_questions`)
- [ ] `tryout_results` tidak bisa ditulis langsung oleh siswa
- [ ] `transactions` tidak bisa diubah siswa (status, amount)
- [ ] `user_packages` tidak bisa ditulis siswa
- [ ] `grant_package` hanya `service_role` (**terverifikasi**)
- [ ] Setiap `security definer` punya `search_path = public`
- [ ] Setiap `security definer` punya pengecekan `is_admin()` bila bersifat admin
- [ ] `admin_search_students` menolak non-admin (**sudah ada**)
- [ ] `submit_tryout_secure` tidak bisa dipakai memalsukan skor user lain (**T-06**)
- [ ] Kunci anon tidak bisa memanggil RPC admin

**Metode**

1. Dengan anon key, coba akses langsung tiap tabel (`GET /rest/v1/<tabel>`).
2. Dengan akun siswa, coba `POST` ke tabel terlarang.
3. Baca ulang semua fungsi `security definer` di migrasi.
4. Cari `grant execute ... to authenticated` pada fungsi yang seharusnya admin-only.

**Kriteria lulus:** setiap percobaan ditolak dengan 401/403, dan tidak ada
fungsi admin yang terbuka untuk `authenticated`.

**Risiko bila gagal:** siswa membuka paket gratis, mengubah harga, atau
memalsukan peringkat.

---

### D. Integritas data & migrasi

**Yang diperiksa**

- [ ] Repo migrations = kondisi remote (tidak ada drift)
- [ ] Tidak ada migrasi yang membuat fungsi lalu menghapusnya di migrasi lain
      tanpa alasan jelas
- [ ] Setiap migrasi punya `begin; ... commit;`
- [ ] `student_code` unik dan tidak ada duplikat
- [ ] `seats_taken` cocok dengan jumlah `user_packages` sebenarnya
- [ ] Tidak ada transaksi `pending` yang menggantung selamanya
- [ ] Tidak ada `user_packages` ganda (user + paket sama)
- [ ] Constraint `product_type` mencakup semua tipe yang dipakai UI
- [ ] `profiles.student_code` tidak null

**Metode**

1. `npm run db:diff --linked` (butuh Docker) atau bandingkan dump manual.
2. Query rekonsiliasi:
   ```sql
   select p.id, p.title, p.quota, p.seats_taken, count(up.id) as actual
   from packages p left join user_packages up on up.package_id = p.id
   group by p.id having p.seats_taken <> count(up.id);
   ```
3. Cari duplikat `student_code` dan `(user_id, package_id)`.

**Kriteria lulus:** nol baris pada query rekonsiliasi.

**Risiko bila gagal:** kuota salah hitung, admin melihat angka palsu.

---

### E. Kualitas bank soal

**Yang diperiksa**

- [ ] 15 paket × 110 soal = 1.650, komposisi 30 TWK / 35 TIU / 45 TKP
- [ ] Nomor soal 1–110 berurutan tanpa lompat
- [ ] Kunci jawaban tersebar (>25 per opsi)
- [ ] Tidak ada soal duplikat lintas paket
- [ ] Penjelasan tidak menyebut huruf kunci yang salah
- [ ] Skor TKP tidak duplikat dalam satu soal
- [ ] Tidak ada nama tokoh berulang berlebihan
- [ ] Tidak ada kebocoran status "draft"
- [ ] Soal figural/TIU bergambar bisa dirender di aplikasi
- [ ] Sitasi hukum TWK sudah diverifikasi manusia
- [ ] Perhitungan matematika TIU sudah dicek ulang

**Metode**

1. Jalankan `validate-import.mjs`, `validate-cross.mjs`, `verify-math.mjs`,
   `verify-sequences.mjs` di `publish soal/_tools`.
2. Audit manual sampel 10% per paket.
3. Cek seluruh item figural secara visual (tidak bisa diaudit mesin).

**Kriteria lulus:** nol temuan pada validator, dan sampel manual tanpa cacat.

**Risiko bila gagal:** siswa belajar dari soal yang salah kunci.

---

### F. Frontend & konsistensi UI

**Yang diperiksa**

- [ ] Label tipe paket konsisten di katalog, admin, Paket Saya, landing
- [ ] Tidak ada istilah lama ("invoice", "transaksi", "Pakasir", "QRIS") di UI
- [ ] Halaman kosong/error punya keadaan yang jelas
- [ ] Status loading tidak menggantung
- [ ] Responsif di 375 px, 768 px, 1440 px
- [ ] Dark mode tidak ada teks tak terbaca
- [ ] Angka rupiah memakai format `id-ID` konsisten
- [ ] Tidak ada `console.error` yang muncul di alur normal

**Metode:** klik setiap menu dengan akun siswa dan akun admin; uji tiga lebar layar.

**Kriteria lulus:** tidak ada teks salah/istilah usang; tidak ada layar rusak.

---

### G. Performa

**Yang diperiksa**

- [ ] Bundle utama 788 kB (237 kB gzip) — bisa dipecah?
- [ ] Tiga keluarga font dimuat sekaligus
- [ ] Query N+1 di katalog dan dashboard
- [ ] `package_content_counts` dipakai, bukan menghitung di klien
- [ ] Halaman tryout memuat < 2 detik pada jaringan 3G cepat

**Metode:** Lighthouse mobile, Network tab, `EXPLAIN ANALYZE` pada query utama.

**Kriteria lulus:** LCP < 2,5 s; tidak ada query berulang dalam satu render.

---

### H. Observability & penanganan error

**Yang diperiksa**

- [ ] Error dari RPC ditampilkan ke pengguna dengan bahasa manusia
- [ ] Error tidak hanya masuk `console.error`
- [ ] Ada cara admin melihat kegagalan (log Supabase?)
- [ ] Tidak ada data sensitif di log
- [ ] Kegagalan jaringan punya tombol coba lagi

**Kriteria lulus:** setiap jalur gagal punya pesan yang bisa ditindaklanjuti.

---

### I. Dokumentasi & operasional

**Yang diperiksa**

- [ ] `README.md` sesuai kondisi nyata
- [ ] `docs/CATATAN_TEKNIS.md` tidak menyebut hal yang sudah selesai
- [ ] Ada SOP admin: verifikasi transfer, beri akses, cabut akses
- [ ] Ada panduan memulihkan kalau DB bermasalah
- [ ] Ada daftar akun admin dan cara menambah admin
- [ ] Ada catatan rekening & nomor WA yang aktif

**Kriteria lulus:** orang baru bisa mengoperasikan sistem dari dokumen saja.

---

### J. Kebersihan repo & proses rilis

**Yang diperiksa**

- [ ] Pekerjaan di-commit dengan pesan jelas
- [ ] File tak berhubungan dipindahkan keluar repo (**T-05**)
- [ ] `.gitignore` mencakup `.env.local`, `dist`, artefak
- [ ] Tidak ada secret di repo
- [ ] Dead code dihapus (**T-02**)
- [ ] Ada tag rilis / riwayat perubahan

**Kriteria lulus:** `git status` bersih, `git log` bisa dibaca.

---

## 3. Urutan eksekusi

Empat fase. Tiap fase punya gerbang: fase berikutnya tidak dimulai sebelum
gerbang sebelumnya lulus.

### Fase 0 — Amankan kondisi sekarang (½ hari)

1. Commit seluruh pekerjaan hari ini.
2. Ekspor skema + data penting sebagai backup manual.
3. Catat daftar akun admin.
4. **Gerbang:** `git status` bersih, backup tersimpan.

### Fase 1 — Keamanan & uang (1–2 hari)

Area **C** dan **D**, plus **A** bagian akses.
Fokus: pastikan tidak ada kebocoran akses dan tidak ada drift.

**Gerbang:** semua uji akses ditolak sesuai harapan; query rekonsiliasi nol baris.

### Fase 2 — Alur bisnis & kuota (1 hari)

Area **A** dan **B** secara penuh, termasuk uji balapan.

**Gerbang:** uji end-to-end manual lolos dengan akun nyata.

### Fase 3 — Konten & UX (2–3 hari)

Area **E**, **F**, **G**, **H**.

**Gerbang:** validator soal nol temuan; audit visual sampel lolos.

### Fase 4 — Operasional & rilis (1 hari)

Area **I** dan **J**.

**Gerbang:** SOP admin tertulis; repo bersih; rilis ditandai.

---

## 4. Format laporan temuan

Setiap temuan ditulis dengan format sama agar bisa diprioritaskan.

```
ID        : AUD-001
Area      : C (Keamanan)
Judul     : RPC submit_tryout_secure menerima p_user_id dari klien
Tingkat   : P1
Bukti     : <file:baris atau hasil query>
Dampak    : <apa yang bisa dilakukan penyerang>
Perbaikan : <langkah konkret>
Status    : terbuka / diperbaiki / diterima risikonya
```

### Skala tingkat

| Tingkat | Arti | Tenggat |
|---|---|---|
| **P0** | Kebocoran akses atau kehilangan data aktif | Segera, sebelum rilis |
| **P1** | Bisa disalahgunakan atau merugikan siswa | Sebelum rilis |
| **P2** | Menghambat operasional atau membingungkan | Sprint berikutnya |
| **P3** | Kosmetik / kebersihan | Kapan saja |

---

## 5. Kriteria "audit selesai"

Audit dinyatakan selesai bila:

1. Semua area A–J punya status diperiksa.
2. Tidak ada temuan P0/P1 berstatus terbuka.
3. Setiap temuan punya bukti, bukan opini.
4. Ada ringkasan satu halaman untuk pemilik produk.
5. Temuan P2/P3 masuk backlog dengan pemilik dan tenggat.

---

## 6. Saran setelah audit

Berikut rekomendasi yang sudah bisa diambil dari bukti yang ada sekarang,
diurutkan dari yang paling berdampak.

### Segera (sebelum dipakai jualan)

1. **Tutup celah kuota di database (T-01).**
   Tambahkan `check (quota is null or quota between 1 and 5)` pada `packages`.
   Tanpa ini, batas "maks 5" hanya kesepakatan UI, bukan aturan sistem.

2. **Commit dan backup (T-04).**
   Ada 30 file berubah dan 19 file baru yang belum masuk git, tanpa backup DB.
   Satu kesalahan `db push` bisa menghapus pekerjaan berhari-hari.

3. **Uji satu transaksi nyata.**
   Alur WA → transfer → beri akses belum pernah dijalankan dengan uang
   sungguhan. Lakukan dengan nominal kecil sebelum diumumkan.

4. **Audit `submit_tryout_secure` (T-06).**
   Pastikan siswa tidak bisa mengirim hasil atas nama siswa lain, dan tidak bisa
   mengirim skor tanpa sesi tryout yang sah.

### Jangka pendek (1–2 minggu)

5. **Tambah test untuk alur uang dan kuota.**
   Minimal 6 skenario: pesan → menunggu → akses; lewat 24 jam; kelas penuh;
   cabut akses; paket gratis; siswa tidak bisa baca konten tanpa akses.
   Ini yang paling sering rusak saat ada perubahan.

6. **Hapus `AdminPackageEditorView.tsx` (T-02).**
   Dua editor produk membingungkan dan salah satunya tidak terpakai. Sisakan
   `AdminProductEditorView`.

7. **Pisahkan `seats_taken` dari paket non-kelas (T-07).**
   Saat ini `BUNDLE` gratis menampilkan 27 kursi terisi padahal tidak berkuota.
   Bisa membingungkan admin.

8. **Buat SOP admin satu halaman.**
   Verifikasi mutasi → beri akses → cabut akses → apa yang dilakukan kalau
   siswa komplain. Ini menentukan apakah sistem bisa jalan tanpa Anda.

9. **Sediakan halaman "cek status" untuk siswa.**
   Saat ini siswa yang sudah transfer hanya melihat "Menunggu Konfirmasi".
   Tombol "Buka WhatsApp lagi" akan mengurangi pertanyaan berulang.

### Jangka menengah (1 bulan)

10. **Impor SKD-06..15 ke database.**
    Tiga belas paket masih berupa file lokal. Nilai jualnya besar tetapi belum
    bisa dijual.

11. **Pecah bundle frontend.**
    788 kB utama terlalu besar untuk pengguna mobile. Muat halaman admin dan
    tryout engine secara terpisah sudah dilakukan sebagian; landing page masih
    berat.

12. **Audit visual soal figural.**
    Item bergambar tidak bisa diverifikasi mesin. Ini risiko kualitas terbesar
    yang tersisa di bank soal.

13. **Siapkan rencana QRIS.**
    Struktur sekarang sudah rapi untuk menambah gateway: cukup webhook yang
    memanggil `grant_package`. Siapkan agar tidak perlu membongkar ulang.

### Yang sebaiknya **tidak** dilakukan sekarang

- Menambah fitur baru (event, leaderboard lanjutan, broadcast) sebelum alur uang
  dan kuota teruji. Setiap fitur baru menambah permukaan yang harus diaudit.
- Migrasi framework atau refactor besar. Repo belum punya test yang cukup untuk
  menahan regresi.

---

## 7. Perkiraan usaha

| Fase | Usaha | Keluaran |
|---|---|---|
| 0 | ½ hari | Commit + backup |
| 1 | 1–2 hari | Laporan keamanan & data |
| 2 | 1 hari | Alur bisnis teruji |
| 3 | 2–3 hari | Konten & UX terverifikasi |
| 4 | 1 hari | SOP + rilis |

Total: **6–8 hari kerja** untuk audit penuh, di luar perbaikan temuan.

Perbaikan temuan P0/P1 diperkirakan menambah **2–4 hari**.

---

## 8. Hasil audit 15 November 2026

Audit sudah dijalankan. Ringkasan bukti:

| Pemeriksaan | Hasil |
|---|---|
| Typecheck & build | bersih |
| Uji alur bisnis (19) | 19/19 |
| Uji status paket (9) | 9/9 |
| Uji analytics (7) | 7/7 |
| Uji pemulihan sesi (12) | 12/12 |
| Uji kirim tryout (13) | 13/13 |
| Uji batas akses (8) | 8/8 |
| Keamanan anonim (19) | 19/19 |
| Keamanan siswa login (9) | 9/9 |
| Uji UI Chromium (2) | 2/2 |
| Migrasi lokal vs remote | cocok |

### Temuan yang diperbaiki

| ID | Temuan | Tingkat | Status |
|---|---|---|---|
| AUD-001 | Bukti transfer siswa bisa diunduh publik tanpa login | **P0** | diperbaiki |
| AUD-002 | Kirim tryout dua kali membuat baris hasil dobel | **P1** | diperbaiki |
| AUD-003 | `view_pricing` tidak pernah tercatat (ambang 35% tak tercapai) | P2 | diperbaiki |
| AUD-004 | Funnel analytics bisa melebihi 100% | P2 | diperbaiki |
| AUD-005 | Toast "Koneksi pulih" muncul setiap jawaban berubah | P2 | diperbaiki |
| AUD-006 | Cache soal tidak dibersihkan setelah submit | P3 | diperbaiki |
| AUD-007 | `analytics_events` menerima INSERT tanpa batas dari anonim | P2 | diperbaiki |
| AUD-008 | Migrasi referral menghapus kolom yang masih dipakai trigger | **P1** | diperbaiki |

### Temuan yang diterima risikonya

| ID | Temuan | Alasan |
|---|---|---|
| AUD-009 | Bucket gambar soal bersifat publik | Memang harus bisa ditampilkan; nama file memuat UUID |
| AUD-010 | Anonim bisa mengisi `user_id` sembarang di analytics | Hanya mencemari statistik, tidak menyentuh data bisnis |
| AUD-011 | Progres ujian masih bisa disimpan setelah akses dicabut | Diperlukan agar siswa yang sedang ujian tidak kehilangan jawaban; submit tetap ditolak |

### Catatan perilaku

Constraint unik `(user_id, tryout_id)` membuat **satu hasil per tryout per
siswa**. Mengulang tryout akan memperbarui hasil sebelumnya, bukan menambah
baris baru. `tryout_count` di papan peringkat kini berarti jumlah tryout
berbeda yang dikerjakan, bukan jumlah percobaan.

