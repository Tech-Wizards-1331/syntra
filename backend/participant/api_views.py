from rest_framework import generics, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone

from organizer.models import Hackathon
from .models import Team, TeamMember, HackathonRegistration, ParticipantProfile, Skill
from .api_serializers import (
    TeamSerializer, TeamMemberSerializer, HackathonRegistrationSerializer,
    ParticipantDiscoverySerializer, JoinTeamSerializer
)


class ParticipantDiscoveryAPIView(generics.ListAPIView):
    """
    Search for participants who are looking for a team and have specific skills.
    Query params: ?skill=react&hackathon_id=1
    """
    serializer_class = ParticipantDiscoverySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only users looking for a team
        queryset = ParticipantProfile.objects.filter(looking_for_team=True)
        
        skill_query = self.request.query_params.get('skill')
        if skill_query:
            # Filter by skill name (case insensitive)
            queryset = queryset.filter(skills__name__icontains=skill_query)
            
        hackathon_id = self.request.query_params.get('hackathon_id')
        if hackathon_id:
            # Exclude users who are already in a team for this hackathon
            users_in_teams = TeamMember.objects.filter(
                hackathon_id=hackathon_id, 
                user__isnull=False
            ).values_list('user_id', flat=True)
            queryset = queryset.exclude(user_id__in=users_in_teams)
            
        return queryset.distinct()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see teams they are part of
        return Team.objects.filter(members__user=self.request.user).distinct()


class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see members of teams they are part of
        return TeamMember.objects.filter(team__members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data['team']
        if team.leader != self.request.user:
            raise PermissionDenied("Only the team leader can add members.")
        
        # Enforce hackathon_id from team
        serializer.save(hackathon=team.hackathon)


class HackathonRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = HackathonRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HackathonRegistration.objects.filter(team__members__user=self.request.user).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        team = serializer.validated_data['team']
        hackathon = serializer.validated_data['hackathon']
        
        if team.leader != request.user:
            return Response({"detail": "Only the team leader can register for the hackathon."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Lock the hackathon row to check capacity
            h = Hackathon.objects.select_for_update().get(pk=hackathon.id)
            
            # Check capacity
            current_team_count = Team.objects.filter(hackathon=h).count()
            if h.is_registration_full(current_team_count):
                return Response({"detail": "Registration is closed - hackathon is full."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Perform registration
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class JoinTeamAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = JoinTeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['invite_token']

        try:
            team = Team.objects.get(invite_token=token)
        except Team.DoesNotExist:
            return Response({"detail": "Invalid invite token."}, status=status.HTTP_404_NOT_FOUND)

        # Check if hackathon registration is still open (invites expire when registration closes)
        if timezone.now() > team.hackathon.registration_deadline:
            return Response({"detail": "Invite has expired because hackathon registration is closed."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is already in the team
        if TeamMember.objects.filter(team=team, user=request.user).exists():
            return Response({"detail": "You are already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is already in ANY team for this hackathon
        if TeamMember.objects.filter(hackathon=team.hackathon, user=request.user).exists():
            return Response({"detail": "You are already in a team for this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        TeamMember.objects.create(
            team=team,
            hackathon=team.hackathon,
            user=request.user,
            member_role='Member'
        )
        return Response({"detail": "Successfully joined team."}, status=status.HTTP_200_OK)
