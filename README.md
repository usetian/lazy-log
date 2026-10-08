# 🦥 lazy-log

> **Skill AI Developer untuk Antigravity** — Mencatat dan merangkum aktivitas coding otomatis langsung ke **Google Spreadsheets Kantor** (dengan Tabsheet Bulanan, Pemisah Harian Merah, dan Rumus Durasi Otomatis).

Sebagai developer, kita sering lupa mengisi timesheet harian atau malas merangkum pekerjaan teknis secara manual. Dengan **lazy-log**, Anda cukup meminta AI Antigravity untuk merangkum task Anda, dan AI akan langsung mengisinya ke Google Sheets sesuai format kantor dalam hitungan detik.

---

## ✨ Fitur Unggulan

- 🧠 **Dynamic Header Mapping:** Script membaca teks header di Baris 2 secara dinamis. Nilai durasi, jam, dan breakdown pekerjaan **dijamin 100% masuk ke kolom yang tepat** tanpa risiko tertukar.
- 📋 **21 Kolom Standar Kantor Presisi:** Sesuai urutan format resmi kantor:
  `Task ID | Status | Project | Menu | Task Title | Task Type | Breakdown Task | Yang akan Dilakukan dan Perlu Dilakukan | Ask to | Question | Lama Pengerjaan (Est) | Hari, Tanggal dan Pukul | Mulai (Aktual) | Selesai (Aktual) | Lama Pengerjaan (Aktual) | Late | Earlier | Why | Technical | Collaboration | Other`
- 📅 **Tabsheet Bulanan & Auto-Duplicate:** Otomatis mendeteksi tab bulan berjalan (misal: `Oktober 2026`). Jika ganti bulan, script otomatis menduplikasi tab sebelumnya sehingga seluruh rumus dan header 1-3 tetap utuh.
- 🔴 **Baris Pemisah Tanggal Otomatis:** Setiap hari baru, otomatis membuat baris tanggal berwarna merah gelap/maroon tebal (`DD/MM/YYYY`) dan garis pemisah di bawahnya.
- ⏱️ **Rumus Performa Otomatis (Format Indonesia):**
  - Lama Pengerjaan Aktual: `=N{row}-M{row}` (Durasi `HH:mm:ss`).
  - Late: `=IF(AND(O{row}>K{row};O{row}>0);O{row}-K{row};"")`.
  - Earlier: `=IF(AND(K{row}>O{row};O{row}>0);K{row}-O{row};"")`.
- 🔄 **Fitur Overwrite / Perbarui In-Place:** Bisa memperbarui data yang sudah dicatat pada tanggal tertentu tanpa menambah baris baru.
- 📜 **Rekap Mingguan dari Git Log:** Bisa merangkum seluruh pekerjaan seminggu ke belakang langsung dari commit Git lokal Anda.
- 🛡️ **Proteksi Privasi Proyek:** Mencegah project pribadi atau eksperimen terkirim ke spreadsheet kantor via whitelist dan file penanda `.lazy-log`.

---

## 🚀 Panduan Integrasi Google Sheets

Pilih salah satu dari 2 skenario di bawah:

### 🟢 Skenario A: Integrasi ke Spreadsheet Kantor yang Sudah Ada (Existing Template)

Gunakan cara ini jika kantor Anda **sudah memiliki dokumen Google Sheets** dengan tab-tab bulan sebelumnya:

1. Buka file Google Sheets kantor Anda.
2. Di menu atas, buka **Ekstensi** (*Extensions*) $\rightarrow$ **Apps Script**.
3. Jika ada kode lama, hapus semuanya.
4. Salin dan tempel (*paste*) seluruh isi file:
   👉 **[`google-apps-script/Code.gs`](./google-apps-script/Code.gs)**
5. Klik ikon **Save** (💾).
6. Lanjut ke bagian **[Cara Deploy Webhook](#-cara-deploy-webhook-google-apps-script)** di bawah.

---

### 🔵 Skenario B: Membuat Google Sheet Baru dari Nol (Fresh Sheet)

Gunakan cara ini jika Anda ingin membuat spreadsheet timesheet baru untuk pribadi atau tim:

1. Buka browser dan kunjungi: **[sheets.new](https://sheets.new)**
2. Biarkan sheet kosong tersebut apa adanya (tidak perlu mendesain atau mengetik 21 kolom secara manual).
3. Buka menu **Ekstensi** (*Extensions*) $\rightarrow$ **Apps Script**.
4. Hapus kode bawaan, lalu salin dan tempel seluruh isi file:
   👉 **[`google-apps-script/Code.gs`](./google-apps-script/Code.gs)**
5. Klik ikon **Save** (💾).
6. *(Keren! Script akan otomatis menggambar seluruh 3 baris header warna-warni dan 21 kolom kantor saat data pertama masuk, atau Anda bisa klik fungsi `resetSheetHeaders` lalu klik **Run**).*
7. Lanjut ke bagian **[Cara Deploy Webhook](#-cara-deploy-webhook-google-apps-script)** di bawah.

---

## 🌐 Cara Deploy Webhook Google Apps Script

Setelah kode `Code.gs` ditempel dan disimpan:

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** $\rightarrow$ pilih **New deployment** (*Deployment baru*).
2. Di sebelah kiri pada pilihan roda gigi ⚙️, pastikan memilih: **Web app** (*Aplikasi web*).
3. Isi konfigurasi:
   - **Description:** `lazy-log Webhook`
   - **Execute as:** `Me (<email-anda>)`
   - **Who has access:** **`Anyone`** *(PENTING: Wajib pilih 'Anyone' agar script dari laptop Anda bisa mengirim data tanpa otentikasi login browser)*.
4. Klik tombol **Deploy**.
5. Jika muncul jendela otorisasi (*Authorization Required*):
   - Klik **Authorize access** $\rightarrow$ pilih akun Google Anda.
   - Klik **Advanced** $\rightarrow$ klik **Go to Untitled project (unsafe)** $\rightarrow$ klik **Allow**.
6. Google akan memunculkan dialog berisi **Web app URL** (link panjang yang berakhiran `/exec`).
7. **Salin URL tersebut!**

> 💡 **Tips Update Versi:** Jika di kemudian hari Anda mengedit kode `Code.gs`, perbarui deployment-nya dengan:  
> Klik **Deploy** $\rightarrow$ **Manage deployments** $\rightarrow$ klik ikon pensil ✏️ $\rightarrow$ Versi: **New version** $\rightarrow$ **Deploy**.

---

## 💻 Pilihan Instalasi: Global vs Per-Project

Antigravity mendukung 2 cara pemasangan skill sesuai kebutuhan Anda:

### 🌍 Opsi 1: Pasang Secara Global (Untuk Laptop Anda Pribadi)
Gunakan opsi ini jika Anda ingin skill `lazy-log` otomatis aktif di **semua proyek** yang Anda buka di komputer ini:

```bash
cd lazy-log
./install.sh --global
```
*Installer ini membuat symlink ke `~/.gemini/config/skills/lazy-log`.*

---

### 📦 Opsi 2: Pasang Per-Project (Sangat Direkomendasikan untuk Tim!)
Gunakan opsi ini jika Anda ingin memasang skill ini **khusus di dalam satu repositori proyek kantor** (misalnya di `javamas-mobile`):

```bash
cd lazy-log
./install.sh --project /path/to/project-kantor
# Contoh untuk javamas-mobile:
./install.sh --project /Users/redantcolony/Workspace/javamas-mobile
```

**🔥 Mengapa Opsi Per-Project Sangat Bagus untuk Tim?**
1. **Zero Setup untuk Teman Tim:** Folder skill akan berada di `.agents/skills/lazy-log` di dalam repo tersebut. Ketika folder ini di-commit ke Git kantor, **siapa pun rekan tim Anda yang nge-clone repo tersebut langsung otomatis memiliki skill lazy-log** tanpa perlu install apa pun lagi!
2. **Konfigurasi Mandiri:** Proyek tersebut memiliki pengaturan spreadsheet dan nama modulnya sendiri tanpa mengganggu proyek lain.
3. **Privasi Alami:** Skill ini hanya akan aktif saat sedang membuka proyek tersebut.

---

### 2. Konfigurasi Webhook & Whitelist Proyek
Salin file template konfigurasi ke `config.json`:

```bash
cp config.example.json config.json
```

Lalu edit file `config.json`:
```json
{
  "webhook_url": "https://script.google.com/macros/s/AKfycb.../exec",
  "developer_name": "Nama Anda",
  "default_status": "Done",
  "allowed_projects": [
    "javamas-mobile",
    "nama-repo-kantor-lain"
  ],
  "ignored_projects": [
    "personal-*",
    "research",
    "experiment-*"
  ],
  "require_project_opt_in": false
}
```

*(File `config.json` sudah terdaftar di `.gitignore`, sehingga aman dan tidak akan bocor ke GitHub).*

---

## 🛡️ Proteksi Privasi Proyek Kantor

Agar pekerjaan di repo personal atau riset Anda tidak pernah terkirim ke spreadsheet kantor:
1. **Whitelist:** Hanya nama folder/proyek yang ada di daftar `allowed_projects` yang diizinkan mengirim log.
2. **Opt-In Marker (.lazy-log):** Anda juga bisa menandai project kantor dengan menjalankan perintah ini sekali di root folder repo kantor:
   ```bash
   python3 "<path-to-lazy-log>/scripts/log_activity.py" --enable-project
   ```
   *Jika Anda sedang berada di luar proyek yang diizinkan, script otomatis menolak pengiriman demi keamanan privasi Anda.*

---

## 💬 Panduan Perintah di Antigravity AI

Cukup bicara santai dengan AI di chat Antigravity saat Anda sedang bekerja:

### 1. Mencatat Pekerjaan yang Baru Selesai
> *"Tolong catat apa yang baru saja kita kerjakan ke spreadsheet kantor"*  
> *(atau: "/lazy-log task implementasi filter produk petani, Task ID: JAV-101")*

AI akan otomatis:
* Membaca diff kode yang baru saja diubah.
* Merangkum task dan langkah persiapan (*Prep Work*).
* Menentukan menu aplikasi, modul, dan estimasi waktu.
* Mengisi 21 kolom kantor secara presisi.

---

### 2. Merangkum Pekerjaan Seminggu Terakhir (Git History)
> *"Tolong rekap pekerjaan saya seminggu terakhir"*

AI akan:
* Membaca riwayat `git log` di laptop Anda selama 7 hari ke belakang.
* Mengelompokkan pekerjaan per hari (Senin, Selasa, Rabu, dst.).
* Menyiapkan ringkasan teknis yang siap Anda kirimkan sekaligus ke Google Sheets.

---

### 3. Memperbarui / Menimpa Log yang Sudah Ada (Overwrite)
> *"Perbarui log di tanggal Rabu, 07 Oktober 2026..."*

AI akan:
* Mengirim data dengan mode overwrite.
* Script mencari baris pada tanggal tersebut dan **menimpa datanya di tempat (*in-place*)** tanpa menambah baris baru.

---

### 4. Menentukan Tanggal Tertentu Secara Manual
> *"Catat pekerjaan ini untuk tanggal kemarin, 06/10/2026, durasi estimasi 4 jam"*

---

## 👥 Berbagi ke Rekan Tim Developer

Ingin teman satu tim Anda menggunakan skill ini juga?

1. **Push repo ini ke Git Anda:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/<username>/lazy-log.git
   git push -u origin main
   ```
2. **Teman Anda cukup:**
   * Clone repo: `git clone https://github.com/<username>/lazy-log.git`
   * Jalankan: `./install.sh`
   * Buat `config.json` dengan URL Webhook spreadsheet (bisa menggunakan 1 spreadsheet tim bersama atau spreadsheet pribadi masing-masing).

---

## 📄 Lisensi
MIT License — Bebas digunakan dan disesuaikan untuk kebutuhan pribadi maupun perusahaan.
