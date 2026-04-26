"""
syntra/celery.py — Celery application bootstrap.

Import order matters: this file must be imported before any task modules so
that the @shared_task decorator can reference the correct app instance.
"""
import os

from celery import Celery

# Tell Celery which Django settings module to use.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'syntra.settings')

app = Celery('syntra')

# Pull all CELERY_* keys from Django settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in every INSTALLED_APP.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Diagnostic task — prints the request context."""
    print(f'Request: {self.request!r}')
