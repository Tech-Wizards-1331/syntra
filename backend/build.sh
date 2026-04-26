#!/usr/bin/env bash
# build.sh — Render.com build script for Syntra
# This runs during every deploy on Render.
set -o errexit   # exit on error

echo "▶ Installing Python dependencies…"
pip install --upgrade pip
pip install -r requirements.txt

echo "▶ Collecting static files…"
python manage.py collectstatic --no-input

echo "▶ Running database migrations…"
python manage.py migrate --no-input

echo "✅ Build complete!"
