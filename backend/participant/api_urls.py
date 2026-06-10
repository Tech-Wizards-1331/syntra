from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api_views import (
    TeamViewSet, 
    TeamMemberViewSet, 
    ParticipantDiscoveryAPIView,
    JoinTeamAPIView,
    ParticipantProblemStatementViewSet,
    TeamRequestViewSet,
    ParticipantProfileUpdateAPIView
)

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-members', TeamMemberViewSet, basename='teammember')
router.register(r'problem-statements', ParticipantProblemStatementViewSet, basename='participant-problem-statement')
router.register(r'requests', TeamRequestViewSet, basename='teamrequest')

urlpatterns = [
    path('discovery/', ParticipantDiscoveryAPIView.as_view(), name='participant_discovery'),
    path('teams/join/', JoinTeamAPIView.as_view(), name='join_team'),
    path('profile/', ParticipantProfileUpdateAPIView.as_view(), name='participant_profile_update'),
    path('', include(router.urls)),
]
