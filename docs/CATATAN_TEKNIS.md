# Catatan Teknis & Risiko Terbuka

Dokumen ini mencatat hal-hal yang diketahui tetapi **belum dikerjakan**, supaya
tidak hilang saat pergantian tim atau sesi kerja.

Terakhir diperbarui: 14 November 2026

---

## 1. Pembayaran: WhatsApp + akses manual admin (tanpa invoice)

**Status: SELESAI. QRIS/Pakasir dihapus. Tidak ada invoice, tidak ada kode bayar.**

### Alur yang berjalan sekarang

```
Siswa klik "Pesan via WA"
   → request_package_access()  → penanda "menunggu konfirmasi" selama 24 jam
   → WhatsApp admin terbuka, pesan sudah berisi nama, email, paket, nominal,
     rekening tujuan, dan 5 langkah pembayaran
   → Siswa transfer + kirim bukti di chat
   → Di web: status "Menunggu Konfirmasi Admin" (sisa waktu tampil)
   → Admin cek mutasi, lalu beri akses dari panel:
     Siswa → pilih siswa → Beri Paket  (atau tombol "Beri Akses" di Permintaan Paket)
   → Paket muncul di "Paket Saya"; status menunggu otomatis hilang
```

**Lewat 24 jam tanpa konfirmasi:** penanda kedaluwarsa, kartu paket kembali
normal (tombol "Pesan via WA" muncul lagi). Yang menyembunyikan status adalah
filter `expiry_date > now()` di `TryoutView` dan `DashboardView`, jadi tidak
perlu cron/cleanup.

| Komponen | Lokasi |
|---|---|
| Format pesan + rekening + nomor WA | `src/lib/payment.ts` |
| Buat penanda 24 jam | RPC `request_package_access(uuid)` |
| Tutup penanda saat admin beri akses | trigger `trg_close_fulfilled_requests` pada `user_packages` |
| Beri akses dari panel | `AdminUserManager` (Beri Paket) atau `admin_confirm_payment` dari `AdminTransactionManager` |
| Status menunggu di katalog | `src/components/views/TryoutView.tsx` |
| Status menunggu di dashboard | `src/components/views/DashboardView.tsx` |

Tabel `transactions` tetap dipakai sebagai penanda permintaan, tetapi hanya
menyimpan paket, nominal, dan masa berlaku — bukan invoice yang ditampilkan ke
siswa. `payment_method` = `manual_transfer`, `invoice_id` hanya ID internal.

### Yang sudah dihapus

- `src/components/views/InvoiceView.tsx` (halaman invoice)
- `src/lib/pakasir.ts`
- `supabase/functions/pakasir-*` (lokal dan yang ter-deploy)
- Script `functions:deploy` di `package.json`
- Origin `app.pakasir.com` di CSP `vercel.json`
- RPC lama `create_order()` dan `mark_payment_submitted()` (migrasi
  `20261114160100_drop_unused_order_rpcs.sql`)

Kolom `transactions.pakasir_data` masih ada di database tetapi tidak dipakai.
Boleh dibiarkan.

### Saat QRIS diaktifkan kembali

1. Pilih gateway (Midtrans, Xendit, Tripay, Duitku, atau QRIS bank langsung).
2. Buat Edge Function pembuat transaksi + webhook.
3. Webhook cukup memanggil `grant_package(transaction_id)`; trigger
   `close_fulfilled_requests` akan menutup penanda otomatis.
4. Tambahkan kartu QRIS di katalog (sekarang tidak ada UI QRIS sama sekali).

**Prinsip yang wajib dipertahankan:**

- Nominal tidak boleh dikirim dari klien; selalu dari `packages.price`.
- Webhook wajib memverifikasi ulang ke API gateway sebelum memberi akses.
- Pemberian akses harus idempotent (aman bila webhook terkirim dua kali).
- Simpan jejak audit setiap event pembayaran.

### Risiko operasional alur manual

- Akses hanya terbuka setelah admin memberi paket. Pastikan admin memeriksa
  mutasi rekening, bukan hanya screenshot bukti transfer.
- Tidak ada unggah bukti transfer di aplikasi — riwayatnya ada di WhatsApp.
- Nominal transfer harus tepat; tidak ada pencocokan otomatis mutasi bank.
- Rekening dibaca dari `site_settings.bank_details` (bisa diubah di panel admin
  → Landing Page → Bank). Fallback ke nilai di `src/lib/payment.ts`.

---

## 2. Backup database belum tersedia

Plan Supabase Free tidak menyediakan backup otomatis. Data produksi saat ini:

```
profiles 91 | tryout_results 81 | transactions 4 | user_packages 29
tryout_questions 550 | packages 2 | events 0 | notifications 2
```

Rekomendasi: ekspor berkala (`supabase db dump`) dan simpan di luar Supabase,
atau upgrade plan.

---

## 3. Hal teknis lain yang belum dikerjakan

| Item | Catatan |
|---|---|
| Redirect apex → www | Masih 307 karena aturan di dashboard Vercel mengalahkan `vercel.json`. Ubah di Vercel → Domains → Edit untuk mendapat 308. |
| Alur pembayaran end-to-end | Alur WA → transfer → admin beri akses belum diuji dengan transaksi nyata. |
| Rekening tujuan | Dibaca dari `site_settings.bank_details`; ubah di panel admin → Landing Page → Bank. Fallback: `src/lib/payment.ts`. |
| Nomor rekening di pesan WA | Sudah otomatis ikut ke pesan, jadi siswa tidak perlu menanyakan tujuan transfer. |
| Panel admin | Aksi CRUD belum diuji lewat UI; hanya hak akses RPC yang sudah diverifikasi. |
| Ukuran bundle | Utama ±788 kB (237 kB gzip). Bisa dipecah bila perlu. |
| Tiga keluarga font | Inter, Plus Jakarta Sans, Poppins dimuat sekaligus. |
| `public_profiles` dan `leaderboard_public` | Nama disamarkan untuk anonim, tetapi tetap menampilkan nama lengkap untuk pengguna login. |
| Tabel `package_schedules` | Sudah dihapus (kosong, tidak dipakai). |

---

## 4. Tipe paket dan kuota kelas

Tipe yang tersedia (`packages.product_type`):

| Tipe | Isi | Kuota |
|---|---|---|
| `SATUAN` | Satu tryout | — |
| `BUNDLE` | Beberapa tryout | — |
| `INTENSIF` | Live class + materi + tryout | — |
| `KELAS` | Bimbingan kelompok | **Maks 5 orang** |
| `PRIVAT_SATUAN` | Privat 1 pertemuan | — |
| `PRIVAT_PAKET` | Privat beberapa pertemuan | — |

Nama tipe lama `PRIVAT` masih diterima dan ditampilkan sebagai "Privat Satuan".

### Aturan kuota kelas

- Kuota terisi **hanya saat admin memberi akses** (`user_packages`), bukan saat
  siswa chat.
- Ditegakkan di database lewat trigger `trg_enforce_package_quota`
  (`before insert on user_packages`), jadi tidak bisa ditembus lewat panel
  maupun API.
- Akses dicabut → kursi berkurang otomatis (`trg_release_package_seat`).
  Siswa harus diberi akses ulang untuk masuk lagi.
- Kelas penuh: permintaan chat ditolak dan katalog menampilkan "Kelas Penuh".
- Paket `KELAS` tanpa kuota otomatis diberi kuota 5.

Sudah diuji otomatis: chat tidak mengisi kursi, kursi naik saat akses diberikan,
siswa berikutnya ditolak saat penuh, dan kursi kembali 0 setelah akses dilepas.

### Kode siswa

Setiap siswa punya `profiles.student_code` berformat `FBK-0001`. Dipakai admin
untuk mencari siswa tanpa mengandalkan nama atau email. Terlihat di panel
admin (menu Siswa) dan di halaman Profil siswa.
