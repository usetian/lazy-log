#!/usr/bin/env python3
"""
lazy-log: Script pengirim log aktivitas developer ke Google Sheets via Webhook.
Menggunakan hanya Python Standard Library (tanpa dependensi eksternal).
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
        "changed_files": []
    }
    
    # 1. Project name dari folder root git atau folder saat ini
    try:
        toplevel = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"], 
            cwd=cwd, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        info["project"] = os.path.basename(toplevel)
    except Exception:
        info["project"] = os.path.basename(os.getcwd())

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
        info["changed_files"] = changed[:10]  # batasi 10 file teratas
    except Exception:
        pass

    return info

def resolve_webhook_url(cli_url=None):
    """Mencari Webhook URL dari CLI, env, atau config file."""
    if cli_url:
        return cli_url

    env_url = os.environ.get("LAZY_LOG_WEBHOOK_URL")
    if env_url:
        return env_url

    # Cek config.json di folder script
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
                    data = json.load(f)
                    url = data.get("webhook_url")
                    if url:
                        return url
            except Exception:
                continue

    return None

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
        # Google Apps Script me-redirect POST ke GET URL
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
    parser = argparse.ArgumentParser(description="lazy-log: Kirim dev log ke Google Sheets")
    parser.add_argument("--task", "-t", required=True, help="Ringkasan tugas/fitur yang dikerjakan")
    parser.add_argument("--details", "-d", default="", help="Detail teknis pekerjaan")
    parser.add_argument("--status", "-s", default="Completed", choices=["Completed", "In Progress", "Fixed", "Testing"], help="Status pekerjaan")
    parser.add_argument("--project", "-p", default=None, help="Nama proyek (default: auto-detect dari folder/git)")
    parser.add_argument("--developer", default=None, help="Nama developer (default: git config user.name)")
    parser.add_argument("--files", nargs="*", default=None, help="Daftar file yang diubah")
    parser.add_argument("--branch", default=None, help="Git branch")
    parser.add_argument("--commit", default=None, help="Commit hash")
    parser.add_argument("--webhook-url", default=None, help="Google Apps Script Web App URL")
    parser.add_argument("--dry-run", action="store_true", help="Cetak payload tanpa mengirim ke Sheets")

    args = parser.parse_args()

    git_info = get_git_info()

    # Susun payload
    payload = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "developer": args.developer or git_info["developer"],
        "project": args.project or git_info["project"],
        "task": args.task,
        "details": args.details,
        "files_changed": args.files if args.files is not None else git_info["changed_files"],
        "branch": args.branch or git_info["branch"],
        "commit": args.commit or git_info["commit"],
        "status": args.status
    }

    # Simpan selalu ke backup lokal
    save_local_backup(payload)

    if args.dry_run:
        print("[lazy-log DRY RUN] Payload:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    webhook_url = resolve_webhook_url(args.webhook_url)

    if not webhook_url or "script.google.com" not in webhook_url:
        print("\n⚠️  [lazy-log] Webhook URL Google Sheets belum diatur!")
        print("Log sudah disimpan di backup lokal: ~/.lazy-log/history.jsonl")
        print("\nUntuk menghubungkan ke Google Sheets:")
        print("1. Buat Webhook via Google Apps Script (lihat folder google-apps-script/Code.gs)")
        print("2. Set URL di `config.json` atau jalankan:")
        print("   export LAZY_LOG_WEBHOOK_URL='https://script.google.com/macros/s/.../exec'\n")
        return

    try:
        print(f"📡 Mengirim log '{payload['task']}' ke Google Sheets...")
        res = send_to_google_sheets(webhook_url, payload)
        print(f"✅ Berhasil dicatat ke Google Sheets! [Status: {payload['status']}]")
    except Exception as e:
        sys.stderr.write(f"❌ Gagal mengirim ke Google Sheets: {e}\n")
        sys.stderr.write("Catatan: Log tetap aman tersimpan di backup lokal ~/.lazy-log/history.jsonl\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
