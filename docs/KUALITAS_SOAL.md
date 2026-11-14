# Standar Kualitas Soal SKD

Dokumen ini dipakai untuk menilai dan memperbaiki bank soal. Semua kriteria di
bawah ini bisa diukur, bukan sekadar selera.

## 1. Prinsip utama: opsi harus bersaing, bukan kontras

Soal yang baik membuat siswa **membandingkan**, bukan **menebak**. Kalau satu opsi
jelas benar dan empat opsi jelas salah, soal itu tidak mengukur apa pun.

Ciri opsi yang kontras (buruk):

- pengecoh berupa sikap ekstrem: *membiarkan, mengabaikan, menolak semua,
  menyalahkan, membalas, diam saja*
- pengecoh tidak masuk akal secara situasi
- satu opsi jauh lebih panjang dan lebih lengkap daripada yang lain
- satu opsi satu-satunya yang menyebut tindakan konkret

Ciri opsi yang bersaing (baik):

- kelimanya adalah tindakan yang **mungkin dilakukan orang kompeten**
- perbedaannya terletak pada prioritas, urutan, atau cakupan
- panjang opsi seimbang (±20% antar opsi)
- pengecoh mengandung sebagian kebenaran, sehingga harus dinilai, bukan dibuang

Contoh:

| Buruk | Baik |
|---|---|
| A. Membiarkan saja | A. Menunggu sistem pulih sambil mencatat warga yang hadir |
| B. Menyalahkan rekan | B. Melayani manual untuk berkas mendesak, sisanya dijadwalkan ulang |
| C. Melaporkan ke atasan | C. Mengumumkan gangguan, membuka layanan manual, dan memberi estimasi |
| D. **Membuka layanan manual, mengumumkan, memberi estimasi** | D. Menutup layanan sementara dan mengalihkan warga ke kanal daring |
| E. Menutup kantor | E. Meminta warga kembali besok dengan prioritas antrean |

## 2. Kriteria terukur

### 2.1 Keseimbangan panjang opsi

```
selisih = panjang opsi terpanjang − panjang opsi terpendek
```

| Selisih | Penilaian |
|---|---|
| ≤ 25 karakter | baik |
| 26–49 | perlu diperbaiki |
| ≥ 50 | cacat |

Selain itu, **kunci tidak boleh menjadi opsi terpanjang** dengan selisih lebih
dari 30 karakter. Ini adalah kebocoran paling umum: penulis menuliskan jawaban
lengkap, lalu pengecoh singkat.

### 2.2 Sebaran kunci

Dalam satu paket 110 soal:

- TWK 30 soal → tiap huruf idealnya 6
- TIU 35 soal → tiap huruf idealnya 7
- TKP 45 soal → tiap huruf skor tertinggi idealnya 9

Toleransi ±2. Jika satu huruf muncul lebih dari 40% jawaban, siswa bisa lulus
dengan menebak.

### 2.3 Pengecoh harus substantif

Untuk TWK/TIU, hitung jumlah pengecoh yang mengandung penanda "jelas salah".
Jika ≥ 3 dari 4 pengecoh mengandung penanda itu, soal dianggap cacat.

### 2.4 Pembahasan

- menjelaskan **mengapa** kunci benar dan mengapa pengecoh kalah
- tidak sekadar mengulang hitungan tanpa alasan (khusus TIU, langkah hitung boleh,
  tetapi harus disertai alasan pemilihan)
- minimal 60 karakter
- **tidak boleh menyebut huruf opsi** kecuali hurufnya benar-benar sesuai dengan
  urutan akhir. Rujukan huruf yang salah adalah cacat fatal.

### 2.5 TKP

- kelima opsi adalah perilaku yang realistis
- skor 1–5, minimal satu opsi bernilai 5
- opsi dengan skor 5 bukan sekadar "yang paling lengkap", tetapi yang paling
  tepat secara prioritas dan etika
- tidak ada opsi yang mustahil dilakukan

### 2.6 Duplikasi

- tidak ada dua soal dengan teks sama dalam satu paket
- antar paket, maksimal 5% soal boleh mirip (ide dasar boleh sama, kalimat dan
  angka harus berbeda)

### 2.7 Struktur

- 110 soal: 30 TWK, 35 TIU, 45 TKP
- nomor 1–110 berurutan tanpa lompat
- lima opsi lengkap, tidak kosong
- TKP tidak memiliki `correct_answer`

## 3. Cara penilaian

Setiap soal diberi skor 0–100:

| Komponen | Bobot |
|---|---|
| Keseimbangan panjang opsi | 25 |
| Kualitas pengecoh (tidak kontras) | 25 |
| Kesesuaian pembahasan | 20 |
| Ketepatan kunci & skor | 20 |
| Kejelasan rumusan soal | 10 |

Kategori:

- 85–100 → layak
- 70–84 → perlu penyuntingan ringan
- < 70 → tulis ulang

## 4. Urutan perbaikan

1. Pembahasan yang menyebut huruf salah (cacat fatal, menyesatkan siswa)
2. Kunci menumpuk pada satu huruf
3. Kunci jauh lebih panjang dari pengecoh
4. Pengecoh yang jelas salah
5. Duplikasi antar paket
6. Pembahasan terlalu pendek
