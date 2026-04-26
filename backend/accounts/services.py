"""
accounts/services.py — Business logic layer for authentication and profile management.
Simplified to only include core auth helpers for the stripped-down application.
"""

from __future__ import annotations

import logging
from django.db.models import Model
from allauth.socialaccount.models import SocialAccount
from .models import User

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Social Account Helpers
# ──────────────────────────────────────────────────────────────────────────────

def has_social_account(user: User, provider: str) -> bool:
    """Check if the user has a connected social account for the given provider."""
    return SocialAccount.objects.filter(user=user, provider=provider).exists()


def get_github_profile_url(user: User) -> str:
    """Extract the GitHub html_url from the social account extra_data."""
    try:
        sa = SocialAccount.objects.get(user=user, provider='github')
        return (sa.extra_data or {}).get('html_url', '')
    except SocialAccount.DoesNotExist:
        return ''

# ──────────────────────────────────────────────────────────────────────────────
# Navigation Helpers
# ──────────────────────────────────────────────────────────────────────────────

def resolve_post_login_destination(user: User) -> str:
    """Determine where to send a user after login/signup.
    Since we only have auth, just send them to a simple home or dashboard.
    """
    return '/'
