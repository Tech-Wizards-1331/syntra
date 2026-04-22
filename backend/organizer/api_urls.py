from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import HackathonViewSet, ProblemStatementViewSet

router = DefaultRouter()
router.register(r'hackathons', HackathonViewSet, basename='hackathon')

# Nested: /api/organizer/hackathons/{hackathon_pk}/problem-statements/
problem_router = DefaultRouter()
problem_router.register(r'problem-statements', ProblemStatementViewSet, basename='problem-statement')

urlpatterns = [
    path('', include(router.urls)),
    path('hackathons/<int:hackathon_pk>/', include(problem_router.urls)),
]
