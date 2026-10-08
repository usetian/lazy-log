# 🦥 lazy-log

> **Skill Antigravity AI** untuk mencatat aktivitas coding developer secara otomatis ke **Google Spreadsheets**.

Sebagai developer, kita sering lupa mengisi log harian / timesheet kerja atau malas menuliskan ringkasan task manual. Dengan **lazy-log**, Anda cukup meminta AI Antigravity untuk merangkum apa yang baru saja Anda kerjakan dan mengirimkannya langsung ke baris Google Sheets secara rapi.

---

## ✨ Fitur Utama

- 🤖 **Auto-Summarize:** AI merangkum task, perubahan arsitektur/kode, dan file-file yang dimodifikasi.
- 🎯 **Git Context Aware:** Otomatis mendeteksi nama proyek, branch aktif, hash commit, dan nama developer dari Git.
- 📊 **Google Sheets Integration:** Menggunakan webhook Google Apps Script yang ringan tanpa perlu kredensial OAuth / Google Cloud Console yang rumit.
- 🛡️ **Aman & Siap Push:** URL Webhook dan konfigurasi rahasia di-ignore dari Git (`.gitignore`). Rekan tim bisa menggunakan spreadsheet masing-masing atau satu spreadsheet tim bersama.
- 💾 **Local Backup:** Jika sedang offline, log tetap otomatis tersimpan di mesin lokal (`.local_history.jsonl`).
- ⚡ **Zero External Dependencies:** Script Python pengirim hanya menggunakan Standard Library bawaan Python 3.

---

## 🚀 Panduan Setup (Hanya 3 Menit)

### 1. Siapkan Google Sheets & Webhook

1. Buka [Google Sheets](https://sheets.new) baru.
2. Buka menu **Extensions > Apps Script** (Ekstensi > Apps Script).
3. Hapus kode bawaan `myFunction()`, lalu tempelkan seluruh isi file [google-apps-script/Code.gs](./google-apps-script/Code.gs).
4. Klik ikon **Save** (Disket) 💾.
5. Klik tombol biru **Deploy** > **New deployment**:
   - Pilih jenis: **Web app** (ikon bola dunia 🌐).
   - *Description*: `lazy-log Webhook`.
   - *Execute as*: `Me (<email-anda>)`.
   - *Who has access*: **Anyone** *(Penting: agar script pengirim bisa mengirim data tanpa login browser)*.
6. Klik **Deploy**, beri izin hak akses (*Authorize access*), lalu salin **Web app URL** yang muncul (berakhiran `/exec`).

---

### 2. Pasang lazy-log ke Antigravity

Clone repository ini ke komputer Anda, lalu jalankan installer:

```bash
cd lazy-log
./install.sh
```

Script ini akan membuat *symlink* otomatis ke `~/.gemini/config/skills/lazy-log`, sehingga skill ini langsung aktif secara **Global** di semua proyek Antigravity Anda!

---

### 3. Konfigurasi Webhook URL

Salin file contoh konfigurasi dan masukkan Web app URL yang Anda dapatkan di Langkah 1:

```bash
cp config.example.json config.json
```

Lalu edit `config.json`:
```json
{
  "webhook_url": "https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec",
  "developer_name": "",
  "default_status": "Completed"
}
```

*(Opsional: Anda juga bisa menyetel via environment variable di `~/.zshrc` atau `~/.bashrc`:)*
```bash
export LAZY_LOG_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
```

---

## 💡 Cara Penggunaan

Cukup berinteraksi secara natural dengan AI Antigravity di dalam chat chatbox proyek Anda:

### Contoh Perintah:
- *"Tolong catat apa yang baru saja kita kerjakan ke lazy-log"*
- *"Update timesheet kerjaan barusan ya"*
- *"Catat log task implementasi autentikasi JWT ini ke Google Sheets"*
- *"lazy-log"*

Antigravity akan mengevaluasi diff kode, merangkum poin-poin perubahan teknis, file yang disentuh, lalu mengeksekusi script pengiriman ke Google Sheet Anda!

---

## 👥 Penggunaan untuk Rekan Tim

Repository ini dirancang agar mudah dibagikan ke teman satu tim:

1. **Skenario 1 (Timesheet Tim Bersama):**
   - Buat 1 Google Sheet untuk tim Anda.
   - Cantumkan Webhook URL tim ke `config.json` rekan-rekan.
   - Setiap developer yang mencatat akan otomatis teridentifikasi lewat kolom `Developer` dan `Project`.

2. **Skenario 2 (Catatan Kerja Pribadi Masing-Masing):**
   - Setiap rekan tim cukup membuat Google Sheet pribadi mengikuti langkah 1 dan mengisi `config.json` masing-masing.

3. **Skenario 3 (Per Proyek Repositori):**
   - Anda juga bisa menaruh folder `lazy-log` ke dalam direktori `.agents/skills/lazy-log` di repository proyek tim Anda.

---

## 📄 Lisensi
MIT License. Bebas digunakan dan dimodifikasi untuk kebutuhan tim atau personal.
