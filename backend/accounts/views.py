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
# Dashboard View
# ──────────────────────────────────────────────────────────────────────────────

@never_cache
@login_required
def dashboard_view(request: HttpRequest) -> HttpResponse:
    """Role-aware dashboard that inlines organizer features directly."""
    context: dict = {}

    if getattr(request.user, 'role', None) == 'organizer':
        from organizer.models import Hackathon
        if hasattr(request.user, 'organizer_profile'):
            context['hackathons'] = (
                Hackathon.objects
                .filter(organizer=request.user.organizer_profile)
                # Defer large JSON blobs — only needed on detail pages
                .defer('room_configuration', 'seating_allocation')
                .order_by('-created_at')
            )
        else:
            context['hackathons'] = []
    elif getattr(request.user, 'role', None) == 'participant':
        from organizer.models import Hackathon
        from participant.models import Team, ParticipantProfile
        from django.utils import timezone

        # Discard any draft teams for expired hackathons
        Team.objects.filter(
            is_registered=False,
            hackathon__registration_deadline__lt=timezone.now()
        ).delete()

        profile, _ = ParticipantProfile.objects.get_or_create(
            user=request.user,
            defaults={'college': 'Not Specified', 'semester': 1, 'degree': 'Not Specified'}
        )

        # Force recruiting visibility to False if the user is already a team leader or team member
        from django.db.models import Q
        from participant.models import TeamMember
        is_in_team = Team.objects.filter(leader=request.user).exists() or TeamMember.objects.filter(email=request.user.email).exists()
        if is_in_team and profile.visibility:
            profile.visibility = False
            profile.save()

        has_registered_team = (
            Team.objects.filter(leader=request.user, is_registered=True).exists() or
            TeamMember.objects.filter(email=request.user.email, team__is_registered=True).exists()
        )
        context['has_registered_team'] = has_registered_team

        context['profile'] = profile
        context['upcoming_hackathons'] = (
            Hackathon.objects
            .filter(status='registration_open', registration_deadline__gt=timezone.now())
            # Only pull columns the template needs — skip the heavy JSON blobs
            .defer('room_configuration', 'seating_allocation', 'description')
            .order_by('start_date')
        )
        context['my_teams'] = (
            Team.objects
            .filter(Q(leader=request.user) | Q(members__email=request.user.email))
            # Join hackathon and leader in a single query
            .select_related('hackathon', 'leader')
            .distinct()
            .order_by('-created_at')
        )

        # Notify team leader if any sent team invitations were declined
        from participant.models import TeamRequest
        declined_requests = TeamRequest.objects.filter(
            team__leader=request.user, 
            status='declined'
        ).select_related('receiver', 'team', 'team__hackathon')
        
        if declined_requests.exists():
            for req in declined_requests:
                receiver_name = req.receiver.get_full_name() or req.receiver.email
                messages.warning(
                    request,
                    f"Invitation sent to {receiver_name} for team '{req.team.name}' ({req.team.hackathon.name}) was declined."
                )
            # Clear them so the leader is only notified once
            declined_requests.delete()

    return render(request, 'accounts/dashboard.html', context)


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


@login_required
def logout_view(request: HttpRequest) -> HttpResponse:
    """Log the user out and redirect to login."""
    logout(request)

    if 'application/json' in request.headers.get('Accept', ''):
        resp = JsonResponse({'ok': True})
        resp.delete_cookie('sessionid')
        resp.delete_cookie('access')
        resp.delete_cookie('refresh')
        return resp

    response = redirect('/accounts/login/')
    response.delete_cookie('sessionid')
    response.delete_cookie('access')
    response.delete_cookie('refresh')
    return response


@never_cache
@login_required
def complete_profile_view(request: HttpRequest) -> HttpResponse:
    """Display and edit the participant profile. Read-only when profile is complete."""
    user = request.user
    user_role = user.role or 'participant'
    is_participant = user_role == 'participant'

    from participant.models import ParticipantProfile
    from .forms import ParticipantProfileForm

    profile = None
    if is_participant:
        try:
            profile = user.participant_profile
        except ParticipantProfile.DoesNotExist:
            profile = None

    # Determine edit mode:
    # - Always editable on first visit (profile_complete = False)
    # - When profile_complete = True, editable only if ?edit=1 is passed
    profile_complete = user.is_profile_complete
    edit_requested = request.GET.get('edit') == '1'
    is_editable = (not profile_complete) or edit_requested

    if request.method == 'POST' and is_participant and is_editable:
        form = ParticipantProfileForm(request.POST, instance=profile, user=user)
        if form.is_valid():
            new_profile = form.save(commit=False)
            new_profile.user = user
            new_profile.save()
            form.save_m2m()
            
            # Save the updated full_name
            new_full_name = form.cleaned_data.get('full_name', '').strip()
            user_needs_update = False
            update_fields = []
            
            if new_full_name and user.full_name != new_full_name:
                user.full_name = new_full_name
                update_fields.append('full_name')
                user_needs_update = True

            # Mark profile as complete once all required fields are filled
            if new_profile.college and new_profile.degree and new_profile.semester:
                if not user.is_profile_complete:
                    user.is_profile_complete = True
                    update_fields.append('is_profile_complete')
                    user_needs_update = True
                
                # Assign role if missing (e.g. new social logins)
                if not user.role:
                    user.role = 'participant'
                    update_fields.append('role')
                    user_needs_update = True
            
            if user_needs_update:
                user.save(update_fields=update_fields)
                
            messages.success(request, 'Profile saved successfully!')
            return redirect('complete_profile')
    else:
        form = ParticipantProfileForm(instance=profile, user=user) if (is_participant and is_editable) else None

    # Skills for read-only display
    skills = []
    if profile and hasattr(profile, 'skills'):
        skills = list(profile.skills.values_list('name', flat=True))

    context = {
        'profile': profile,
        'user_role': user_role,
        'is_participant': is_participant,
        'has_github': has_social_account(user, 'github'),
        'skills': skills,
        'form': form,
        'is_editable': is_editable,
        'profile_complete': profile_complete,
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
