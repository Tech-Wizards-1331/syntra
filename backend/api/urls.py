from django.urls import path, include

from .views import hello_api

urlpatterns = [
    path('hello/', hello_api, name='hello_api'),
    path('organizer/', include('organizer.api_urls')),
    path('participant/', include('participant.api_urls')),
]
