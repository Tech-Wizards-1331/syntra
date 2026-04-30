from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.core.cache import cache
from django.db import transaction
from django.db.models import Count, Case, When, F, Value, BooleanField
from django.utils import timezone

from organizer.models import Hackathon, ProblemStatement
from .models import Team, TeamMember, ParticipantProfile, Skill
from .api_serializers import (
    TeamSerializer, TeamMemberSerializer,
    ParticipantDiscoverySerializer, JoinTeamSerializer,
    SelectProblemStatementSerializer, ParticipantProblemStatementSerializer
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

    @action(detail=True, methods=['post'])
    def select_problem_statement(self, request, pk=None):
        """
        Concurrency-safe problem statement selection.
        Uses select_for_update() to acquire a row lock, then checks capacity.
        Once a team selects, it is locked in permanently (D-01).
        """
        team = self.get_object()

        # Only the team leader can select
        if team.leader != request.user:
            raise PermissionDenied("Only the team leader can select a problem statement.")

        # D-01: Selection is permanent
        if team.selected_problem_statement is not None:
            return Response(
                {"detail": "Problem statement is already locked in and cannot be changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SelectProblemStatementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ps_id = serializer.validated_data['problem_statement_id']

        with transaction.atomic():
            try:
                ps = ProblemStatement.objects.select_for_update().get(
                    id=ps_id, hackathon=team.hackathon, is_active=True
                )
            except ProblemStatement.DoesNotExist:
                return Response(
                    {"detail": "Problem statement not found or inactive."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # D-02 + D-03: Check capacity under lock
            current_count = ps.selected_by_teams.count()
            if current_count >= ps.max_teams_allowed:
                return Response(
                    {"detail": "This problem statement has reached its capacity limit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            team.selected_problem_statement = ps
            team.save(update_fields=['selected_problem_statement'])

            # Invalidate the cached problem statement list for this hackathon
            cache_key = f"problem_statements_list_{team.hackathon.id}"
            cache.delete(cache_key)

        return Response(
            {"detail": "Problem statement selected successfully."},
            status=status.HTTP_200_OK,
        )


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


class ParticipantProblemStatementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only endpoint for participants to browse problem statements.
    Implements Cache-Aside pattern:
      - Reads check cache first (sub-millisecond).
      - On cache miss, fetches from DB, annotates with capacity metrics, caches result.
      - Cache is invalidated by TeamViewSet.select_problem_statement on writes.
    """
    serializer_class = ParticipantProblemStatementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProblemStatement.objects.filter(is_active=True).annotate(
            current_teams_count=Count('selected_by_teams'),
            is_full=Case(
                When(current_teams_count__gte=F('max_teams_allowed'), then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
        )

    def list(self, request, *args, **kwargs):
        hackathon_id = request.query_params.get('hackathon_id')
        if not hackathon_id:
            return Response(
                {"detail": "hackathon_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = f"problem_statements_list_{hackathon_id}"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        # Cache miss — fetch from DB, annotate, serialize, cache
        queryset = self.get_queryset().filter(hackathon_id=hackathon_id)
        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, timeout=3600)
        return Response(serializer.data)
