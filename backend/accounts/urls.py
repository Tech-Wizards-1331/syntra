from django.urls import include, path

from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('social-redirect/', views.social_login_redirect, name='social_login_redirect'),
    # Backwards-compatible entry points (templates link here).
    # These redirect to the canonical django-allauth provider URLs.
    path('social/google/login/', views.google_login_entry, name='google_login_entry'),
    path('social/github/login/', views.github_login_entry, name='github_login_entry'),

    # Canonical django-allauth social login/callback URLs:
    #   /accounts/google/login/
    #   /accounts/google/login/callback/
    #   /accounts/github/login/
    #   /accounts/github/login/callback/
    # Keep only one allauth include so reverse('google_callback') and
    # reverse('github_callback') always produce the callback URLs above.
    path('', include('allauth.urls')),
]
