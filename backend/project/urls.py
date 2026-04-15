from django.urls import include, path

from syntra.urls import urlpatterns as legacy_urlpatterns

urlpatterns = [
    *legacy_urlpatterns,
    path('api/', include('api.urls')),
]
