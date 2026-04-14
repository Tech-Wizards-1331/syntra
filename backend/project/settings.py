from syntra.settings import *  # noqa: F401,F403

ROOT_URLCONF = 'project.urls'
WSGI_APPLICATION = 'project.wsgi.application'
ASGI_APPLICATION = 'project.asgi.application'

if 'api' not in INSTALLED_APPS:
    INSTALLED_APPS = [*INSTALLED_APPS, 'api']
