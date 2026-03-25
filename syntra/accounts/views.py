from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount.providers.github.views import oauth2_login as github_oauth2_login
from allauth.socialaccount.providers.google.views import oauth2_login as google_oauth2_login

from .forms import LoginForm, ProfileCompletionForm, RoleSelectionForm, SignUpForm
from .models import User


ROLE_DASHBOARD_MAP = {
    User.Role.PARTICIPANT: '/participant/dashboard',
    User.Role.ORGANIZER: '/organizer/dashboard',
    User.Role.JUDGE: '/judge/dashboard',
    User.Role.VOLUNTEER: '/volunteers/dashboard',
    User.Role.SUPER_ADMIN: '/super_admin/dashboard',
}


def _safe_next_url(request):
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


def signup_view(request):
    if request.user.is_authenticated:
        return redirect_by_role(request.user)

    form = SignUpForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save(commit=False)
        user.set_password(form.cleaned_data['password1'])
        user.role = None
        user.save()
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        messages.success(request, 'Account created successfully. Please select your role to continue.')
        return redirect('select_role')

    return render(request, 'accounts/signup.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        safe_next_url = _safe_next_url(request)
        if safe_next_url:
            return redirect(safe_next_url)
        if not request.user.role:
            return redirect('select_role')
        if not getattr(request.user, 'is_profile_complete', False):
            return redirect('complete_profile')
        return redirect_by_role(request.user)

    form = LoginForm(request.POST or None)
    safe_next_url = _safe_next_url(request)
    if request.method == 'POST' and form.is_valid():
        email = form.cleaned_data['email'].strip().lower()
        password = form.cleaned_data['password']
        user = authenticate(request, email=email, password=password)

        if user is None:
            messages.error(request, 'Invalid credentials.')
        else:
            login(request, user)
            if safe_next_url:
                return redirect(safe_next_url)
            if not user.role:
                return redirect('select_role')
            if not getattr(user, 'is_profile_complete', False):
                return redirect('complete_profile')
            return redirect_by_role(user)

    return render(request, 'accounts/login.html', {'form': form, 'next': safe_next_url or ''})


@login_required
def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def select_role_view(request):
    user = request.user
    if user.is_superuser and not user.role:
        user.role = User.Role.SUPER_ADMIN
        user.save(update_fields=['role', 'updated_at'])
        return redirect_by_role(user)

    if user.role:
        return redirect_by_role(user)

    form = RoleSelectionForm(request.POST or None)

    if request.method == 'POST' and form.is_valid():
        selected_role = form.cleaned_data['role']
        user.role = selected_role
        user.save(update_fields=['role', 'updated_at'])
        messages.success(request, 'Role selected successfully.')
        return redirect_by_role(user)

    return render(request, 'accounts/select_role.html', {'form': form})


@login_required
def social_login_redirect(request):
    if not request.user.role:
        messages.info(request, 'Choose your role to continue.')
        return redirect('select_role')
    if not getattr(request.user, 'is_profile_complete', False):
        return redirect('complete_profile')
    return redirect_by_role(request.user)


@login_required
def complete_profile_view(request):
    user = request.user

    if user.is_superuser and not getattr(user, 'is_profile_complete', False):
        user.is_profile_complete = True
        user.save(update_fields=['is_profile_complete', 'updated_at'])
        return redirect_by_role(user)

    if getattr(user, 'is_profile_complete', False):
        return redirect_by_role(user)

    form = ProfileCompletionForm(request.POST or None, instance=user)
    if request.method == 'POST' and form.is_valid():
        form.save()
        user.is_profile_complete = True
        user.save(update_fields=['is_profile_complete', 'updated_at'])
        messages.success(request, 'Profile completed successfully.')
        return redirect_by_role(user)

    return render(request, 'accounts/complete_profile.html', {'form': form})


def google_login_entry(request):
    try:
        return google_oauth2_login(request)
    except SocialApp.DoesNotExist:
        messages.error(
            request,
            'Google login is not configured. Add a Google SocialApp in /admin/.',
        )
        return redirect('login')


def github_login_entry(request):
    try:
        return github_oauth2_login(request)
    except SocialApp.DoesNotExist:
        messages.error(
            request,
            'GitHub login is not configured. Add a GitHub SocialApp in /admin/.',
        )
        return redirect('login')


def redirect_by_role(user):
    if not getattr(user, 'is_profile_complete', False) and not user.is_superuser:
        return redirect('complete_profile')

    target = ROLE_DASHBOARD_MAP.get(user.role)
    if target:
        return redirect(target)

    if user.is_superuser:
        return redirect('/super_admin/dashboard')

    return redirect('select_role')