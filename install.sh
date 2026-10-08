#!/usr/bin/env bash
set -e

# lazy-log installer script
# Mendukung instalasi:
# 1. Global: ~/.gemini/config/skills/lazy-log (Aktif di semua project di komputer ini)
# 2. Per-Project: <project-dir>/.agents/skills/lazy-log (Khusus project tertentu & otomatis untuk tim)

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="global"
PROJECT_DIR=""

show_help() {
  echo "Penggunaan: ./install.sh [OPSI]"
  echo ""
  echo "Opsi:"
  echo "  --global              Pasang secara global ke ~/.gemini/config/skills/lazy-log (Default)"
  echo "  --project [PATH]      Pasang khusus per-project ke [PATH]/.agents/skills/lazy-log"
  echo "  --help, -h            Tampilkan bantuan ini"
  echo ""
  echo "Contoh:"
  echo "  ./install.sh"
  echo "  ./install.sh --project /Users/redantcolony/Workspace/javamas-mobile"
  echo "  ./install.sh --project ."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)
      MODE="global"
      shift
      ;;
    --project)
      MODE="project"
      PROJECT_DIR="${2:-.}"
      if [[ "$PROJECT_DIR" == --* || -z "$PROJECT_DIR" ]]; then
        PROJECT_DIR="."
        shift
      else
        shift 2
      fi
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Opsi tidak dikenal: $1"
      show_help
      exit 1
      ;;
  esac
done

if [ "$MODE" = "global" ]; then
  TARGET_DIR="$HOME/.gemini/config/skills/lazy-log"
  echo "🚀 Memasang lazy-log secara GLOBAL ke Antigravity..."
  mkdir -p "$HOME/.gemini/config/skills"

  if [ -L "$TARGET_DIR" ]; then
    rm "$TARGET_DIR"
  elif [ -d "$TARGET_DIR" ]; then
    mv "$TARGET_DIR" "${TARGET_DIR}.bak"
  fi

  ln -sf "$SOURCE_DIR" "$TARGET_DIR"

  echo "✅ Berhasil dipasang secara Global!"
  echo "📍 Lokasi: $TARGET_DIR -> $SOURCE_DIR"
  echo "💡 Skill ini sekarang otomatis aktif di semua project yang Anda buka di Antigravity."

else
  # Mode Per-Project
  RESOLVED_PROJ="$(cd "$PROJECT_DIR" && pwd)"
  TARGET_DIR="$RESOLVED_PROJ/.agents/skills/lazy-log"

  echo "🚀 Memasang lazy-log PER-PROJECT ke: $RESOLVED_PROJ..."
  mkdir -p "$RESOLVED_PROJ/.agents/skills"

  if [ -L "$TARGET_DIR" ]; then
    rm "$TARGET_DIR"
  elif [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
  fi

  # Copy folder skill ke .agents/skills/ agar independen di project tersebut
  mkdir -p "$TARGET_DIR/scripts" "$TARGET_DIR/google-apps-script"
  cp "$SOURCE_DIR/SKILL.md" "$TARGET_DIR/"
  cp "$SOURCE_DIR/scripts/log_activity.py" "$TARGET_DIR/scripts/"
  cp "$SOURCE_DIR/google-apps-script/Code.gs" "$TARGET_DIR/google-apps-script/"
  cp "$SOURCE_DIR/config.example.json" "$TARGET_DIR/"
  if [ -f "$SOURCE_DIR/config.json" ]; then
    cp "$SOURCE_DIR/config.json" "$TARGET_DIR/"
  fi

  # Buat marker file .lazy-log di root project
  echo "# lazy-log enabled for $(basename "$RESOLVED_PROJ")" > "$RESOLVED_PROJ/.lazy-log"

  # Pastikan .gitignore di repo tersebut mengabaikan file sensitif
  if [ -f "$RESOLVED_PROJ/.gitignore" ]; then
    if ! grep -q ".agents/skills/lazy-log/config.json" "$RESOLVED_PROJ/.gitignore" 2>/dev/null; then
      echo -e "\n# lazy-log config" >> "$RESOLVED_PROJ/.gitignore"
      echo ".agents/skills/lazy-log/config.json" >> "$RESOLVED_PROJ/.gitignore"
    fi
  fi

  echo "✅ Berhasil dipasang khusus untuk project ini!"
  echo "📍 Lokasi Skill: $TARGET_DIR"
  echo "📍 Marker File: $RESOLVED_PROJ/.lazy-log"
  echo "💡 Siapa pun yang membuka project ini akan langsung memiliki skill lazy-log secara otomatis!"
fi

echo ""
echo "Langkah selanjutnya:"
echo "1. Pastikan config.json sudah berisi Webhook URL spreadsheet kantor Anda."
echo "2. Buka Antigravity di project ini dan coba ketik: 'catat apa yang baru saja kita kerjakan ke lazy-log'"
