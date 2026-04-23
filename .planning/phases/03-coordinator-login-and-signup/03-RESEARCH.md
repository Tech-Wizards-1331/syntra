# Phase 3: Coordinator Login and Signup - Research

## Context Review

- **Objective:** Implement the authentication and onboarding flow for the `coordinator` role.
- **Constraints:** Invite-only approach. When organizers assign an email that doesn't exist, an expiring invite link is sent.
- **Current Flow:** Currently, `assign_coordinator` in `organizer/api_views.py` returns `404 Not Found` if the email isn't an existing user.

## Technical Architecture & Investigation

### 1. Account Creation via Invitation
When `assign_coordinator` is called with an unknown email:
- Instead of returning 404, we should create a new `User` instance.
- Set `user.email = email`, `user.role = User.Role.COORDINATOR`.
- Use `user.set_unusable_password()` to ensure the account cannot be logged into via standard credentials yet.
- Generate an expiring token for the invite link.
- Send an email to the user with the link.
- Create the `HackathonCoordinator` assignment just like we do for existing users.

### 2. Token Generation
- Django's built-in `PasswordResetTokenGenerator` is ideal for generating secure, expiring tokens tied to a user.
- Alternatively, we can use `django.core.signing.TimestampSigner` to sign the user's ID or email. `PasswordResetTokenGenerator` is usually better because it automatically invalidates if the user's password changes (which happens when they accept the invite and set a password).

### 3. Acceptance Endpoint
- We need an endpoint (e.g., in `coordinator/api_views.py` or `accounts/views.py`) to handle the invite link click.
- The link will likely point to a frontend page (e.g., `/accounts/invite/accept/?uidb64=...&token=...`).
- The frontend page will present a form for the user to enter their `full_name` and `password`.
- On submission, it will POST to an API endpoint (e.g., `/api/accounts/invite/accept/`) with the uidb64, token, full_name, and password.
- The backend will verify the token, set the new password, set `full_name`, and log the user in (or return a JWT).

### 4. Adjustments to Existing Code
- `organizer/api_views.py`: Modify `assign_coordinator` to catch `User.DoesNotExist` and trigger the shell user creation + invite email logic.
- `accounts/urls.py` / `accounts/views.py`: We need to add the frontend template for accepting the invite (since Syntra currently uses Django templates for auth pages, as seen in `login_view`, `signup_view`, etc.).
- Wait, the frontend is template-based for Auth! We saw `render(request, 'accounts/signup.html', ...)` in `accounts/views.py`. So we should create an `accept_invite_view` in `accounts/views.py` that renders an `accounts/accept_invite.html` template.

### 5. Email Dispatch
- We need a function to send the invite email. Django's `send_mail` can be used. We should log it to the console if email settings aren't fully configured for production yet.

## Validation Architecture (Nyquist)

### Dimension 1: Feature Completeness
- Verify `assign_coordinator` creates a shell user and assignment when given a new email.
- Verify existing users just get the assignment without password resets.
- Verify the invite acceptance form sets the password and full name correctly.

### Dimension 2: Access & Security
- Verify the token expires and cannot be reused after the password is set.
- Verify users with unusable passwords cannot log in until they set their password.

### Dimension 8: Nyquist Tests
- `test_assign_new_user_creates_invite`
- `test_accept_invite_sets_password`
- `test_invalid_token_rejected`
