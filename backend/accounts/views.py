"""
accounts/views.py — Thin view layer.
Handles basic authentication (login, signup, logout) without business logic.
"""

from __future__ import annotations

import logging

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import MultipleObjectsReturned
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST
from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.models import SocialApp

from .forms import LoginForm, SignUpForm, ParticipantProfileForm
from .services import has_social_account
from .models import User
from .services import resolve_post_login_destination

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Internal Helpers (HTTP-layer only)
# ──────────────────────────────────────────────────────────────────────────────

def _safe_next_url(request: HttpRequest) -> str | None:
    """Validate and return a safe ?next= redirect URL, or None."""
    next_url = request.POST.get('next') or request.GET.get('next')
    if not next_url:
        return None
    if url_has_allowed_host_and_scheme(
        url=next_url,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        return next_url
    return None


def _redirect_by_state(user: User) -> HttpResponse:
    """Redirect a user to the right place based on their current state."""
    destination = resolve_post_login_destination(user)

    if destination.startswith('/'):
        return redirect(destination)
    return redirect(destination)


# ──────────────────────────────────────────────────────────────────────────────
# Auth Views
# ──────────────────────────────────────────────────────────────────────────────

@never_cache
def signup_view(request: HttpRequest) -> HttpResponse:
    """Handle new user registration."""
    if request.user.is_authenticated:
        return _redirect_by_state(request.user)

    form = SignUpForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save(commit=False)
        user.set_password(form.cleaned_data['password1'])
        user.role = 'participant'
        user.save()
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        messages.success(request, 'Account created successfully.')
        return redirect('complete_profile')

    return render(request, 'accounts/signup.html', {'form': form})


@never_cache
def login_view(request: HttpRequest) -> HttpResponse:
    """Handle email/password login with optional ?next= redirect."""
    if request.user.is_authenticated:
        safe_next = _safe_next_url(request)
        if safe_next:
            return redirect(safe_next)
        return _redirect_by_state(request.user)

    form = LoginForm(request.POST or None)
    safe_next = _safe_next_url(request)

    if request.method == 'POST' and form.is_valid():
        email = form.cleaned_data['email'].strip().lower()
        password = form.cleaned_data['password']
        user = authenticate(request, email=email, password=password)

        if user is None:
            messages.error(request, 'Invalid credentials.')
        else:
            login(request, user)
            if safe_next:
                return redirect(safe_next)
            return _redirect_by_state(user)

    return render(request, 'accounts/login.html', {'form': form, 'next': safe_next or ''})


@require_POST
@login_required
def logout_view(request: HttpRequest) -> HttpResponse:
    """Log the user out and redirect to login."""
    logout(request)

    if 'application/json' in request.headers.get('Accept', ''):
        resp = JsonResponse({'ok': True})
        resp.delete_cookie('sessionid')
        return resp

    response = redirect('/accounts/login/')
    response.delete_cookie('sessionid')
    return response


@never_cache
@login_required
def complete_profile_view(request: HttpRequest) -> HttpResponse:
    """Show and process the profile-completion form for participants."""
    user = request.user
    user_role = user.role or 'participant'
    is_participant = user_role == 'participant'

    from participant.models import ParticipantProfile, Skill

    # Get or prepare the profile instance
    try:
        profile = user.participant_profile
    except ParticipantProfile.DoesNotExist:
        profile = None

    if request.method == 'POST':
        profile_form = ParticipantProfileForm(
            request.POST, instance=profile
        )
        full_name = request.POST.get('full_name', '').strip()
        if full_name:
            user.full_name = full_name

        if profile_form.is_valid():
            p = profile_form.save(commit=False)
            p.user = user
            p.save()

            # Handle skills
            skills_raw = request.POST.get('skills', '')
            if skills_raw:
                skill_names = [s.strip() for s in skills_raw.split(',') if s.strip()]
                skill_objs = []
                for name in skill_names[:10]:
                    obj, _ = Skill.objects.get_or_create(name=name)
                    skill_objs.append(obj)
                p.skills.set(skill_objs)

            user.is_profile_complete = True
            user.save(update_fields=['full_name', 'is_profile_complete'])
            messages.success(request, 'Profile completed successfully!')
            return redirect('dashboard')
    else:
        profile_form = ParticipantProfileForm(instance=profile)

    context = {
        'profile_form': profile_form,
        'user_role': user_role,
        'is_participant': is_participant,
        'has_github': has_social_account(user, 'github'),
    }
    return render(request, 'accounts/complete_profile.html', context)


# ──────────────────────────────────────────────────────────────────────────────
# Social Auth Entry Points
# ──────────────────────────────────────────────────────────────────────────────

@login_required
def social_login_redirect(request: HttpRequest) -> HttpResponse:
    """Post-social-login routing — sends user to dashboard."""
    return _redirect_by_state(request.user)


def _social_provider_configured(request: HttpRequest, provider: str) -> bool:
    """Check if a social provider has valid credentials configured."""
    try:
        get_adapter(request).get_app(request, provider=provider)
    except SocialApp.DoesNotExist:
        return False
    except MultipleObjectsReturned:
        return False
    return True


def google_login_entry(request: HttpRequest) -> HttpResponse:
    """Legacy entry point for Google OAuth — redirects to allauth's canonical URL."""
    if not _social_provider_configured(request, 'google'):
        messages.error(
            request,
            'Google login is not configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET '
            'or add a Google SocialApp in /admin/.',
        )
        return redirect('login')

    query_string = request.META.get('QUERY_STRING')
    target = reverse('google_login')
    if query_string:
        target = f'{target}?{query_string}'
    return redirect(target)


def github_login_entry(request: HttpRequest) -> HttpResponse:
    """Legacy entry point for GitHub OAuth — redirects to allauth's canonical URL."""
    if not _social_provider_configured(request, 'github'):
        messages.error(
            request,
            'GitHub login is not configured. Set GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET '
            'or add a GitHub SocialApp in /admin/.',
        )
        return redirect('login')

    query_string = request.META.get('QUERY_STRING')
    target = reverse('github_login')
    if query_string:
        target = f'{target}?{query_string}'
    return redirect(target)
