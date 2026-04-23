# Phase 4: IMPLEMENT INVITE EMAIL DELIVERY - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up and finalize the email delivery for Coordinator invitations when an Organizer assigns a new email address.

</domain>

<decisions>
## Implementation Decisions

- **Email Integration:** The existing logic (which uses `PasswordResetTokenGenerator` and the `assign_coordinator` endpoint) must be fully wired to send a real email invitation containing the secure invite link.
- **Production Readiness:** Ensure the email logic handles errors gracefully, uses templates (if necessary), and is robust for production.

</decisions>

<canonical_refs>
## Canonical References

### Organizer API
- `backend/organizer/api_views.py` — Contains `assign_coordinator` where the email dispatch occurs.

### Accounts
- `backend/accounts/urls.py` & `backend/accounts/views.py` — Invite acceptance URLs.

</canonical_refs>

<code_context>
## Existing Code Insights

- The invite flow already exists using `PasswordResetTokenGenerator`.
- The Accept URL format is `/accounts/invite/accept/<uidb64>/<token>/`.
- Currently, the email logic might be basic (`fail_silently=True`) and may just log errors or use a hardcoded subject/body without HTML templates.

</code_context>

<specifics>
## Specific Ideas

- N/A

</specifics>

<deferred>
## Deferred Ideas

- N/A

</deferred>
