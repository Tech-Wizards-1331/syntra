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

echo "▶ Configuring django.contrib.sites…"
python manage.py shell -c "
from django.contrib.sites.models import Site
import os
domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'localhost')
site, _ = Site.objects.update_or_create(id=1, defaults={'domain': domain, 'name': 'Syntra'})
print(f'  Site #{site.id}: {site.domain}')
"

echo "▶ Creating superuser (if DJANGO_SUPERUSER_EMAIL is set)…"
if [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    python manage.py shell -c "
from accounts.models import User
import os
email = os.environ['DJANGO_SUPERUSER_EMAIL']
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password)
    print(f'  ✅ Superuser created: {email}')
else:
    print(f'  ⏭  Superuser already exists: {email}')
"
else
    echo "  ⏭  Skipped (set DJANGO_SUPERUSER_EMAIL env var to enable)"
fi

echo "✅ Build complete!"
