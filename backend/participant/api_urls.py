from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import (
    TeamViewSet, 
    TeamMemberViewSet, 
    ParticipantDiscoveryAPIView,
    JoinTeamAPIView,
    ParticipantProblemStatementViewSet,
)

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-members', TeamMemberViewSet, basename='teammember')
router.register(r'problem-statements', ParticipantProblemStatementViewSet, basename='participant-problem-statement')

urlpatterns = [
    path('discovery/', ParticipantDiscoveryAPIView.as_view(), name='participant_discovery'),
    path('teams/join/', JoinTeamAPIView.as_view(), name='join_team'),
    path('', include(router.urls)),
]
