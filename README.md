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
| `npm run functions:deploy` | Deploy Edge Functions |

## Struktur

```
src/                  Aplikasi React (UI)
supabase/
  migrations/         Source of truth schema (urut nama file)
  functions/          Edge Functions (Pakasir)
  legacy/             SQL lama — JANGAN dijalankan
supabase/config.toml  Konfigurasi Supabase CLI
tests/                Playwright
```

## Keamanan

- `VITE_*` adalah satu-satunya variabel yang masuk ke browser.
- `service_role` dan `PAKASIR_*` hanya diset sebagai Supabase secrets.
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
   npm run db:diff
   npm run db:push
   npm run functions:deploy
   ```

4. Set secrets Edge Functions:

   ```bash
   supabase secrets set PAKASIR_SLUG=... PAKASIR_API_KEY=...
   ```

5. Daftarkan webhook Pakasir ke:
   `https://<project-ref>.supabase.co/functions/v1/pakasir-webhook`
   Function memeriksa project, order, nominal, lalu mengonfirmasi ulang ke API
   Pakasir sebelum memberi akses.
