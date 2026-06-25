# Phase 11 Research: Real-Time QR Scanner System

## 1. Context & Architecture Overview
This phase builds a production-ready, real-time QR scanner system for Syntra hackathons. The QR scanner is used by hackathon organizers and authorized volunteers/coordinators to scan team QR codes and instantly mark selected members as scanned for specific categories.

The scanner system operates fully online with live API validation and direct database updates (no offline caching or bulk synchronization).

### Component Breakdown
1. **Models**:
   - `Team` (modified in `participant/models.py`): Add `qr_token` UUID field and `is_qr_active` Boolean field.
   - `HackathonCoordinator` (new in `organizer/models.py`): Scoped role associating a user with a hackathon for volunteer/coordinator permissions. Includes database indexes.
   - `ScanCategory` (new in `organizer/models.py`): Dynamic database representation of scan events (e.g., Attendance, Meals, Swag).
   - `ScanRecord` (new in `organizer/models.py`): Log of individual team member scans for a specific category. Includes optional `device_id` tracking and performance indexes.

2. **Permissions**:
   - `IsScannerAuthorized` (custom permission class): A lightweight check ensuring the request user has a scanner-authorized role (organizer, active coordinator, or super_admin).

3. **APIs**:
   - `POST /api/organizer/scanner/scan/`: Validates scanner credentials and a scanned QR token, checks `is_qr_active` status, and returns optimized team/member scan status using `select_related`/`prefetch_related`.
   - `POST /api/organizer/scanner/submit/`: Marks selected members as scanned by creating `ScanRecord` instances in a database transaction block (`transaction.atomic()`). Includes explicit verification that member IDs belong to the scanned team, tracks optional `device_id`, and safely handles duplicate scan database `IntegrityError`s.

---

## 2. Technical Details & Database Models

### Team Model Modifications
Add `qr_token` and `is_qr_active` to `Team`:
```python
import uuid
qr_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
is_qr_active = models.BooleanField(default=True)
```

QR code generation will be handled by a dedicated utility function in `participant/services.py` rather than within `save()`:
```python
import qrcode
from io import BytesIO
from django.core.files import File

def generate_team_qr_code(team):
    """
    Generates and saves a QR code for the team if one does not exist.
    Contains only the string representation of qr_token.
    """
    if not team.qr_code:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(str(team.qr_token))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        filename = f"team_{team.id}_qr.png"
        team.qr_code.save(filename, File(buffer), save=False)
        team.save(update_fields=['qr_code'])
```

### HackathonCoordinator Model
To support per-hackathon scoped permissions for volunteers/coordinators:
```python
class HackathonCoordinator(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='coordinators')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coordinated_hackathons')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hackathon', 'user')
        indexes = [
            models.Index(fields=['hackathon', 'user', 'is_active']),
        ]
```

### ScanCategory Model
```python
class ScanCategory(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='scan_categories')
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'created_at']
        unique_together = ('hackathon', 'name')
        indexes = [
            models.Index(fields=['hackathon', 'is_active']),
        ]
```

### ScanRecord Model
```python
class ScanRecord(models.Model):
    team_member = models.ForeignKey('participant.TeamMember', on_delete=models.CASCADE, related_name='scan_records')
    scan_category = models.ForeignKey(ScanCategory, on_delete=models.CASCADE, related_name='scan_records')
    scanned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scanned_records')
    device_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team_member', 'scan_category')
        indexes = [
            models.Index(fields=['scan_category', 'team_member']),
        ]
```

---

## 3. Permissions Design (`IsScannerAuthorized`)
The permission class will reside in `organizer/permissions.py`. It is lightweight and focuses solely on roles. Deep context validation (checking if the coordinator or organizer belongs to the scanned hackathon) is deferred to the views/services:
```python
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
```

---

## 4. API Endpoints Logic

### 1. `/api/organizer/scanner/scan/` [POST]
Accepts `qr_token` and `scan_category_id`.
- Fetches the `Team` using `qr_token` with `select_related('hackathon', 'hackathon__organizer')` and validates `team.is_qr_active == True`.
- Fetches the `ScanCategory` using `scan_category_id` with `select_related('hackathon')`.
- Validates that the team's hackathon matches the scan category's hackathon.
- Verifies scoped authorization:
  - If request user is an organizer, they must own the hackathon (`hackathon.organizer.user == request.user`).
  - If request user is a coordinator, they must have an active `HackathonCoordinator` record for that specific hackathon.
  - If unauthorized, raises `PermissionDenied("You are not authorized to scan for this hackathon.")`.
- Fetches all team members for this team using `prefetch_related` on members' `scan_records`.
- Checks if a `ScanRecord` exists for each member in the selected `scan_category_id`.
- Returns lightweight JSON payload.

### 2. `/api/organizer/scanner/submit/` [POST]
Accepts `scan_category_id`, `qr_token`, `member_ids` (list), and optional `device_id`.
- Fetches `Team` and `ScanCategory` and performs the same scoped authorization and `is_qr_active` validations as `/scan/`.
- Verifies that all `member_ids` belong to the team associated with the `qr_token` by filtering the team's members. If any member doesn't belong to the team, raises a `ValidationError("One or more members do not belong to the scanned team.")`.
- Performs writes inside a synchronous database transaction block:
  ```python
  from django.db import transaction, IntegrityError
  
  try:
      with transaction.atomic():
          for member_id in member_ids:
              ScanRecord.objects.create(
                  team_member_id=member_id,
                  scan_category=scan_category,
                  scanned_by=request.user,
                  device_id=device_id
              )
  except IntegrityError:
      raise ValidationError("One or more team members have already been scanned for this category.")
  ```

---

## 5. Verification Strategy & Test Cases
Since tests run under SQLite locally, we can run them instantly.
Test suite will verify:
1. **Duplicate Prevention**: Assert database integrity checks prevent multiple `ScanRecord` rows for the same `(team_member, scan_category)` and verify `IntegrityError` is properly handled to return 400.
2. **Access Control**: Verify participant or unauthenticated users get 403 Forbidden on scan/submit endpoints.
3. **Invalid Token**: Verify HTTP 404/400 returned on unknown QR token.
4. **Member Validation**: Verify a volunteer cannot submit scans for members outside the team associated with the scanned QR token.
5. **Real-time updates**: Verify `ScanRecord` is written immediately and subsequent scan check lists the member as `already_scanned=True`.
6. **QR Inactive Validation**: Verify that scanning or submitting for a team with `is_qr_active=False` raises a validation error.
7. **Device ID Logging**: Verify that the optional `device_id` is successfully logged in the `ScanRecord`.
8. **Query Optimizations**: Verify that list fetches perform the minimum queries using `select_related`/`prefetch_related`.

