---
wave: 1
depends_on: []
files_modified:
  - backend/requirements.txt
  - backend/participant/models.py
  - backend/organizer/models.py
  - backend/organizer/permissions.py
  - backend/organizer/api_serializers.py
  - backend/organizer/api_views.py
  - backend/organizer/api_urls.py
  - backend/organizer/tests_scanner.py
autonomous: true
---

# Phase 11: Build a production-ready real-time QR scanner system for Syntra hackathons using a “One QR per Team” architecture - Plan

## Verification Criteria
- [ ] `qrcode` package added to `requirements.txt`.
- [ ] `Team` model has `qr_token` and `is_qr_active` fields.
- [ ] QR code generation utility function `generate_team_qr_code(team)` implemented in `participant/services.py` (not in model's save method).
- [ ] `HackathonCoordinator`, `ScanCategory`, and `ScanRecord` models added to organizer app with correct indexes (composite index for coordinators, scan category, and scan record).
- [ ] Database migrations created and applied.
- [ ] Lightweight custom `IsScannerAuthorized` permission class implemented.
- [ ] Views check scoped authorization context (validating organizer/coordinator scope per hackathon).
- [ ] `/api/organizer/scanner/scan/` and `/api/organizer/scanner/submit/` APIs functioning.
- [ ] Views optimize queries with `select_related` and `prefetch_related`.
- [ ] Submit API validates `member_ids` belong to team and `is_qr_active` is True.
- [ ] Submit API wraps writes in `transaction.atomic()` and catches `IntegrityError` to handle duplicate scans.
- [ ] `device_id` is tracked optionally in `ScanRecord` for audit.
- [ ] Tests created in `tests_scanner.py` pass cleanly.

## Must Haves
- Live, real-time database updates and API responses.
- One QR code containing only the unique token per team.
- Scoped coordinator authorization checks handled in views/services.
- DB level unique constraints to prevent double scanning.
- Transaction safety and duplicate scan `IntegrityError` handling.
- Lightweight permissions classes.

## Tasks

```xml
<task>
  <id>update-requirements</id>
  <description>Add qrcode dependency to requirements.txt</description>
  <read_first>
    - backend/requirements.txt
  </read_first>
  <action>
    Modify backend/requirements.txt to add qrcode package.
  </action>
  <acceptance_criteria>
    - `grep "qrcode" backend/requirements.txt` exits 0.
  </acceptance_criteria>
</task>

<task>
  <id>update-models</id>
  <description>Add qr_token and is_qr_active to Team model and create coordinator, scan category, and scan record models with indexing</description>
  <read_first>
    - backend/participant/models.py
    - backend/organizer/models.py
  </read_first>
  <action>
    Modify backend/participant/models.py:
    - Add `qr_token` UUID field and `is_qr_active` BooleanField to Team.

    Modify backend/organizer/models.py:
    - Add `HackathonCoordinator` model with fields `hackathon`, `user`, `is_active`, `created_at` and a composite index.
    - Add `ScanCategory` model with fields `hackathon`, `name`, `is_active`, `display_order`, `created_at` and index.
    - Add `ScanRecord` model with fields `team_member`, `scan_category`, `scanned_by`, `device_id`, `created_at` and indexes.
  </action>
  <acceptance_criteria>
    - `HackathonCoordinator` model is defined with indexes.
    - `ScanCategory` model is defined with indexes.
    - `ScanRecord` model is defined with indexes.
    - `Team` model contains new fields.
  </acceptance_criteria>
</task>

<task>
  <id>makemigrations-migrate</id>
  <description>Generate and apply migrations</description>
  <read_first>
    - backend/manage.py
  </read_first>
  <action>
    Run `python manage.py makemigrations` and `python manage.py migrate` in the `backend` directory to apply the model changes.
  </action>
  <acceptance_criteria>
    - Migrations apply successfully.
  </acceptance_criteria>
</task>

<task>
  <id>implement-permissions</id>
  <description>Create lightweight custom permission IsScannerAuthorized for hackathon scanner API access</description>
  <read_first>
    - backend/organizer/models.py
  </read_first>
  <action>
    Create backend/organizer/permissions.py:
    - Implement a lightweight `IsScannerAuthorized` class checking authenticated user roles (organizer/coordinator/staff/super_admin). Scoped contextual validation is deferred to the views.
  </action>
  <acceptance_criteria>
    - Permissions class is lightweight and checks role.
  </acceptance_criteria>
</task>

<task>
  <id>implement-services-views-serializers</id>
  <description>Create QR generator utility, scanner serializers, views, and register URL paths</description>
  <read_first>
    - backend/organizer/api_views.py
    - backend/organizer/api_serializers.py
    - backend/organizer/api_urls.py
  </read_first>
  <action>
    Create `participant/services.py`:
    - Implement `generate_team_qr_code(team)` function.
    
    Add serializers to backend/organizer/api_serializers.py.
    Add ScannerScanView and ScannerSubmitView to backend/organizer/api_views.py.
    - Views must perform scoped hackathon authorization, check `is_qr_active`, validate `member_ids` belong to team, track `device_id`, optimize queries using select_related/prefetch_related, use atomic transactions, and handle IntegrityErrors.
    Register routes in backend/organizer/api_urls.py.
  </action>
  <acceptance_criteria>
    - Views process scan/submit correctly with all validations.
  </acceptance_criteria>
</task>

<task>
  <id>create-tests</id>
  <description>Write scanner tests and run test suite</description>
  <read_first>
    - backend/organizer/api_views.py
  </read_first>
  <action>
    Create backend/organizer/tests_scanner.py with full test cases verifying all rules.
    Run tests using `python manage.py test organizer.tests_scanner`.
  </action>
  <acceptance_criteria>
    - Tests pass.
  </acceptance_criteria>
</task>
```
