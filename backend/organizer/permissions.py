from rest_framework import permissions

class IsScannerAuthorized(permissions.BasePermission):
    """
    Lightweight permission class that allows access to users with scanner-capable roles
    (organizers, coordinators, or super admins). Scoped check is done in the view.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Allow super_admin or staff
        if request.user.is_staff or request.user.role == 'super_admin':
            return True
            
        # Allow any organizer or user coordinated with at least one hackathon
        return (
            request.user.role == 'organizer'
            or request.user.coordinated_hackathons.filter(is_active=True).exists()
        )
