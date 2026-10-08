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
- **24 Kolom Standar Kantor:**
  1. `Task ID` (Default: `"Non Task"` jika tidak ada tiket Jira/Trello)
  2. `Status` (`Done`, `In Progress`, dll.)
  3. `Project` (Nama repo/project)
  4. `Platform` (`Web`, `Mobile`, `Backend`, `API`, dll.)
  5. `Task Type` (`Feature`, `Bugfix`, `Refactor`, `Testing`)
  6. `Role` (Default: `Developer` / Frontend / Backend)
  7. `Menu` (Modul aplikasi yang dikerjakan)
  8. `Submenu` (Sub-modul)
  9. `Task Title` (Judul pekerjaan)
  10. `Breakdown Task` (Detail pekerjaan yang telah diselesaikan)
  11. `Yang akan Dilakukan dan Perlu Dilakukan` (Rencana/langkah kerja)
  12. `Ask to` (`-`)
  13. `Question` (`-`)
  14. `Lama Pengerjaan (Estimasi)` (misal: `2 Jam`)
  15. `Hari, Tanggal dan Pukul` (Estimasi selesai)
  16. `Mulai` (Jam mulai, format `HH:mm`)
  17. `Selesai` (Jam selesai, format `HH:mm`)
  18. `Lama Pengerjaan (Aktual)`
  19. `Late` (Dikosongkan / otomatis formula sheet)
  20. `Earlier` (Dikosongkan / otomatis formula sheet)
  21. `Why` (Alasan jika durasi berbeda, default `-`)
  22. `Technical` (Kendala teknis atau error yang dihadapi selama coding, default `-`)
  23. `Collaboration` (Kendala koordinasi, default `-`)
  24. `Other` (Kendala lainnya, default `-`)

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

## Konfigurasi Webhook Kantor

1. Salin isi [google-apps-script/Code.gs](file:///Users/redantcolony/Workspace/research/lazy-log/google-apps-script/Code.gs) ke menu **Extensions > Apps Script** di Google Sheet kantor Anda.
2. Deploy sebagai Web App (Who has access: Anyone).
3. Masukkan URL ke `lazy-log/config.json` atau set `LAZY_LOG_WEBHOOK_URL`.
