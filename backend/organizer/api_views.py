from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied

from .models import ProblemStatement, Hackathon
from .api_serializers import ProblemStatementSerializer


class IsOrganizerPermission(permissions.BasePermission):
    """Only allow users with the 'organizer' role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'organizer'
        )


class ProblemStatementViewSet(viewsets.ModelViewSet):
    """
    CRUD for problem statements scoped to hackathons owned by the
    authenticated organizer.

    - List / Retrieve: returns problem statements for the organizer's hackathons.
    - Create: requires `hackathon` in request body; validated against ownership.
    - Update / Delete: only the owning organizer can modify.
    """
    serializer_class = ProblemStatementSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerPermission]

    def get_queryset(self):
        return ProblemStatement.objects.filter(
            hackathon__organizer__user=self.request.user,
        )

    def perform_create(self, serializer):
        hackathon = serializer.validated_data['hackathon']
        if hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only add problem statements to your own hackathons."
            )
        serializer.save()

    def perform_update(self, serializer):
        hackathon = serializer.instance.hackathon
        if hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only edit problem statements for your own hackathons."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only delete problem statements for your own hackathons."
            )
        instance.delete()
