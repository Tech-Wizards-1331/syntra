# Phase 05: IMPLEMENT DYNAMIC COORDINATOR RESPONSIBILITY SYSTEM - Technical Research

## Objective
Research how to implement Phase 5: implement-dynamic-coordinator-responsibility-system, shifting from static coordinator roles to a dynamic, JSON-based responsibility model. This requires redefining the `HackathonCoordinator` model, building a generic DRF permission layer, and modifying existing organizer API endpoints to securely accommodate coordinators.

## Codebase Findings

### 1. `HackathonCoordinator` Model (`organizer/models.py`)
Currently, the model has:
```python
class HackathonCoordinator(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coordinated_hackathons')
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='coordinators')
    responsibilities = models.JSONField(
        default=list,
        blank=True,
        help_text='Assigned responsibilities: problem_statements, teams, analytics'
    )
    # ...
```
**Action:**
We need to define a strict `models.TextChoices` class inside `HackathonCoordinator`:
```python
class Responsibility(models.TextChoices):
    PROBLEM_STATEMENTS = 'PROBLEM_STATEMENTS', 'Problem Statements'
    ANALYTICS = 'ANALYTICS', 'Analytics'
    TEAM_MANAGEMENT = 'TEAM_MANAGEMENT', 'Team Management'
```
We also need a custom property or validation to ensure elements in `responsibilities` match these choices. `JSONField` itself doesn't validate array elements via choices directly at the ORM level. Validation must be done in the serializer, or via a model `clean()` method.

### 2. DRF Permission Enforcement
Currently, views like `HackathonViewSet` and `ProblemStatementViewSet` use `permission_classes = [IsOrganizer]`, which strictly checks `user.role == User.Role.ORGANIZER`.

**Action:**
We will create a new permissions utility or classes, for example `permissions.py` inside the `organizer` app (or `accounts/permissions.py`).
We can define a base factory or parameterized class, but DRF permissions aren't easily parameterized in the `permission_classes` list natively unless using closures or a custom permission resolver. 
A common pattern:
```python
class HasResponsibility:
    def __init__(self, responsibility):
        self.responsibility = responsibility
        
    def __call__(self):
        # returns a permission class dynamically
        class DynamicPermission(permissions.BasePermission):
            def has_permission(self, request, view):
                # check Organizer or Coordinator
                ...
        return DynamicPermission
```
Wait, DRF has a simpler way: just define a class like `IsOrganizerOrCoordinatorWithProblemStatements`. But a factory is more elegant.
Alternatively, check inside the view methods using a utility function:
```python
def has_responsibility(user, hackathon, responsibility):
    if user.role == User.Role.ORGANIZER:
        return True
    return HackathonCoordinator.objects.filter(
        user=user, 
        hackathon=hackathon, 
        responsibilities__contains=[responsibility]
    ).exists()
```
Since we agreed on "DRF Permission Class", we can write:
```python
class IsOrganizerOrHasResponsibility(permissions.BasePermission):
    responsibility_required = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == get_user_model().Role.ORGANIZER:
            return True
        if request.user.role == get_user_model().Role.COORDINATOR:
            return True # Let object permissions or get_queryset handle the rest, OR read hackathon_pk from view.kwargs
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == get_user_model().Role.ORGANIZER:
            return True
        if hasattr(obj, 'hackathon'):
            hackathon = obj.hackathon
        elif isinstance(obj, Hackathon):
            hackathon = obj
        else:
            return False
            
        return has_responsibility(request.user, hackathon, self.responsibility_required)
```
Then for `ProblemStatementViewSet`, we define:
```python
class CanManageProblemStatements(IsOrganizerOrHasResponsibility):
    responsibility_required = HackathonCoordinator.Responsibility.PROBLEM_STATEMENTS
```

### 3. API Surface Area Modifications
Because we are sharing the `/api/organizer/` endpoints, we must modify the `get_queryset()` methods to ensure a coordinator only sees data for hackathons they are assigned to.

**In `HackathonViewSet`:**
```python
from django.db.models import Q
def get_queryset(self):
    user = self.request.user
    if user.role == User.Role.ORGANIZER:
        return Hackathon.objects.filter(organizer__user=user)
    elif user.role == User.Role.COORDINATOR:
        return Hackathon.objects.filter(coordinators__user=user)
    return Hackathon.objects.none()
```
*(Wait, `assign_coordinator` should ONLY be allowed by Organizers. We can use `@action(permission_classes=[IsOrganizer])` for `assign_coordinator`, `unassign_coordinator`, etc.)*

**In `ProblemStatementViewSet`:**
```python
def get_queryset(self):
    user = self.request.user
    hackathon_pk = self.kwargs['hackathon_pk']
    if user.role == User.Role.ORGANIZER:
        return ProblemStatement.objects.filter(hackathon_id=hackathon_pk, hackathon__organizer__user=user)
    elif user.role == User.Role.COORDINATOR:
        return ProblemStatement.objects.filter(hackathon_id=hackathon_pk, hackathon__coordinators__user=user)
    return ProblemStatement.objects.none()

def _get_hackathon(self):
    user = self.request.user
    hackathon_pk = self.kwargs['hackathon_pk']
    if user.role == User.Role.ORGANIZER:
        return get_object_or_404(Hackathon, pk=hackathon_pk, organizer__user=user)
    elif user.role == User.Role.COORDINATOR:
        return get_object_or_404(Hackathon, pk=hackathon_pk, coordinators__user=user)
```

### 4. Dashboard Data Contract
We need a new endpoint for the Coordinator Dashboard, or modify an existing one. Since organizers list their hackathons at `/api/organizer/hackathons/`, a coordinator calling `GET /api/organizer/hackathons/` will now get their assigned hackathons (due to `get_queryset` changes).

However, the user wants "rich list with summaries".
We can add a new serializer `CoordinatorDashboardSerializer` or modify `HackathonSerializer` dynamically. Actually, creating a specific endpoint is cleaner for the frontend.
Let's add a new endpoint, maybe `GET /api/organizer/hackathons/coordinator_dashboard/` (using `@action(detail=False, methods=['get'])` on `HackathonViewSet`), which returns:
```json
{
  "hackathons": [
    {
      "hackathon": {"id": 1, "name": "Hack 2026", "status": "draft"},
      "responsibilities": ["PROBLEM_STATEMENTS", "ANALYTICS"],
      "stats": {
        "problem_statements_count": 3,
        "teams_count": 12
      }
    }
  ]
}
```
Wait, the context says: "Share the existing `/api/organizer/` endpoint namespace for both organizers and coordinators".
If a coordinator calls `GET /api/organizer/hackathons/`, we can just return this rich data. But DRF's `ListModelMixin` uses `HackathonSerializer`.
Let's create a dedicated dashboard endpoint in `HackathonViewSet`:
```python
@action(detail=False, methods=['get'], permission_classes=[IsCoordinator])
def dashboard(self, request):
    assignments = HackathonCoordinator.objects.filter(user=request.user).select_related('hackathon')
    data = []
    for assignment in assignments:
        h = assignment.hackathon
        data.append({
            "hackathon": HackathonSerializer(h).data,
            "responsibilities": assignment.responsibilities,
            "stats": {
                "problem_statements_count": h.problem_statements.count(),
                # teams_count: ... (placeholder for now)
            }
        })
    return Response(data)
```
*Wait, organizers should NOT be able to access the coordinator dashboard. Or perhaps they have their own. Let's make it a dedicated endpoint `GET /api/organizer/hackathons/coordinator_dashboard/` restricted to coordinators.*

### 5. `assign_coordinator` Validation
The `assign_coordinator` API must validate that provided `responsibilities` are valid enum values. We can do this manually in the view or via the `HackathonCoordinatorSerializer`.
In `api_views.py`:
```python
valid_resps = [c[0] for c in HackathonCoordinator.Responsibility.choices]
for r in responsibilities:
    if r not in valid_resps:
        return Response({'error': f'Invalid responsibility: {r}'}, status=400)
```

## Validation Architecture
- **Model Check**: Create a coordinator with invalid responsibilities array in testing to ensure it is handled or rejected (at least via API).
- **API Access**: As a coordinator with `PROBLEM_STATEMENTS` responsibility, verify `POST /problem-statements/` works.
- **Permission Boundary**: As a coordinator *without* `PROBLEM_STATEMENTS`, verify `POST /problem-statements/` returns `403 Forbidden`.
- **Isolation**: As a coordinator for Hackathon A, verify accessing Hackathon B's problem statements returns `404` or `403`.
- **Organizer Bypass**: As an organizer, verify full access to problem statements despite having no explicitly listed responsibilities.
- **Dashboard Response**: Verify the `/coordinator_dashboard/` endpoint returns the correct JSON contract including stats.

## RESEARCH COMPLETE
