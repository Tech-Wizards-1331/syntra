# Phase 3: Coordinator Login and Signup - Validation

## Validation Architecture

Nyquist validation enforces that verification logic is written before or alongside the implementation, ensuring the code is fully testable and meets requirements.

### Dimension 1: Feature Completeness
- [ ] `assign_coordinator` handles unknown emails by creating a shell user and sending an invite email.
- [ ] The invite email contains a valid URL with `uidb64` and `token`.
- [ ] `accept_invite_view` renders a form for setting full name and password.
- [ ] Submitting the invite form activates the user, sets their password, and logs them in.

### Dimension 2: Access & Security
- [ ] Users created via invite cannot log in with an empty/unusable password.
- [ ] Tokens generated for invites expire and cannot be reused after the password is set.
- [ ] Invalid or tampered tokens return an error.

### Dimension 8: Nyquist Tests
1. **test_assign_new_user_creates_invite**
   - **Target:** `backend/organizer/tests.py`
   - **Action:** Mock `send_mail` or check `mail.outbox`. Call `assign_coordinator` with a new email. Verify a `User` is created with `is_active=True` (or False, depending on implementation), `has_usable_password()` is False, and an email is sent containing a token.
2. **test_accept_invite_sets_password**
   - **Target:** `backend/accounts/tests.py`
   - **Action:** Create a shell user, generate a token, and POST to the accept invite endpoint. Verify the user's password is changed and they are authenticated.
3. **test_invalid_token_rejected**
   - **Target:** `backend/accounts/tests.py`
   - **Action:** POST to the accept invite endpoint with an invalid token and verify it fails.
