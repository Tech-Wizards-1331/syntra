# Verification: Phase 2 (Authentication & Custom Password Hashing)

## Verification Steps

1. **Production Build & Compilation Check**:
   - Run `npm run build`
   - Confirm that the Next.js production build completes with zero errors, verifying that:
     - All routes compile successfully.
     - Custom authentication actions, middleware, API route, and views are free of syntax or TypeScript compilation errors.

2. **Django password hashing & verification**:
   - Verify that [django-password.ts](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/lib/auth/django-password.ts) accurately:
     - Verifies existing Django `pbkdf2_sha256` and `md5` hashes.
     - Hashes newly registered passwords using `pbkdf2_sha256` format with 600,000 iterations.
     - Utilizes `crypto.timingSafeEqual` with buffer length validation.

3. **Authentication Flows & Forms**:
   - Run the development server: `npm run dev`.
   - Access the homepage at `http://localhost:3000`.
   - Navigate to `/register` and create a participant account:
     - Verify Zod input validation (e.g. invalid emails, mismatching passwords).
     - Verify that upon submitting, the user record is inserted in the database and the user is logged in automatically and redirected to `/participant/dashboard`.
   - Sign out and navigate to `/login`:
     - Test credentials login with the newly created account.
     - Test invalid logins to verify error message reporting.

4. **Middleware Route Protection**:
   - Verify unauthenticated route behavior:
     - Attempt to access `/participant/dashboard`, `/organizer/dashboard`, or `/admin/dashboard` while logged out.
     - Confirm redirect to `/login` with a valid `callbackUrl` query parameter.
   - Verify role-based route behavior:
     - Sign in as a `participant`.
     - Attempt to navigate to `/organizer/dashboard` or `/admin/dashboard`.
     - Confirm automatic redirection back to `/participant/dashboard`.
