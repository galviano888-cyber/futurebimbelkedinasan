# Future Bimbel Kedinasan

Platform tryout SKD dan bimbel kedinasan. React + Vite + TypeScript + Tailwind +
Supabase, dideploy di Vercel.

## Quick start

```bash
npm ci
cp .env.example .env.local   # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

| Script | Fungsi |
|--------|--------|
| `npm run dev` | Vite dev server |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm run build` | Typecheck + production build |
| `npm run test:e2e` | Playwright |
| `npm run db:diff` | Bandingkan migration repo dengan project linked |
| `npm run db:push` | Terapkan migration ke project linked |

## Struktur

```
src/                  Aplikasi React (UI)
  lib/payment.ts      Rekening, nomor admin, format pesan WhatsApp
supabase/
  migrations/         Source of truth schema (urut nama file)
  legacy/             SQL lama — JANGAN dijalankan
supabase/config.toml  Konfigurasi Supabase CLI
tests/                Playwright
```

## Alur pembelian paket

Tidak ada invoice dan tidak ada payment gateway. Alurnya:

1. Siswa klik **Pesan via WA** di katalog.
2. Server mencatat permintaan selama 24 jam (`request_package_access`).
3. WhatsApp admin terbuka dengan pesan berisi nama, email, paket, nominal, dan
   rekening tujuan.
4. Siswa transfer dan mengirim bukti di chat.
5. Di web muncul status **Menunggu Konfirmasi Admin** beserta sisa waktunya.
6. Admin memeriksa mutasi, lalu memberi akses dari panel (Siswa → Beri Paket,
   atau tombol **Beri Akses** di menu Permintaan Paket).
7. Lewat 24 jam tanpa konfirmasi, status hilang sendiri dan siswa bisa memesan
   ulang.

Rekening dan nomor WhatsApp diambil dari `site_settings` (`bank_details` dan
`official_contacts`), bisa diubah di panel admin → Landing Page.

## Keamanan

- `VITE_*` adalah satu-satunya variabel yang masuk ke browser.
- `service_role` hanya diset sebagai Supabase secret.
- Admin ditentukan oleh `app_metadata.role = 'admin'`, bukan email.
- Harga, skor tryout, dan akses paket dihitung di server (RPC).
- Tabel `profiles`, `tryout_questions`, `transactions`, `user_packages`, dan
  `tryout_results` tidak boleh ditulis langsung dari client.

## Deployment

1. Push ke GitHub.
2. Vercel: set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` untuk
   Production dan Preview.
3. Supabase: jalankan workflow **Supabase deploy (manual)** atau:

   ```bash
   npm run db:push
   ```
