# Phase 4: IMPLEMENT INVITE EMAIL DELIVERY - Validation

## Nyquist Strategy

### Feature Completeness
- [ ] Email configuration variables are parsed from `.env` in `settings.py`.
- [ ] Email dispatch is moved from synchronous `send_mail` in `api_views.py` to an asynchronous Celery task.
- [ ] Celery task renders an HTML template for the email content.

### Performance & Security
- [ ] The API responds instantly without waiting for SMTP server negotiation.
- [ ] Task handles SMTP failures gracefully without crashing the worker or losing state.

### Testing Strategy
- [ ] Write unit test `test_celery_task_sends_email` to verify the Celery task formats and sends the email (using `mail.outbox` and `patch`).
- [ ] Write unit test `test_assign_coordinator_queues_email_task` to verify the `assign_coordinator` endpoint queues the task instead of sending directly.
