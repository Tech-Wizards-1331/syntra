from django.conf import settings
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from .models import User


class SyntraSocialAccountAdapter(DefaultSocialAccountAdapter):
    def _settings_client_id(self, provider):
        provider_config = settings.SOCIALACCOUNT_PROVIDERS.get(provider) or {}
        app_config = provider_config.get('APP') or {}
        return (app_config.get('client_id') or '').strip()

    def list_apps(self, request, provider=None, client_id=None):
        apps = super().list_apps(request, provider=provider, client_id=client_id)
        provider_ids = {app.provider for app in apps}
        preferred_apps = []

        for provider_id in provider_ids:
            provider_apps = [app for app in apps if app.provider == provider_id]
            settings_client_id = self._settings_client_id(provider_id)
            settings_apps = [
                app
                for app in provider_apps
                if not app.pk and app.client_id == settings_client_id
            ]

            if settings_client_id and settings_apps:
                preferred_apps.extend(settings_apps)
            else:
                preferred_apps.extend(provider_apps)

        return preferred_apps

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        name = (data.get('name') or '').strip()
        if name and not getattr(user, 'full_name', ''):
            user.full_name = name
        return user

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        verified_emails = [
            address.email
            for address in sociallogin.email_addresses
            if address.verified and address.email
        ]
        email = (verified_emails[0] if verified_emails else sociallogin.user.email or '').strip().lower()
        if not email:
            return

        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            sociallogin.connect(request, existing_user)
