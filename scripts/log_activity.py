#!/usr/bin/env python3
"""
lazy-log: Script pengirim log aktivitas developer ke Google Sheets format kantor.
Menggunakan hanya Python Standard Library (tanpa dependensi eksternal).
Mendukung proteksi & filter project agar hanya project kantor yang dicatat.
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime
import urllib.request
import urllib.error

def get_git_info(cwd=None):
    """Mendeteksi informasi git di direktori saat ini."""
    info = {
        "project": None,
        "branch": None,
        "commit": None,
        "developer": None,
        "changed_files": [],
        "repo_root": None
    }
    
    # 1. Project name dari folder root git atau folder saat ini
    try:
        toplevel = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        info["repo_root"] = toplevel
        info["project"] = os.path.basename(toplevel)
    except Exception:
        info["project"] = os.path.basename(os.getcwd())
        info["repo_root"] = os.getcwd()

    # 2. Git Branch
    try:
        branch = subprocess.check_output(
            ["git", "branch", "--show-current"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        info["branch"] = branch or "detached"
    except Exception:
        pass

    # 3. Commit Hash pendek
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        info["commit"] = commit
    except Exception:
        pass

    # 4. Git Author
    try:
        user_name = subprocess.check_output(
            ["git", "config", "user.name"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        if user_name:
            info["developer"] = user_name
    except Exception:
        pass

    if not info["developer"]:
        info["developer"] = os.environ.get("USER") or os.environ.get("USERNAME") or "Developer"

    # 5. File yang baru saja dimodifikasi / staged
    try:
        status_output = subprocess.check_output(
            ["git", "status", "--porcelain"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip().splitlines()
        changed = []
        for line in status_output:
            parts = line.strip().split(maxsplit=1)
            if len(parts) == 2:
                changed.append(parts[1])
        info["changed_files"] = changed[:10]
    except Exception:
        pass

    return info

def load_config():
    """Membaca konfigurasi dari file config.json."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "..", "config.json"),
        os.path.join(script_dir, "config.json"),
        os.path.expanduser("~/.config/lazy-log/config.json"),
        os.path.expanduser("~/.gemini/config/skills/lazy-log/config.json")
    ]

    for path in candidates:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f), path
            except Exception:
                continue

    return {}, None

def resolve_webhook_url(config, cli_url=None):
    """Mencari Webhook URL dari CLI, env, atau config."""
    if cli_url:
        return cli_url

    env_url = os.environ.get("LAZY_LOG_WEBHOOK_URL")
    if env_url:
        return env_url

    return config.get("webhook_url")

def is_project_allowed(project_name, repo_root, config, force=False):
    """
    Memvalidasi apakah project saat ini diizinkan untuk dicatat ke Google Sheets kantor.
    Returns: (is_allowed: bool, reason: str)
    """
    if force:
        return True, "Diizinkan melalui flag --force"

    # 1. Cek keberadaan marker file .lazy-log di root repo
    if repo_root:
        marker_files = [".lazy-log", ".lazy-log.json"]
        for marker in marker_files:
            if os.path.exists(os.path.join(repo_root, marker)):
                return True, f"Project diizinkan (ditemukan file penanda '{marker}')"

    # 2. Cek daftar ignored_projects
    ignored = config.get("ignored_projects", [])
    proj_lower = (project_name or "").lower().strip()
    for ign in ignored:
        ign_clean = ign.lower().strip()
        if ign_clean.endswith("*") and proj_lower.startswith(ign_clean[:-1]):
            return False, f"Project '{project_name}' cocok dengan filter ignored '{ign}'"
        elif ign_clean == proj_lower:
            return False, f"Project '{project_name}' ada dalam daftar ignored_projects"

    # 3. Cek daftar allowed_projects
    allowed = config.get("allowed_projects", [])
    if allowed:
        for al in allowed:
            al_clean = al.lower().strip()
            if al_clean.endswith("*") and proj_lower.startswith(al_clean[:-1]):
                return True, f"Project '{project_name}' cocok dengan allowed filter '{al}'"
            elif al_clean == proj_lower:
                return True, f"Project '{project_name}' terdaftar di allowed_projects"
        return False, f"Project '{project_name}' TIDAK terdaftar di allowed_projects"

    # 4. Cek apakah require_project_opt_in aktif
    if config.get("require_project_opt_in", False):
        return False, f"Mode 'require_project_opt_in' aktif. Jalankan 'lazy-log --enable-project' pada project ini untuk mengizinkan."

    return True, "Filter lolos (default allow)"

def save_local_backup(payload):
    """Menyimpan log ke file lokal sebagai cadangan."""
    candidates = [
        os.path.expanduser("~/.lazy-log/history.jsonl"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".local_history.jsonl")
    ]
    for target in candidates:
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "a", encoding="utf-8") as f:
                f.write(json.dumps(payload, ensure_ascii=False) + "\n")
            return
        except Exception:
            continue

class SmartRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Menangani redirect 302 dari Google Apps Script Web App."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if code in (301, 302, 303):
            return urllib.request.Request(
                newurl,
                headers={k: v for k, v in req.headers.items() if k.lower() != 'content-length'},
                method="GET"
            )
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def send_to_google_sheets(webhook_url, payload):
    """Mengirim payload JSON ke Google Apps Script Web App."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    opener = urllib.request.build_opener(SmartRedirectHandler())
    with opener.open(req, timeout=15) as response:
        res_body = response.read().decode("utf-8")
        try:
            return json.loads(res_body)
        except Exception:
            return {"status": "success", "raw_response": res_body}

def main():
    parser = argparse.ArgumentParser(description="lazy-log: Kirim dev log ke Google Sheets (Format Kantor)")
    
    # Perintah Manajemen Project
    parser.add_argument("--enable-project", action="store_true", help="Tandai project di folder ini sebagai project kantor yang aktif (.lazy-log)")
    parser.add_argument("--disable-project", action="store_true", help="Hapus tanda project kantor dari folder ini")

    # Kolom Format Kantor
    parser.add_argument("--task-id", default="Non Task", help="Task ID (default: 'Non Task')")
    parser.add_argument("--status", "-s", default="Done", help="Status (Done, In Progress, etc.)")
    parser.add_argument("--project", "-p", default=None, help="Nama Project")
    parser.add_argument("--platform", default="Web", help="Platform (Web, Mobile, Backend, etc.)")
    parser.add_argument("--task-type", default="Feature", help="Task Type (Feature, Bugfix, Refactor, etc.)")
    parser.add_argument("--role", default="Developer", help="Role (Frontend, Backend, etc.)")
    parser.add_argument("--menu", default="-", help="Menu")
    parser.add_argument("--submenu", default="-", help="Submenu")
    parser.add_argument("--task", "-t", default=None, help="Task Title / Judul Pekerjaan")
    parser.add_argument("--details", "-d", default="", help="Breakdown Task / Rincian Pekerjaan")
    parser.add_argument("--prep-work", default="", help="Yang akan dilakukan & perlu dilakukan")
    parser.add_argument("--ask-to", default="-", help="Ask to")
    parser.add_argument("--question", default="-", help="Question")
    parser.add_argument("--est-duration", default="2 Jam", help="Estimasi Lama Pengerjaan")
    parser.add_argument("--est-datetime", default="", help="Estimasi Hari, Tanggal dan Pukul")
    parser.add_argument("--start-time", default="", help="Aktual Jam Mulai (misal: 09:00)")
    parser.add_argument("--end-time", default="", help="Aktual Jam Selesai (misal: 11:00)")
    parser.add_argument("--actual-duration", default="", help="Aktual Lama Pengerjaan")
    parser.add_argument("--why", default="-", help="Alasan kenapa molor / lebih cepat")
    parser.add_argument("--problem-tech", default="-", help="Kendala Teknis")
    parser.add_argument("--problem-collab", default="-", help="Kendala Kolaborasi")
    parser.add_argument("--problem-other", default="-", help="Kendala Lainnya")
    
    # Argumen Kontrol
    parser.add_argument("--force", action="store_true", help="Paksa kirim meskipun project tidak ada di daftar allowed_projects")
    parser.add_argument("--webhook-url", default=None, help="Google Apps Script Web App URL")
    parser.add_argument("--dry-run", action="store_true", help="Cetak payload tanpa mengirim")

    args = parser.parse_args()

    git_info = get_git_info()
    config, config_path = load_config()

    # Fitur enable/disable project opt-in
    if args.enable_project:
        target_marker = os.path.join(git_info["repo_root"], ".lazy-log")
        with open(target_marker, "w", encoding="utf-8") as f:
            f.write(f"# lazy-log enabled for project: {git_info['project']}\n")
        print(f"✅ Project '{git_info['project']}' berhasil diaktifkan untuk pencatatan lazy-log!")
        print(f"📍 File penanda dibuat di: {target_marker}")
        return

    if args.disable_project:
        target_marker = os.path.join(git_info["repo_root"], ".lazy-log")
        if os.path.exists(target_marker):
            os.remove(target_marker)
            print(f"🚫 Project '{git_info['project']}' dinonaktifkan dari lazy-log.")
        else:
            print(f"ℹ️  File penanda .lazy-log tidak ditemukan di project ini.")
        return

    if not args.task:
        parser.print_help()
        sys.exit(1)

    project_name = args.project or git_info["project"]

    # VALIDASI FILTER PROJECT KANTOR:
    allowed, reason = is_project_allowed(project_name, git_info["repo_root"], config, force=args.force)
    if not allowed:
        print("\n🔒 [lazy-log PROTECTED] Pencatatan ke Google Sheets Kantor DILEWATI!")
        print(f"Alasan: {reason}")
        print("Aktivitas project ini TIDAK dikirim ke spreadsheet kantor demi privasi.")
        print("\nTip:")
        print(f"- Untuk mengizinkan project ini, daftarkan '{project_name}' ke `allowed_projects` di config.json")
        print(f"- Atau jalankan: python3 log_activity.py --enable-project (membuat file .lazy-log di repo ini)")
        print(f"- Atau gunakan flag --force jika ingin sekali kirim.")
        return

    now = datetime.now()
    today_str = now.strftime("%d/%m/%Y")
    full_now_str = now.strftime("%d/%m/%Y %H:%M:%S")

    # Helper format durasi ke HH:mm:ss (contoh: 4:00:00)
    def normalize_duration(val):
        if not val or val == "-":
            return "04:00:00"
        val = str(val).strip()
        if ":" in val:
            parts = val.split(":")
            if len(parts) == 2:
                return f"{int(parts[0]):02d}:{int(parts[1]):02d}:00"
            elif len(parts) == 3:
                return f"{int(parts[0]):02d}:{int(parts[1]):02d}:{int(parts[2]):02d}"
        try:
            # Jika user memasukkan angka jam, misal "4" atau "4 jam"
            num_str = "".join([c for c in val.split()[0] if c.isdigit() or c == '.'])
            hours = float(num_str)
            h = int(hours)
            m = int(round((hours - h) * 60))
            return f"{h:02d}:{m:02d}:00"
        except Exception:
            return val

    # Helper format datetime ke DD/MM/YYYY HH:mm:ss
    def normalize_datetime(val, default_time="17:00:00"):
        if not val or val == "-":
            return f"{today_str} {default_time}"
        val = str(val).strip()
        if len(val) <= 8 and ":" in val:
            parts = val.split(":")
            if len(parts) == 2:
                return f"{today_str} {int(parts[0]):02d}:{int(parts[1]):02d}:00"
            elif len(parts) == 3:
                return f"{today_str} {int(parts[0]):02d}:{int(parts[1]):02d}:{int(parts[2]):02d}"
        return val

    est_duration_fmt = normalize_duration(args.est_duration)
    est_datetime_fmt = normalize_datetime(args.est_datetime, "17:00:00")
    start_time_fmt = normalize_datetime(args.start_time, now.strftime("%H:%M:%S"))
    end_time_fmt = normalize_datetime(args.end_time, now.strftime("%H:%M:%S"))

    # Susun payload 21 kolom format kantor
    payload = {
        "date_str": today_str,
        "task_id": args.task_id,
        "status": args.status,
        "project": project_name,
        "menu": args.menu,
        "task_title": args.task,
        "task_type": args.task_type,
        "breakdown_task": args.details or f"Pengerjaan {args.task}",
        "prep_work": args.prep_work or args.details or f"Persiapan dan eksekusi {args.task}",
        "ask_to": args.ask_to,
        "question": args.question,
        "est_duration": est_duration_fmt,
        "est_datetime": est_datetime_fmt,
        "start_time": start_time_fmt,
        "end_time": end_time_fmt,
        "why": args.why,
        "problem_technical": args.problem_tech,
        "problem_collab": args.problem_collab,
        "problem_other": args.problem_other
    }

    # Simpan selalu ke backup lokal
    save_local_backup(payload)

    if args.dry_run:
        print("[lazy-log DRY RUN - Format Kantor] Payload:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    webhook_url = resolve_webhook_url(config, args.webhook_url)

    if not webhook_url or "script.google.com" not in webhook_url:
        print("\n⚠️  [lazy-log] Webhook URL Google Sheets belum diatur!")
        print("Log sudah disimpan di backup lokal: .local_history.jsonl")
        print("\nUntuk menghubungkan ke Google Sheets kantor:")
        print("1. Salin kode di `google-apps-script/Code.gs` ke Spreadsheet kantor (Extensions > Apps Script)")
        print("2. Deploy Web App dan set URL di `config.json` atau jalankan:")
        print("   export LAZY_LOG_WEBHOOK_URL='https://script.google.com/macros/s/.../exec'\n")
        return

    try:
        print(f"📡 Mengirim log kantor '{payload['task_title']}' ({project_name}) ke Google Sheets...")
        res = send_to_google_sheets(webhook_url, payload)
        print(f"✅ Berhasil dicatat ke Google Sheets! [Tab: {res.get('sheet_name', 'Bulan Aktif')}, Baris: {res.get('row', 'Baru')}]")
    except Exception as e:
        sys.stderr.write(f"❌ Gagal mengirim ke Google Sheets: {e}\n")
        sys.stderr.write("Catatan: Log tetap aman tersimpan di backup lokal.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
