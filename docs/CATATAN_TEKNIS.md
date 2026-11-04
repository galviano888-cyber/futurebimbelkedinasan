# Catatan Teknis & Risiko Terbuka

Dokumen ini mencatat hal-hal yang diketahui tetapi **belum dikerjakan**, supaya
tidak hilang saat pergantian tim atau sesi kerja.

Terakhir diperbarui: 4 November 2026

---

## 1. Pakasir akan menutup layanan — pembayaran berisiko berhenti

**Status: BELUM DITANGANI. Perlu keputusan pemilik produk.**

### Situasi

Integrasi pembayaran saat ini sepenuhnya bergantung pada Pakasir:

| Komponen | Lokasi |
|---|---|
| Pembuatan QRIS | `supabase/functions/pakasir-create/index.ts` |
| Cek status | `supabase/functions/pakasir-status/index.ts` |
| Aktivasi manual ("Saya Sudah Bayar") | `supabase/functions/pakasir-activate/index.ts` |
| Webhook konfirmasi | `supabase/functions/pakasir-webhook/index.ts` |
| Data QR tersimpan | `transactions.pakasir_data` (jsonb) |
| Metode pembayaran | `transactions.payment_method = 'pakasir_qris'` |

Selain itu, dokumentasi Pakasir yang diperiksa pada audit sebelumnya menyatakan
**API v1 dihentikan 20 Oktober 2026** dan endpoint v2 berbeda. Artinya ada dua
risiko yang menumpuk: penghentian versi API dan penutupan layanan.

### Dampak bila Pakasir benar-benar tutup

- Pembeli tidak bisa membuat QRIS baru.
- Webhook berhenti, sehingga paket tidak aktif otomatis.
- Tombol "Saya Sudah Bayar" gagal karena verifikasi ke API Pakasir gagal.
- Artinya: **penjualan berhenti total**, meskipun website tetap online.

Data lama tetap aman. `transactions`, `user_packages`, dan `payment_events`
tidak bergantung pada server Pakasir.

### Yang perlu diputuskan

1. Pindah ke payment gateway lain (Midtrans, Xendit, Tripay, Duitku, atau QRIS
   langsung via bank).
2. Atau kembali ke transfer manual + verifikasi admin (fitur
   `AdminTransactionManager` sudah ada).

### Titik perubahan bila migrasi dilakukan

Migrasi sebaiknya hanya menyentuh tiga hal, karena logika bisnis sudah dipisah:

```
1. Edge Function baru      : membuat transaksi di gateway baru
2. Webhook / verifikasi    : memanggil grant_package(transaction_id)
3. Frontend InvoiceView    : menampilkan QR/instruksi dari gateway baru
```

`grant_package()` di database **tidak perlu diubah** — fungsi itu sudah menjadi
satu-satunya pintu pemberian akses, dan hanya bisa dipanggil oleh service role.
`create_order()` juga tidak perlu diubah karena harga sudah diambil dari database.

### Prinsip yang harus dipertahankan saat migrasi

- Nominal tidak boleh dikirim dari klien; selalu dari `packages.price`.
- Webhook wajib memverifikasi ulang ke API gateway sebelum memberi akses.
- Pemberian akses harus idempotent (aman bila webhook terkirim dua kali).
- Simpan jejak audit setiap event pembayaran.

### Tindakan mendesak (tanpa menulis kode)

1. Cek pengumuman resmi Pakasir mengenai tanggal penutupan.
2. Pastikan tidak ada QRIS aktif yang masih ditampilkan ke pembeli.
3. Siapkan jalur cadangan: transfer manual dengan konfirmasi admin.
4. Bila sudah ada calon gateway pengganti, siapkan akun dan kredensialnya.

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
| Alur pembayaran end-to-end | Belum diuji dengan transaksi nyata. |
| Panel admin | Aksi CRUD belum diuji lewat UI; hanya hak akses RPC yang sudah diverifikasi. |
| Ukuran bundle | Utama ±788 kB (237 kB gzip). Bisa dipecah bila perlu. |
| Tiga keluarga font | Inter, Plus Jakarta Sans, Poppins dimuat sekaligus. |
| `public_profiles` dan `leaderboard_public` | Nama disamarkan untuk anonim, tetapi tetap menampilkan nama lengkap untuk pengguna login. |
| Tabel `package_schedules` | Sudah dihapus (kosong, tidak dipakai). |
