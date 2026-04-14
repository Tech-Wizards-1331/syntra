from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from .models import User


class SyntraSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        email = (sociallogin.user.email or '').strip().lower()
        if not email:
            return

        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user and sociallogin.user.pk != existing_user.pk:
            sociallogin.connect(request, existing_user)
