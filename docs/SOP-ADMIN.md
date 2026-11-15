# SOP Admin — Future Bimbel Kedinasan

Panduan operasional harian. Tidak perlu developer untuk menjalankan semua ini.

**Panel admin:** `https://www.futurebimbelkedinasan.com/x7k2m9qp4n8vw3js`

---

## 1. Menangani siswa yang ingin membeli paket

### Alur yang terjadi

```
Siswa klik "Pesan via WA"
  → WhatsApp Anda terbuka, pesan sudah berisi nama, email, paket, nominal, rekening
  → Siswa transfer, kirim bukti di chat
  → Di web siswa melihat "Menunggu Konfirmasi Admin" selama 24 jam
  → Anda cek mutasi, lalu beri akses
  → Paket langsung aktif di menu "Paket Saya"
```

### Langkah Anda

1. **Buka WhatsApp.** Pesan masuk sudah lengkap. Catat: nama, email, paket, nominal.
2. **Cek mutasi rekening BRI `0356 0108 9005 505` a.n. Galih Oktaviano.**
   - Nominal harus **tepat** sesuai yang tertulis di pesan.
   - Jangan hanya percaya screenshot — bukti transfer bisa dipalsukan.
   - Cocokkan tanggal dan jam dengan waktu pesan masuk.
3. **Beri akses** di panel admin, dua cara (pilih salah satu):
   - **Permintaan Paket** → cari nama siswa → tombol **Beri Akses**
   - **Siswa** → cari siswa → **Beri Paket** → pilih paket
4. **Balas WhatsApp** siswa bahwa akses sudah aktif.

### Kalau dana tidak masuk

Jangan beri akses. Balas: "Pembayaran belum kami terima, mohon dicek kembali." Status menunggu akan hilang sendiri setelah 24 jam dan siswa bisa memesan ulang.

### Kalau nominal kurang

Minta siswa transfer kekurangan, atau kembalikan dan minta transfer ulang sesuai nominal. Jangan memberi akses sebagian.

---

## 2. Mencari siswa

Gunakan menu **Siswa**. Pencarian menerima tiga hal:

| Yang dicari | Contoh |
|---|---|
| **Kode siswa** | `FBK-0007` |
| Nama | `mozzaik` |
| Email | `mozzaikabdullah1@gmail.com` |

**Kode siswa** adalah cara paling aman karena unik. Minta siswa menyebutkannya bila nama terlalu umum. Kode juga terlihat di halaman **Profil** siswa.

---

## 3. Mencabut akses

Menu **Siswa** → cari siswa → **Cabut** pada paket yang ingin dicabut.

Efeknya:

- Siswa langsung tidak bisa membuka paket.
- **Penjualan otomatis dibatalkan** — hilang dari grafik omzet, tapi tetap tersimpan sebagai riwayat (`cancelled`).
- Kalau kursi kelas, kursi kembali kosong.

Kalau siswa diberi akses lagi, penjualan yang sama **diaktifkan kembali** — tidak dihitung dua kali.

Gunakan ini untuk: pembatalan, refund, atau salah beri paket.

---

## 4. Mengelola paket

Menu **Produk** → **Tambah Produk**.

Setiap kartu produk menampilkan status kelengkapan:

| Badge | Arti |
|---|---|
| 🟢 **Siap · N konten** | Semua konten punya tautan yang bisa dipakai siswa |
| 🔴 **X dari N konten belum lengkap** | Ada konten tanpa tautan — siswa akan melihat "Belum ada" |
| 🟡 **Belum ada konten** | Paket kosong. **Jangan dijual.** |

**Aturan penting: jangan aktifkan paket berbayar sebelum badge hijau.** Siswa yang membayar akan kecewa kalau isinya kosong.

### Tipe paket

| Tipe | Isi | Kuota |
|---|---|---|
| Tryout Satuan | 1 tryout | — |
| Bundle Tryout | Beberapa tryout | — |
| Paket Intensif | Live class + materi + tryout | — |
| Paket Kelas | Bimbingan kelompok | **Maks 5 orang** |
| Privat Satuan | 1 pertemuan | — |
| Privat Paket | Beberapa pertemuan | — |

### Kuota kelas

Kursi **hanya terisi saat Anda memberi akses**, bukan saat siswa chat. Jadi:

- 3 siswa chat → masih 0/5
- Anda beri akses ke 3 siswa → 3/5
- Siswa ke-6 ditolak otomatis oleh sistem

Saat penuh, tombol di katalog berubah **"Kuota Penuh (5/5)"** dan tidak bisa diklik.

Untuk menambah peserta: cabut akses satu siswa dulu, atau ubah kuota paket (maksimal 5).

---

## 5. Memasukkan soal tryout

1. Menu **Bank Soal** → **Import JSON**.
2. Pilih file paket (mis. `SKD-01.json`).
3. Setelah terimpor, buka **Produk** → edit paket → **Tambah Konten** → pilih **Tryout**.
4. Pilih tryout yang baru diimpor. Kolom `tryout_id` harus terisi.

**Periksa:** setelah dihubungkan, badge konten di kartu produk harus berubah jadi hijau. Kalau masih merah, tryout belum tertaut dan siswa tidak bisa mengerjakannya.

---

## 6. Melihat penjualan

Menu **Permintaan Paket** menampilkan:

| Kolom | Arti |
|---|---|
| Paket | Nama paket yang diberikan |
| Siswa | Nama + email |
| Nominal | Harga saat akses diberikan |
| Status | **Akses Aktif** / **Dibatalkan** / **Menunggu Konfirmasi** / **Kedaluwarsa** |
| Tanggal | Kapan dicatat |

**Grafik omzet** hanya menghitung transaksi berstatus `success`:

- Beri akses → omzet naik
- Cabut akses → omzet turun
- Beri akses lagi → omzet naik lagi, tidak dobel

Paket gratis tetap tercatat sebagai penjualan dengan nominal Rp 0.

---

## 7. Kalau ada masalah

| Gejala | Penyebab umum | Tindakan |
|---|---|---|
| Siswa bilang tidak bisa buka paket | Akses belum diberikan | Cek menu Siswa, cari kode siswa |
| Tombol "Mulai Tryout" abu-abu | `tryout_id` belum diisi | Edit produk → hubungkan tryout |
| Konten tampil "Belum ada" | Tautan Zoom/rekaman belum diisi | Edit produk → isi link |
| Kelas tidak bisa ditambah | Kuota 5 sudah penuh | Cabut akses siswa lain dulu |
| Grafik omzet tidak berubah | Transaksi berstatus `cancelled` | Beri akses ulang |
| Siswa tidak menemukan invoice | Memang tidak ada invoice | Semua lewat WhatsApp |
| Data hilang / salah | — | Hubungi developer, jangan edit database manual |

---

## 8. Yang **jangan** dilakukan

- **Jangan** memberi akses sebelum dana masuk.
- **Jangan** mengaktifkan paket berbayar dengan badge merah atau kuning.
- **Jangan** mengubah harga paket yang sudah ada pembelinya — gunakan paket baru.
- **Jangan** menghapus paket yang punya akses siswa. Hapus paket akan menghapus semua akses dan kontennya sekaligus.
- **Jangan** mengedit database langsung lewat SQL Editor tanpa backup.

---

## 9. Backup

Backup data manual (butuh akses developer):

```bash
node scripts/backup-data.mjs
```

Hasil tersimpan di folder `backups/<tanggal-jam>/`. Folder ini tidak masuk git.

Lakukan backup sebelum: mengimpor soal massal, menghapus paket, atau mengubah data siswa banyak sekaligus.
