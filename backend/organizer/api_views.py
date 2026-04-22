from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Hackathon, HackathonCoordinator, OrganizerProfile, ProblemStatement
from .api_serializers import (
    HackathonSerializer,
    HackathonCoordinatorSerializer,
    ProblemStatementSerializer,
)

User = get_user_model()

class IsOrganizer(permissions.BasePermission):
    """
    Allows access only to users with the ORGANIZER role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ORGANIZER)


class HackathonViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides the standard actions for a Sub-Admin's Hackathons.
    """
    serializer_class = HackathonSerializer
    permission_classes = [IsOrganizer]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        # We only want to return hackathons owned by this logged in organizer
        return Hackathon.objects.filter(organizer__user=self.request.user)

    def perform_create(self, serializer):
        # Make sure the user has an OrganizerProfile
        profile, created = OrganizerProfile.objects.get_or_create(user=self.request.user)
        serializer.save(organizer=profile)

    @action(detail=True, methods=['post'])
    def assign_coordinator(self, request, pk=None):
        hackathon = self.get_object()
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure user role is coordinator
        if user.role != User.Role.COORDINATOR:
            user.role = User.Role.COORDINATOR
            user.save()
            
        # Create scoped permission assignment
        assignment, created = HackathonCoordinator.objects.get_or_create(
            user=user, 
            hackathon=hackathon
        )
        
        if not created:
            return Response({'message': 'User is already a coordinator for this hackathon.'}, status=status.HTTP_200_OK)

        serializer = HackathonCoordinatorSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        hackathon = self.get_object()
        # Placeholder for analytics logic
        data = {
            'total_teams': 0,
            'total_participants': 0,
            'status': hackathon.status,
            'message': 'Analytics endpoint placeholder'
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def notify_participants(self, request, pk=None):
        hackathon = self.get_object()
        message = request.data.get('message', f'Update from {hackathon.name}')
        # Log to console for now — will be replaced with email/SMS integration
        print(f"[NOTIFY] {hackathon.name}: {message}")
        return Response({'success': True, 'message': 'Notification logged (placeholder).'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def generate_results(self, request, pk=None):
        hackathon = self.get_object()
        
        # Placeholder for logic
        return Response({'success': True, 'message': 'Results generated (placeholder).'}, status=status.HTTP_200_OK)


class ProblemStatementViewSet(viewsets.ModelViewSet):
    """
    CRUD for problem statements scoped to a hackathon owned by the organizer.
    URL: /api/organizer/hackathons/{hackathon_pk}/problem-statements/
    """
    serializer_class = ProblemStatementSerializer
    permission_classes = [IsOrganizer]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_hackathon(self):
        """Resolve hackathon ensuring the organizer owns it."""
        return get_object_or_404(
            Hackathon,
            pk=self.kwargs['hackathon_pk'],
            organizer__user=self.request.user,
        )

    def get_queryset(self):
        return ProblemStatement.objects.filter(
            hackathon_id=self.kwargs['hackathon_pk'],
            hackathon__organizer__user=self.request.user,
        )

    def perform_create(self, serializer):
        hackathon = self._get_hackathon()
        serializer.save(hackathon=hackathon)

    def perform_update(self, serializer):
        # Ensure hackathon ownership on update too
        self._get_hackathon()
        serializer.save()
