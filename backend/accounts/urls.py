from django.urls import include, path

from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('select-role/', views.select_role_view, name='select_role'),
    path('complete-profile/', views.complete_profile_view, name='complete_profile'),
    path('social-redirect/', views.social_login_redirect, name='social_login_redirect'),
    # Backwards-compatible entry points (templates link here).
    # These redirect to the canonical django-allauth provider URLs.
    path('social/google/login/', views.google_login_entry, name='google_login_entry'),
    path('social/github/login/', views.github_login_entry, name='github_login_entry'),

    # Backwards-compatible allauth URLs under /accounts/social/.
    # This keeps older OAuth callback URLs working if they were already configured
    # in Google/GitHub consoles.
    path('social/', include('allauth.urls')),

    # Canonical django-allauth social login/callback URLs:
    #   /accounts/google/login/
    #   /accounts/google/login/callback/
    #   /accounts/github/login/
    #   /accounts/github/login/callback/
    # Keeping these at /accounts/ avoids common Google Console redirect_uri mismatches.
    # NOTE: allauth provider URL names (google_login, google_callback, etc.) are
    # registered via allauth.urls in our allauth version.
    path('', include('allauth.urls')),
]
