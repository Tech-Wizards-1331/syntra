from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.core.cache import cache
from django.db import transaction
from django.db.models import Count, Case, When, F, Value, BooleanField, Q
from django.utils import timezone

from organizer.models import Hackathon, ProblemStatement
from .models import Team, TeamMember, ParticipantProfile, Skill, TeamRequest
from .services import add_member_to_team
from .api_serializers import (
    TeamSerializer, TeamMemberSerializer,
    ParticipantDiscoverySerializer, JoinTeamSerializer,
    SelectProblemStatementSerializer, ParticipantProblemStatementSerializer,
    TeamRequestSerializer, ParticipantProfileSerializer
)


class ParticipantDiscoveryAPIView(generics.ListAPIView):
    """
    Search for participants who are looking for a team and have specific skills.
    Query params: ?skill=react&hackathon_id=1
    """
    serializer_class = ParticipantDiscoverySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        hackathon_id = self.request.query_params.get('hackathon_id')
        if not hackathon_id:
            raise ValidationError({"hackathon_id": "This query parameter is required."})

        team = Team.objects.filter(hackathon_id=hackathon_id, leader=self.request.user).first()
        if not team:
            raise PermissionDenied("Only team leaders can search participants for this hackathon.")

        # Only visible profiles — never include the requesting user themselves
        queryset = ParticipantProfile.objects.filter(visibility=True).exclude(
            user=self.request.user
        )

        # Exclude organizers from search
        from accounts.models import User
        organizer_ids = User.objects.filter(role='organizer').values_list('id', flat=True)
        queryset = queryset.exclude(user_id__in=organizer_ids)

        skill_query = self.request.query_params.get('skill')
        if skill_query:
            queryset = queryset.filter(skills__name__icontains=skill_query)

        # Exclude users who are leaders of teams in this hackathon
        leader_ids = Team.objects.filter(hackathon_id=hackathon_id).values_list('leader_id', flat=True)
        # Exclude users who are members of teams in this hackathon (by email)
        member_emails = TeamMember.objects.filter(team__hackathon_id=hackathon_id).values_list('email', flat=True)
        # Exclude users who already have pending invites from this team
        pending_invite_user_ids = TeamRequest.objects.filter(team=team, status='pending').values_list('receiver_id', flat=True)

        queryset = queryset.exclude(
            Q(user_id__in=leader_ids) | Q(user__email__in=member_emails) | Q(user_id__in=pending_invite_user_ids)
        )

        return queryset.select_related('user').prefetch_related('skills').distinct()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Team leader OR a member matched by email (TeamMember has no user FK)
        return Team.objects.filter(
            Q(leader=self.request.user) |
            Q(members__email=self.request.user.email)
        ).distinct()

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
        # Users can only see members of teams they lead or belong to (matched by email)
        return TeamMember.objects.filter(
            Q(team__leader=self.request.user) |
            Q(team__members__email=self.request.user.email)
        ).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data['team']
        if team.leader != self.request.user:
            raise PermissionDenied("Only the team leader can add members.")

        if 1 + team.members.count() >= team.hackathon.max_team_size:
            raise ValidationError("Your team is already full.")

        serializer.save()

    def perform_destroy(self, instance):
        # Only the team leader can delete members
        if instance.team.leader != self.request.user:
            raise PermissionDenied("Only the team leader can remove members.")
        instance.delete()


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
        if team.leader_id == request.user.id or TeamMember.objects.filter(team=team, email=request.user.email).exists():
            return Response({"detail": "You are already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is already in ANY team for this hackathon
        if (
            Team.objects.filter(hackathon=team.hackathon, leader=request.user).exists() or
            TeamMember.objects.filter(team__hackathon=team.hackathon, email=request.user.email).exists()
        ):
            return Response({"detail": "You are already in a team for this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = add_member_to_team(
                team,
                user=request.user,
                email=request.user.email,
                name=request.user.get_full_name() or request.user.email,
                copy_skills_from_user=True,
            )
        except ValidationError as e:
            return Response(e.detail if hasattr(e, 'detail') else {"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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


class TeamRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TeamRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Exclude requests for hackathons where the receiver is already in a team (leader or member)
        joined_hackathon_ids = list(Team.objects.filter(leader=user).values_list('hackathon_id', flat=True))
        joined_hackathon_ids += list(TeamMember.objects.filter(email=user.email).values_list('team__hackathon_id', flat=True))
        
        return TeamRequest.objects.filter(
            Q(receiver=user) | Q(team__leader=user)
        ).exclude(
            receiver=user,
            status='pending',
            team__hackathon_id__in=joined_hackathon_ids
        ).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data['team']
        receiver = serializer.validated_data['receiver']
        
        if team.leader != self.request.user:
            raise PermissionDenied("Only the team leader can send requests.")

        # Pending invites do not reserve seats. Only accepted members count.
        from rest_framework import serializers
        if 1 + team.members.count() >= team.hackathon.max_team_size:
            raise serializers.ValidationError("Your team is already full.")

        # Do not create invites for users who already joined another team in this hackathon.
        is_already_joined = (
            Team.objects.filter(leader=receiver, hackathon=team.hackathon).exists() or
            TeamMember.objects.filter(email=receiver.email, team__hackathon=team.hackathon).exists()
        )
        if is_already_joined:
            raise serializers.ValidationError({"receiver": "This user is already in a team for this hackathon."})
            
        # Ensure the receiver is actually visible
        try:
            if not receiver.participant_profile.visibility:
                raise serializers.ValidationError({"receiver": "This user is not currently accepting team requests."})
        except ParticipantProfile.DoesNotExist:
            raise serializers.ValidationError({"receiver": "This user does not have a participant profile."})
        
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        team_request = self.get_object()

        if team_request.team.leader != request.user:
            raise PermissionDenied("Only the team leader can cancel invites.")

        if team_request.status != 'pending':
            return Response({"detail": "Only pending invites can be canceled."}, status=status.HTTP_400_BAD_REQUEST)

        team_request.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        team_request = self.get_object()
        if team_request.receiver != request.user:
            raise PermissionDenied("You can only accept requests sent to you.")
        
        if team_request.status != 'pending':
            return Response({"detail": "Request already processed."}, status=status.HTTP_400_BAD_REQUEST)

        team = team_request.team
        hackathon = team.hackathon

        # Ensure the receiver is not already in a DIFFERENT team (leader or member) for this hackathon
        is_leader_of_another_team = Team.objects.filter(leader=request.user, hackathon=hackathon).exclude(id=team.id).exists()
        is_member_of_another_team = TeamMember.objects.filter(email=request.user.email, team__hackathon=hackathon).exclude(team=team).exists()
        
        if is_leader_of_another_team or is_member_of_another_team:
            return Response({"detail": "You are already in a different team for this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                team_request.status = 'accepted'
                team_request.save()
                
                # Fetch details from participant profile to populate team member record
                profile = getattr(request.user, 'participant_profile', None)
                
                add_member_to_team(
                    team_request.team,
                    user=request.user,
                    email=request.user.email,
                    name=request.user.get_full_name() or request.user.email,
                    college=profile.college if profile else None,
                    semester=profile.semester if profile else None,
                    degree=profile.degree if profile else None,
                    copy_skills_from_user=True,
                )
                
                # Auto-delete all other pending invites for this receiver for the same hackathon
                TeamRequest.objects.filter(
                    receiver=request.user,
                    team__hackathon=hackathon,
                    status='pending'
                ).exclude(id=team_request.id).delete()
                
        except ValidationError as e:
            # Transaction rolls back automatically as ValidationError propagates out of atomic block
            return Response(e.detail if hasattr(e, 'detail') else {"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Request accepted."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        team_request = self.get_object()
        if team_request.receiver != request.user:
            raise PermissionDenied("You can only decline requests sent to you.")
        
        if team_request.status != 'pending':
            return Response({"detail": "Request already processed."}, status=status.HTTP_400_BAD_REQUEST)

        team_request.status = 'declined'
        team_request.save()
        return Response({"detail": "Request declined."}, status=status.HTTP_200_OK)

class ParticipantProfileUpdateAPIView(generics.UpdateAPIView):
    serializer_class = ParticipantProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = ParticipantProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'college': 'Not Specified', 'semester': 1, 'degree': 'Not Specified'}
        )
        return profile

    def update(self, request, *args, **kwargs):
        # Load current profile to detect visibility changes
        profile = self.get_object()
        old_visibility = profile.visibility

        # Team leaders cannot make themselves visible in the recruiting pool
        is_leader = Team.objects.filter(leader=request.user).exists()
        visibility_requested = request.data.get('visibility')
        if is_leader and visibility_requested is True:
            return Response(
                {"detail": "Team leaders cannot enable recruiting visibility."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Perform the update
        response = super().update(request, *args, **kwargs)

        # If the user turned visibility OFF, remove any pending invites for them.
        # This ensures disabling recruiting immediately withdraws outstanding invites.
        try:
            profile.refresh_from_db()
            if old_visibility and not profile.visibility:
                from .models import TeamRequest
                TeamRequest.objects.filter(receiver=request.user, status='pending').delete()
        except Exception:
            # Non-fatal; don't block the update response on cleanup failures.
            pass

        return response
