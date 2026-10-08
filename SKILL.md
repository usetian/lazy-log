---
name: lazy-log
description: >-
  Summarizes developer coding work (tasks, technical details, files changed, git context) and writes it directly to Google Spreadsheets or local logs. Use whenever the user asks to record/log their work, update timesheet, mentions "lazy-log", "catat log", "log kerja", "tulis ke spreadsheet", or when concluding a significant development task if requested.
argument-hint: "[ringkasan task opsional]"
license: MIT
---

# lazy-log (Developer Activity Logger to Google Sheets)

Skill ini bertugas merangkum aktivitas coding yang telah dikerjakan oleh developer dan mencatatnya ke Google Sheets secara otomatis atau manual.

## Cara Kerja

Ketika skill ini dipanggil atau user meminta mencatat aktivitas:
1. **Identifikasi Konteks Pekerjaan:**
   * **Task / Fitur:** Judul ringkas pekerjaan yang baru saja diselesaikan.
   * **Detail Teknis:** Ringkasan perubahan arsitektur, algoritma, atau bugfix yang dilakukan.
   * **Files Changed:** File-file utama yang dibuat atau dimodifikasi.
   * **Status:** `Completed` (default), `In Progress`, `Fixed`, atau `Testing`.
2. **Jalankan Script Pengirim:**
   Gunakan tool `run_command` untuk mengeksekusi helper script:
   ```bash
   python3 "<path-to-lazy-log>/scripts/log_activity.py" \
     --task "<Judul Singkat Task>" \
     --details "<Ringkasan teknis apa yang diubah>" \
     --status "Completed"
   ```
   *Catatan:* Script akan otomatis mendeteksi nama proyek, branch git saat ini, commit hash, dan nama developer dari `git config user.name`.

## Lokasi Path Script

- Jika diinstal secara global:
  `~/.gemini/config/skills/lazy-log/scripts/log_activity.py`
- Jika diinstal di dalam workspace project:
  `.agents/skills/lazy-log/scripts/log_activity.py` atau `./lazy-log/scripts/log_activity.py`

## Konfigurasi Webhook Google Sheets

Script mencari URL webhook dengan urutan prioritas:
1. Argument CLI `--webhook-url`
2. Environment Variable: `LAZY_LOG_WEBHOOK_URL`
3. File `config.json` di dalam folder skill:
   ```json
   {
     "webhook_url": "https://script.google.com/macros/s/.../exec"
   }
   ```

Jika Webhook URL belum diisi saat pertama kali dijalankan, ingatkan user dengan ramah untuk membuat webhook Google Sheets dengan mengikuti petunjuk di [google-apps-script/Code.gs](file:///Users/redantcolony/Workspace/research/lazy-log/google-apps-script/Code.gs).
