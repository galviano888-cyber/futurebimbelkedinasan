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

Angka di bawah berasal dari uji beban nyata terhadap database produksi
(`node scripts/load-test-event.mjs`) pada 20 November 2026. Setiap tingkat
menjalankan 4 panggilan per peserta: mulai sesi, ambil soal, simpan progres,
dan hitung peserta aktif.

| Peserta serentak | Hasil uji | Status |
|---|---|---|
| 10 | 0% error, p95 277 ms | Aman |
| 25 | 0% error, p95 771 ms | Aman |
| 50 | 0% error, p95 971 ms | Aman |
| 80 | 0% error, p95 1.491 ms | Aman |
| 120 | 0% error, p95 1.958 ms | Mulai melambat |
| 160 | 0% error, p95 3.319 ms | Pelan, mendekati batas |

Pola: tidak ada kegagalan sampai 160 peserta, tetapi waktu tunggu naik sekitar
2,8× dari 10 ke 160 peserta. Kenaikan ini berasal dari compute bersama pada
paket Free, bukan dari error aplikasi.

Kesimpulan praktis:

- **≤ 100 peserta**: aman untuk tryout akbar.
- **100–160**: masih berjalan, tetapi hal pertama yang dikorbankan adalah
  kecepatan; sebaiknya gelombang pendaftaran.
- **> 160**: uji ulang dulu atau naikkan ke Supabase Pro untuk bulan event.

Catatan penting: login pengguna baru dibatasi rate limit Supabase (429) bila
banyak akun masuk dalam hitungan detik. Pengumuman jam mulai yang sama sudah
aman karena siswa login lebih awal; hindari minta semua peserta login serentak.


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
