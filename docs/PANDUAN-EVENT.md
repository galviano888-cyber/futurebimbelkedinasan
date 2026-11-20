# Panduan Tryout Akbar — Kapasitas & Mitigasi

Catatan ini untuk event besar (misalnya tryout akbar). Ditulis berdasarkan
konfigurasi produksi saat ini: Supabase Free + Vercel Hobby.

## Batas kapasitas (free tier)

| Aspek | Nilai | Catatan |
|---|---|---|
| Egress Supabase | 5 GB/bulan | ±0,35 MB per sesi ujian, jadi bukan pembatas utama |
| Realtime | 200 koneksi | Selama ujian tidak dipakai (halaman ujian tanpa Header/Sidebar) |
| Compute | Shared CPU | Pembatas sebenarnya saat 150+ peserta |
| Backup otomatis | Tidak ada | Wajib backup manual (`npm run db:backup`) |
| Pause proyek | Setelah 7 hari idle | Buka dashboard Supabase sebelum event |

## Rekomendasi jumlah peserta

| Peserta serentak | Status |
|---|---|
| ≤ 60 | Aman tanpa penyesuaian |
| 60–100 | Aman dengan gelombang pendaftaran |
| 100–200 | Batas maksimum; wajib upgrade atau beberapa sesi |
| > 200 | Gunakan Supabase Pro selama bulan event |

## Yang sudah dilakukan di aplikasi

1. **Autosave adaptif** — saat peserta aktif > 60, jeda simpan jawaban ke server
   naik dari 2,5 detik menjadi 8 detik. Posisi soal tetap disimpan seketika di
   perangkat, jadi refresh mendadak tetap aman.
2. **Leaderboard tanpa realtime** — daftar peringkat hanya diperbarui saat
   dibuka atau saat tombol "Muat ulang" ditekan. Ini menghapus lonjakan query
   yang dulu terjadi setiap ada siswa selesai.
3. **Kuota event** — pendaftaran ditutup otomatis saat kuota penuh atau jadwal
   mulai tiba, dengan penguncian di database.
4. **Status "Segera Dibuka"** — paket dapat diumumkan lebih awal tanpa bisa
   dipesan.

## Checklist sebelum event

1. Jalankan `npm run db:backup` (menyimpan 7 backup terakhir).
2. Buka dashboard Supabase agar proyek tidak pause.
3. Pastikan kuota event di panel admin sesuai target peserta.
4. Umumkan jam mulai yang sama; hindari semua peserta menekan "Mulai" serentak
   tanpa jeda 1–2 menit.
5. Setelah event: cek `/events` → leaderboard tampil dan data event tersimpan.

## Setelah event

- Hentikan event (nonaktifkan) agar tidak ada peserta baru.
- Jalankan `npm run db:backup` lagi untuk menyimpan hasil akhir.
- Pengecekan beban: Supabase Dashboard → Reports → Database/API.

## Jika peserta melebihi batas

Naikkan ke Supabase Pro selama bulan event (realtime 500 koneksi, RAM lebih
besar, backup harian). Setelah event selesai, paket bisa diturunkan kembali.
