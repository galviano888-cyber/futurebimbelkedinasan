# Roles & Permission Matrix
# Future Bimbel Kedinasan — LMS Platform

Dokumen ini mendefinisikan seluruh peran (role) yang ada dalam sistem,
beserta hak akses masing-masing terhadap setiap fitur/modul.

---

## Daftar Role

| Role ID | Nama Role    | Deskripsi                                                      |
|---------|--------------|----------------------------------------------------------------|
| R01     | Guest        | Pengunjung publik, belum memiliki akun                         |
| R02     | Student Free | Siswa terdaftar, belum membeli paket apapun                    |
| R03     | Student Pro  | Siswa yang telah membeli minimal satu paket                    |
| R04     | Admin        | Pengelola konten dan manajemen user (tim internal FBK)         |
| R05     | Super Admin  | Akses penuh — pemilik platform                                 |

---

## Permission Matrix

### 1. Autentikasi & Akun

| Fitur                        | Guest | Student Free | Student Pro | Admin | Super Admin |
|------------------------------|:-----:|:------------:|:-----------:|:-----:|:-----------:|
| Melihat Landing Page         | ✅    | ✅           | ✅          | ✅    | ✅          |
| Mendaftar (Register)         | ✅    | ❌           | ❌          | ❌    | ❌          |
| Login                        | ✅    | ✅           | ✅          | ✅    | ✅          |
| Edit Profil (Nama, Foto)     | ❌    | ✅           | ✅          | ✅    | ✅          |
| Reset Password               | ✅    | ✅           | ✅          | ✅    | ✅          |

---

### 2. Dashboard Siswa

| Fitur                              | Guest | Student Free | Student Pro | Admin | Super Admin |
|------------------------------------|:-----:|:------------:|:-----------:|:-----:|:-----------:|
| Melihat Dashboard                  | ❌    | ✅           | ✅          | ✅    | ✅          |
| Melihat Statistik Nilai Tryout     | ❌    | ✅ (kosong)  | ✅          | ✅    | ✅          |
| Melihat Grafik Performa            | ❌    | ✅ (kosong)  | ✅          | ✅    | ✅          |
| Melihat Riwayat Tryout             | ❌    | ✅ (kosong)  | ✅          | ✅    | ✅          |

---

### 3. Paket & Tryout SKD (Katalog Publik)

| Fitur                              | Guest | Student Free | Student Pro | Admin | Super Admin |
|------------------------------------|:-----:|:------------:|:-----------:|:-----:|:-----------:|
| Melihat katalog paket              | ✅    | ✅           | ✅          | ✅    | ✅          |
| Melihat detail harga               | ✅    | ✅           | ✅          | ✅    | ✅          |
| Mengklik tombol beli (ke WA/Form)  | ✅    | ✅           | ✅          | ❌    | ❌          |
| Memasukkan Kode Voucher            | ❌    | ✅           | ✅          | ❌    | ❌          |

---

### 4. Paket Saya (Konten Berbayar)

| Fitur                              | Guest | Student Free | Student Pro | Admin | Super Admin |
|------------------------------------|:-----:|:------------:|:-----------:|:-----:|:-----------:|
| Melihat menu "Paket Saya"          | ❌    | ✅ (kosong)  | ✅          | ✅    | ✅          |
| Mengakses Materi PDF               | ❌    | ❌           | ✅          | ✅    | ✅          |
| Menonton Video / Rekaman Zoom      | ❌    | ❌           | ✅          | ✅    | ✅          |
| Mengerjakan Tryout Premium         | ❌    | ❌           | ✅          | ✅    | ✅          |
| Melihat Pembahasan Soal            | ❌    | ❌           | ✅          | ✅    | ✅          |

---

### 5. Panel Admin

| Fitur                              | Guest | Student Free | Student Pro | Admin | Super Admin |
|------------------------------------|:-----:|:------------:|:-----------:|:-----:|:-----------:|
| Akses Panel Admin                  | ❌    | ❌           | ❌          | ✅    | ✅          |
| Manajemen User (lihat/hapus)       | ❌    | ❌           | ❌          | ✅    | ✅          |
| Buka Akses Paket ke User           | ❌    | ❌           | ❌          | ✅    | ✅          |
| Buat & Edit Paket/Konten           | ❌    | ❌           | ❌          | ✅    | ✅          |
| Generate Kode Voucher              | ❌    | ❌           | ❌          | ✅    | ✅          |
| Lihat Laporan Keuangan/Transaksi   | ❌    | ❌           | ❌          | ❌    | ✅          |
| Manajemen Admin lain               | ❌    | ❌           | ❌          | ❌    | ✅          |
| Konfigurasi Sistem                 | ❌    | ❌           | ❌          | ❌    | ✅          |
