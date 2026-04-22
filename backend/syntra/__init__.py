# syntra/__init__.py
# Ensure the Celery app is loaded when Django starts so that @shared_task
# decorators in every app can find the correct Celery instance.
from .celery import app as celery_app  # noqa: F401

__all__ = ('celery_app',)
