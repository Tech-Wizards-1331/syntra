from django.urls import path

from .api_views import LoginAPIView, MeAPIView, RegisterAPIView, CookieTokenRefreshView, CookieLogoutView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api_register'),
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeAPIView.as_view(), name='api_me'),
    path('logout/', CookieLogoutView.as_view(), name='api_logout'),
]
