---
name: lazy-log
description: >-
  Auto-fills and logs developer activities directly into company timesheet Google Spreadsheets (with monthly tabs, daily red separator bars, and 24 standard office columns). Use whenever the user asks to log work, update daily timesheet, mentions "lazy-log", "catat log", "log kerja", "tulis ke spreadsheet kantor", or when finishing development tasks.
argument-hint: "[ringkasan task atau ticket id]"
license: MIT
---

# lazy-log (Format Kantor / Timesheet Developer)

Skill ini secara otomatis merangkum aktivitas coding developer dan mengisinya ke Google Spreadsheets kantor sesuai format standar:
- **Tabsheet Bulanan:** Otomatis memilih tab bulan berjalan (misal: `Oktober 2026`).
- **Pemisah Harian:** Menambahkan baris merah/maroon dengan tanggal hari ini (`DD/MM/YYYY`) di awal hari baru, serta garis batas bawah.
- **21 Kolom Standar Kantor Presisi:**
  1. `Task ID` (Default: `"Non Task"` jika tidak ada tiket Jira/Trello)
  2. `Status` (`Done`, `In Progress`, dll.)
  3. `Project` (Nama repo/project)
  4. `Menu` (Modul aplikasi yang dikerjakan)
  5. `Task Title` (Judul pekerjaan)
  6. `Task Type` (`Feature`, `Bugfix`, `Refactor`, `Testing`)
  7. `Breakdown Task` (Detail pekerjaan yang telah diselesaikan)
  8. `Yang akan Dilakukan dan Perlu Dilakukan` (Rencana/langkah kerja)
  9. `Ask to` (`-`)
  10. `Question` (`-`)
  11. `Lama Pengerjaan (Estimasi)` (misal: `2 Jam`)
  12. `Hari, Tanggal dan Pukul` (Estimasi selesai)
  13. `Mulai` (Jam mulai, format `HH:mm`)
  14. `Selesai` (Jam selesai, format `HH:mm`)
  15. `Lama Pengerjaan (Aktual)`
  16. `Late` (Dikosongkan / otomatis formula sheet)
  17. `Earlier` (Dikosongkan / otomatis formula sheet)
  18. `Why` (Alasan jika durasi berbeda, default `-`)
  19. `Technical` (Kendala teknis atau error yang dihadapi selama coding, default `-`)
  20. `Collaboration` (Kendala koordinasi, default `-`)
  21. `Other` (Kendala lainnya, default `-`)

## Cara Eksekusi

Jalankan script Python `log_activity.py` via `run_command`:

```bash
python3 "<path-to-lazy-log>/scripts/log_activity.py" \
  --task "<Judul Task>" \
  --details "<Rincian apa yang dikerjakan/diubah>" \
  --task-id "PROJ-123 (atau kosongkan untuk Non Task)" \
  --platform "Web" \
  --task-type "Feature" \
  --status "Done"
```

## Proteksi & Filter Project Kantor (Privasi)

Agar pekerjaan personal, riset pribadi, atau proyek non-kantor **tidak terkirim** ke spreadsheet kantor:
1. **Daftar Project Terpilih (Whitelist):**
   Hanya project yang ada di `allowed_projects` dalam `config.json` yang akan dikirim ke Sheets.
2. **Atau Tandai Repo Kantor (.lazy-log):**
   Di repo kantor, jalankan:
   `python3 "<path-to-lazy-log>/scripts/log_activity.py" --enable-project`
   Ini membuat file tanda `.lazy-log` di repo kantor Anda.
3. Jika script dijalankan di luar project kantor yang diizinkan, script otomatis membatalkan pengiriman dan menampilkan pesan proteksi.

## Konfigurasi Webhook Kantor

1. Salin isi [google-apps-script/Code.gs](file:///Users/redantcolony/Workspace/research/lazy-log/google-apps-script/Code.gs) ke menu **Extensions > Apps Script** di Google Sheet kantor Anda.
2. Deploy sebagai Web App (Who has access: Anyone).
3. Masukkan URL ke `lazy-log/config.json` atau set `LAZY_LOG_WEBHOOK_URL`.
