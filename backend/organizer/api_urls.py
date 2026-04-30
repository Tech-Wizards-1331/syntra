from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import ProblemStatementViewSet

router = DefaultRouter()
router.register(r'problem-statements', ProblemStatementViewSet, basename='problemstatement')

urlpatterns = [
    path('', include(router.urls)),
]
