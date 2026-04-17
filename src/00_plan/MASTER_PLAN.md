# LMS Development Master Plan
# Future Bimbel Kedinasan — futurebimbelkedinasan

Platform: React (TypeScript) + Vite + Tailwind CSS + Supabase
Status Terakhir: April 2026

---

## Ringkasan Fase

| Fase | Nama                       | Status      | Prioritas  |
|------|----------------------------|-------------|------------|
| 1    | Fondasi & Autentikasi      | ✅ Selesai  | Critical   |
| 2    | Landing Page & Pemasaran   | ✅ Selesai  | Critical   |
| 3    | Platform Belajar (MVP)     | 🔄 Berjalan | High       |
| 4    | Sistem Akses & Voucher     | ⏳ Planned  | High       |
| 5    | Panel Admin                | ⏳ Planned  | Medium     |
| 6    | Fitur Lanjutan & Skalabilitas | ⏳ Planned | Low     |

---

## Fase 1 — Fondasi & Autentikasi ✅

**Goal:** Web bisa diakses, user bisa daftar dan masuk dengan akun nyata.

### Checklist
- [x] Setup project (Vite + React + TypeScript + Tailwind)
- [x] Instalasi shadcn/ui + framer-motion + lucide-react
- [x] Konfigurasi Supabase (Project URL + Anon Key di .env.local)
- [x] Komponen Header (dengan notifikasi, user dropdown)
- [x] Komponen Sidebar (navigasi multi-menu)
- [x] Sistem Login via Supabase Auth (signInWithPassword)
- [x] Sistem Registrasi (signUp dengan full_name di user_metadata)
- [x] Session Persistence (onAuthStateChange listener)
- [x] Tampilkan Nama Lengkap user setelah login (Header, Sidebar, Dashboard)
- [x] Validasi: Password salah → ditolak, tidak buat akun baru
- [x] Validasi: Wajib centang Syarat & Ketentuan sebelum masuk/daftar
- [x] Script SQL awal: tabel `tryout_results` dengan Row Level Security (RLS)

---

## Fase 2 — Landing Page & Pemasaran ✅

**Goal:** Halaman depan publik yang menarik untuk mengkonversi pengunjung menjadi pendaftar.

### Checklist
- [x] Navbar landing page (Logo FBK + Tombol Masuk/Daftar)
- [x] Hero Section (Foto taruna + Judul promosi + Tombol CTA)
- [x] Statistik sosial proof (angka kelulusan)
- [x] Bagian Keunggulan / Features (3 poin)
- [x] Bagian Katalog Paket (Banner Batch 1 di TryoutView)
- [x] Footer sederhana
- [x] Routing: Landing Page tampil jika user belum login; Dashboard jika sudah login
- [ ] **[TODO]** Menambahkan Bagian Testimoni Alumni (setelah ada data nyata)
- [ ] **[TODO]** SEO meta tags (title, description, og:image)

---

## Fase 3 — Platform Belajar MVP 🔄

**Goal:** Siswa yang sudah beli paket bisa mengakses konten belajarnya.

### 3A. Halaman "Paket Saya"
- [x] Desain UI Accordion (buka/tutup per paket)
- [x] Ikon per jenis konten (PDF, Video, Tryout)
- [ ] **[TODO]** Koneksi ke Supabase: ambil paket berdasarkan `user_id`
- [ ] **[TODO]** State kosong jika belum punya paket: tampilkan CTA beli

### 3B. Modul Materi Belajar
- [ ] Viewer/embed PDF via URL (Google Drive embed / Supabase Storage)
- [ ] Embed video Zoom recording atau YouTube
- [ ] Progress tracking: tandai materi sudah dibaca/ditonton

### 3C. Modul Tryout Interaktif
- [ ] Halaman pengerjaan soal pilihan ganda (timer)
- [ ] Halaman hasil dan skor otomatis (TWK, TIU, TKP)
- [ ] Simpan hasil tryout ke tabel `tryout_results` di Supabase
- [ ] Riwayat tryout tampil di Dashboard (grafik & tabel)

### 3D. Jadwal Ujian
- [ ] Halaman Jadwal Ujian — tampilkan jadwal Tryout/Live Class
- [ ] Sambungkan ke Google Calendar atau tabel `events` di Supabase

---

## Fase 4 — Sistem Akses & Voucher ⏳

**Goal:** Admin bisa memberikan akses paket ke siswa tanpa Payment Gateway mahal.

### Checklist
- [ ] Buat tabel `packages` di Supabase (id, name, description, contents)
- [ ] Buat tabel `user_packages` di Supabase (user_id, package_id, activated_at)
- [ ] Buat tabel `voucher_codes` (code, package_id, is_used, used_by)
- [ ] Halaman "Aktivasi Voucher" untuk siswa (input kode → akses terbuka)
- [ ] Logika: cek voucher valid → insert ke `user_packages` → tampil di Paket Saya
- [ ] RLS Supabase: pastikan user hanya bisa lihat data miliknya sendiri

---

## Fase 5 — Panel Admin ⏳

**Goal:** Admin internal FBK bisa mengelola platform tanpa perlu akses langsung ke database Supabase.

### Checklist
- [ ] Route `/admin` yang hanya bisa diakses Role Admin/Super Admin
- [ ] Dashboard Admin: statistik (jumlah user, paket aktif, dll)
- [ ] Manajemen User: daftar semua user, search, buka/cabut akses paket
- [ ] Manajemen Konten: upload PDF/video, buat paket baru, atur isi paket
- [ ] Generator Voucher: buat batch kode voucher, tandai yang sudah terpakai
- [ ] Laporan: rekap transaksi manual (untuk Super Admin)

---

## Fase 6 — Fitur Lanjutan & Skalabilitas ⏳

**Goal:** Platform siap untuk ratusan/ribuan pengguna dan fitur ekosistem lengkap.

### Checklist
- [ ] Integrasi Payment Gateway (Midtrans/Xendit) untuk pembelian otomatis
- [ ] Notifikasi real-time (Supabase Realtime) — pengumuman baru, soal baru
- [ ] Forum diskusi / komentar per materi
- [ ] Sistem peringkat (leaderboard) antar siswa per batch
- [ ] Halaman Profil Siswa (foto profil, riwayat tryout, sertifikat)
- [ ] Versi Mobile responsif yang disempurnakan (PWA)
- [ ] Custom domain + SSL (misal: app.futurebimbelkedinasan.id)
- [ ] Fitur Testimoni: form input dan tampilan publik

---

## Deployment Roadmap

| Langkah | Task                                       | Catatan                            |
|---------|--------------------------------------------|------------------------------------|
| 1       | ✅ Push kode ke GitHub                     | Repo: galviano888-cyber/futurebimbelkedinasan |
| 2       | ✅ Hubungkan repo ke Vercel                | Import project dari GitHub         |
| 3       | ✅ Isi Environment Variables di Vercel     | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |
| 4       | ✅ Deploy pertama — verifikasi live        | Cek semua halaman berjalan normal  |
| 5       | Sambungkan custom domain                   | Beli domain, setting DNS ke Vercel |
| 6       | Aktifkan HTTPS otomatis                    | Vercel handle ini otomatis         |
