# Arsitektur & Struktur File
# Future Bimbel Kedinasan

---

## Tech Stack

| Layer        | Teknologi                          |
|--------------|------------------------------------|
| Frontend     | React 18 + TypeScript + Vite       |
| Styling      | Tailwind CSS + shadcn/ui           |
| Animasi      | Framer Motion                      |
| Ikon         | Lucide React                       |
| Backend/Auth | Supabase (PostgreSQL + Auth)       |
| Hosting      | Vercel (planned)                   |
| Repo         | GitHub                             |

---

## Struktur Direktori (`src/`)

```
src/
├── 00_plan/                     # 📋 Dokumen perencanaan (tidak ikut di-build)
│   ├── MASTER_PLAN.md           # Rencana pengembangan per fase
│   ├── ROLES.md                 # Definisi role & permission matrix
│   └── ARCHITECTURE.md          # File ini — struktur & arsitektur
│
├── components/
│   ├── views/                   # Halaman-halaman utama (1 file = 1 halaman)
│   │   ├── LandingPageView.tsx  # Halaman depan publik (Hero, Features)
│   │   ├── DashboardView.tsx    # Dashboard siswa (statistik, grafik)
│   │   ├── TryoutView.tsx       # Katalog paket & tryout SKD
│   │   ├── PaketSayaView.tsx    # Akses konten yang sudah dibeli (accordion)
│   │   ├── ContactView.tsx      # Halaman Pusat Bantuan & Kontak
│   │   ├── EmptyView.tsx        # Placeholder untuk halaman belum jadi
│   │   ├── MateriView.tsx       # (Legacy, akan digabung ke PaketSaya)
│   │   └── TestimoniView.tsx    # (Legacy, belum diaktifkan di menu)
│   │
│   ├── ui/                      # Komponen shadcn/ui (jangan diedit manual)
│   │
│   ├── Header.tsx               # Navbar atas (notif, profil, login modal)
│   ├── Sidebar.tsx              # Panel navigasi kiri
│   ├── ActivePackage.tsx        # Widget paket aktif di Dashboard
│   ├── HistoryTable.tsx         # Tabel riwayat tryout
│   ├── PerformanceChart.tsx     # Grafik performa SKD
│   ├── StatCards.tsx            # Kartu statistik (TWK, TIU, TKP)
│   └── LoadingSkeleton.tsx      # Animasi loading screen
│
├── lib/
│   ├── supabaseClient.ts        # Inisialisasi koneksi Supabase
│   └── utils.ts                 # Fungsi utilitas (cn, dll)
│
├── data/
│   └── mockData.ts              # Data dummy (akan dihapus setelah DB siap)
│
├── hooks/                       # Custom React hooks (jika ada)
├── types/                       # Definisi TypeScript (TryoutRecord, dll)
│
├── App.tsx                      # Root komponen — routing & auth state
├── main.tsx                     # Entry point React
└── index.css                    # Global styles
```

---

## Database Schema (Supabase)

### Tabel yang Sudah Ada
```sql
-- Dikelola oleh Supabase Auth secara otomatis
auth.users (id, email, user_metadata: { full_name })

-- Dibuat manual via SQL Editor
tryout_results (id, user_id, date, package_name, twk, tiu, tkp, total)
```

### Tabel yang Direncanakan (Fase 4-5)
```sql
packages (id, name, description, price, is_active)
package_contents (id, package_id, type[pdf|video|tryout], title, url, order)
user_packages (id, user_id, package_id, activated_at, expires_at)
voucher_codes (id, code, package_id, is_used, used_by_user_id, used_at)
events (id, title, date, zoom_link, description)  -- untuk Jadwal Ujian
```

---

## Alur Autentikasi

```
User buka web
   │
   ├─→ Supabase cek session (getSession)
   │       │
   │       ├─→ Ada session? → Langsung ke Dashboard (showLanding = false)
   │       └─→ Tidak ada? → Tampilkan Landing Page (showLanding = true)
   │
   └─→ Klik "Mulai Belajar" di Landing Page
           │
           └─→ Header Modal muncul (mode: Login / Register)
                   │
                   ├─→ Login: signInWithPassword → onAuthStateChange trigger
                   └─→ Register: signUp (+ full_name) → onAuthStateChange trigger
                           │
                           └─→ setIsAuthenticated(true) → showLanding(false) → Dashboard
```

---

## Environment Variables (.env.local)

```
VITE_SUPABASE_URL=https://pqldicelvmjljwuabehf.supabase.co
VITE_SUPABASE_ANON_KEY=<ISI_DENGAN_ANON_KEY_DARI_SUPABASE_DASHBOARD>
```

> ⚠️ File `.env.local` TIDAK boleh di-commit ke GitHub (sudah ada di .gitignore).
> Untuk Vercel, isi Environment Variables ini di menu Project Settings → Environment Variables.
