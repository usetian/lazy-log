#!/usr/bin/env bash
set -e

# lazy-log installer script
# Mendukung instalasi Global (symlink atau copy) ke folder Antigravity config

TARGET_DIR="$HOME/.gemini/config/skills/lazy-log"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Memasang lazy-log ke Antigravity..."

mkdir -p "$HOME/.gemini/config/skills"

if [ -L "$TARGET_DIR" ]; then
    echo "⚠️  Symlink lama ditemukan, memperbarui symlink..."
    rm "$TARGET_DIR"
elif [ -d "$TARGET_DIR" ]; then
    echo "⚠️  Folder lama ditemukan di $TARGET_DIR. Membackup ke $TARGET_DIR.bak..."
    mv "$TARGET_DIR" "${TARGET_DIR}.bak"
fi

# Buat symlink agar perubahan di git repo langsung terasa tanpa perlu copy ulang
ln -s "$SOURCE_DIR" "$TARGET_DIR"

echo "✅ Berhasil dipasang secara Global!"
echo "📍 Symlink: $TARGET_DIR -> $SOURCE_DIR"
echo ""
echo "Langkah selanjutnya:"
echo "1. Buat Google Sheets dan Apps Script Webhook (lihat google-apps-script/Code.gs)"
echo "2. Salin config.example.json ke config.json dan isi webhook_url Anda:"
echo "   cp config.example.json config.json"
echo "3. Buka Antigravity dan coba minta AI: 'catat apa yang baru saja kita kerjakan ke lazy-log'"
