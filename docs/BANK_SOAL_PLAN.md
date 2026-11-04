# Rencana Bank Soal SKD — 10 Paket Tryout

## 1. Prinsip yang harus sama dengan SKD resmi

Mengacu pada blueprint SKD CAT BKN (Permenpan RB No. 27/2021) dan mengikuti
struktur data yang sudah dipakai aplikasi ini.

### Komposisi setiap paket

| Kategori | Jumlah | Waktu | Nilai |
|---|---|---|---|
| TWK | 30 soal | — | 5 per jawaban benar |
| TIU | 35 soal | — | 5 per jawaban benar |
| TKP | 45 soal | — | 1–5 per opsi (tidak ada jawaban salah) |
| **Total** | **110 soal** | **100 menit** | **maks. 550** |

Passing grade: **TWK 65, TIU 80, TKP 166**.

### Sebaran sub-kategori (mengikuti data yang sudah ada)

**TWK — 30 soal, 6 per sub-kategori**

1. Nasionalisme
2. Integritas
3. Bela Negara
4. Pilar Negara
5. Bahasa Indonesia

**TIU — 35 soal, 5 per sub-kategori**

1. Analogi
2. Silogisme
3. Analitis
4. Deret Angka
5. Perbandingan Kuantitatif
6. Numerik
7. Soal Cerita

**TKP — 45 soal, 9 per aspek** (disesuaikan jumlah pada data live)

1. Pelayanan Publik
2. Jejaring Kerja
3. Sosial Budaya
4. Profesionalisme
5. Anti Radikalisme
6. TIK

### Aturan penulisan soal — PENALARAN, BUKAN HAFALAN

Ini prinsip utama. Soal SKD yang baik menguji cara berpikir, bukan kemampuan
mengingat istilah, tahun, atau bunyi pasal.

**Setiap soal wajib berangkat dari stimulus** berupa situasi, kasus, data,
kutipan, atau pernyataan yang harus dianalisis.

**Dilarang** membuat soal yang jawabannya hanya bisa ditemukan dengan menghafal:

- definisi istilah ("Apa pengertian integritas?")
- tahun, nama tokoh, nomor pasal, atau bunyi sila
- ejaan/kata baku tanpa konteks pemakaian
- daftar klasifikasi yang tinggal dicocokkan

**Yang diuji:**

| Kategori | Fokus penalaran |
|---|---|
| TWK | menerapkan nilai pada situasi konkret; menilai keputusan; mencari akar masalah |
| TIU | logika formal, pola, dan kuantitatif — murni penalaran, tanpa hafalan rumus |
| TKP | memilih respons paling efektif dalam situasi kerja nyata |

**Cara mengubah soal hafalan menjadi soal penalaran:**

- Bukan *"Pancasila berkedudukan sebagai apa?"* → tetapi *"Peraturan daerah ini
  disahkan lewat musyawarah, tetapi membebani warga. Apa persoalan utamanya
  ditinjau dari nilai Pancasila?"*
- Bukan *"Mana penulisan baku: analisa atau analisis?"* → tetapi *"Kalimat ini
  ambigu. Perbaikan mana yang membuat maknanya jelas?"*
- Bukan *"Apa tujuan otonomi daerah?"* → tetapi *"Jalan lintas provinsi rusak dan
  kedua daerah saling melepas tanggung jawab. Apa akar masalahnya?"*

**Aturan teknis tambahan:**

- **TWK/TIU**: satu jawaban benar, empat pengecoh yang masuk akal dan tidak
  jelas salah tanpa berpikir.
- **TKP**: kelima opsi diberi skor 1–5 yang semuanya berbeda, tanpa opsi
  "salah". Skor tertinggi mencerminkan sikap paling ideal menurut aspek.
- Setiap soal wajib punya **pembahasan** yang menjelaskan alasan, bukan
  sekadar menyebut kunci.
- `fast_tips` opsional, berisi strategi singkat.
- Bahasa Indonesia baku, kalimat tidak ambigu, tidak menjebak dengan konjungsi
  ganda.
- Tidak menyalin soal dari sumber mana pun. Seluruh soal ditulis orisinal
  mengikuti blueprint di atas.

## 2. Struktur file

```
supabase/seed/skd-2026/
  01/ twk.json  tiu.json  tkp.json
  02/ twk.json  tiu.json  tkp.json
  ...
  10/ twk.json  tiu.json  tkp.json
```

Setiap file berisi array soal **tanpa** field `number`. Nomor 1–110 diisi
otomatis oleh skrip build, sehingga tidak mungkin bentrok.

Hasil build:

```
dist-seed/tryout-01.json ... tryout-10.json
```

Formatnya persis sama dengan `public/template-soal-skd.json`, jadi bisa langsung
diimpor lewat panel admin → Bank Soal → Import JSON.

## 3. Validasi otomatis

`npm run seed:validate` memeriksa:

- jumlah soal 110, dengan komposisi 30/35/45
- nomor unik dan berurutan
- opsi A–E lengkap dan tidak kosong
- TWK/TIU: `correct_answer` valid, `tkp_scores` null
- TKP: skor 1–5 untuk kelima opsi dan semuanya berbeda
- pembahasan minimal 40 karakter
- sub-kategori termasuk daftar yang diizinkan

## 4. Tahapan produksi

| Tahap | Hasil | Perkiraan |
|---|---|---|
| 0 | Blueprint + validator + 10 soal contoh | selesai |
| 1 | Paket 1 lengkap (110 soal) | 3–4 sesi |
| 2 | Paket 2–3 | 6–8 sesi |
| 3 | Paket 4–6 | 9–12 sesi |
| 4 | Paket 7–10 | 12–16 sesi |
| 5 | Import ke panel admin + spot-check | 1 sesi |

Total 1.100 soal. Ini pekerjaan konten, bukan pekerjaan koding, jadi dikerjakan
bertahap dan setiap paket divalidasi sebelum lanjut.

## 5. Yang perlu diputuskan pemilik produk

1. Tema tiap paket: murni nomor urut, atau diberi tema (mis. "Tryout Akbar",
   "Simulasi CAT BKN", "Paket Intensif")?
2. Apakah 10 paket ini masuk ke produk `AKSELERASI SKD KEDINASAN BATCH 1`,
   produk baru, atau gratis?
3. Tingkat kesulitan: setara, atau bertingkat dari mudah ke sulit?
4. Perlu gambar untuk soal figural/deret gambar? Saat ini TIU figural tidak
   termasuk 7 sub-kategori yang ada, jadi saya asumsikan tanpa gambar.
