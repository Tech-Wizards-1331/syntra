# Phase 4: IMPLEMENT INVITE EMAIL DELIVERY - Research

## Context Review

- **Objective:** Fully wire the email delivery for Coordinator invitations, making it production-ready.
- **Current State:** `assign_coordinator` generates a token and URL, then calls `send_mail` synchronously. This blocks the API response and sends a plain-text email.

## Technical Architecture & Investigation

### 1. Asynchronous Email Dispatch (Celery)
- **Problem:** Sending emails synchronously during an API request is an anti-pattern that can lead to slow response times or timeouts if the SMTP server is slow.
- **Solution:** Move the `send_mail` logic to a Celery task.
- **Implementation:** Create `send_coordinator_invite_email(email, hackathon_name, invite_url)` in `backend/organizer/tasks.py` and call it via `.delay()` in the view.

### 2. Email Formatting (HTML Templates)
- **Problem:** Plain-text emails are not professional for invitations.
- **Solution:** Use Django's `EmailMultiAlternatives` to send a multipart email with both plain text and an HTML template.
- **Implementation:** 
  - Create a template at `frontend/templates/emails/coordinator_invite.html` (since Syntra keeps templates in `frontend/templates`).
  - Use `render_to_string` in the Celery task to generate the HTML content.

### 3. Email Configuration
- **Problem:** `settings.py` does not currently define email configuration variables.
- **Solution:** Add `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` to `settings.py`, falling back to `console.EmailBackend` if `EMAIL_HOST` is not provided in the `.env` file (for development convenience).

## Validation Architecture (Nyquist)

### Dimension 1: Feature Completeness
- Verify the Celery task handles the email generation correctly.
- Verify the API view calls the Celery task.

### Dimension 8: Nyquist Tests
- `test_celery_task_sends_email`
- `test_assign_coordinator_queues_email_task`
