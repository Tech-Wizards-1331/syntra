# Phase 4: Profile Management - Context

**Gathered:** 2026-06-03  
**Status:** Ready for research and planning  

<domain>
## Phase Boundary

Rebuild the profile creation and editing forms for organizers (`/organizer/profile`) and participants (`/participant/profile`). Enforce mandatory profile completion upon login by modifying Next.js middleware to redirect users with `is_profile_complete = false` to their respective profile forms. Implement support for uploading organization logos to Cloudinary and managing participant skills via an interactive, tag-based selection interface.
</domain>

<decisions>
## Implementation Decisions

### Logo & Media Uploads
- **D-01 (Cloudinary Integration)**: Organizer logo uploads will be processed on the server and sent to Cloudinary using the preconfigured `CLOUDINARY_URL` credentials in `.env`. The resulting secure URL will be written to `organizer_organizerprofile.logo`.

### Participant Skills UI
- **D-02 (Interactive Skill Selector)**: Participant profiles will display an interactive grid of toggleable skill badges. Clicking a badge will toggle its selection (mapping to `participant_participantprofile_skills`). An input text field will allow users to add custom skill tags, which will be dynamically created in the `participant_skill` table if they do not already exist.

### Profile Completion Enforcement
- **D-03 (Middleware Redirects)**: Enforce a strict redirect policy. Next.js middleware will check the logged-in user's `is_profile_complete` field. If `false`, they will be redirected to their respective profile page (`/organizer/profile` or `/participant/profile`) and blocked from accessing dashboards or other protected pages until the profile is completed.

### Database Updates
- **D-04 (Atomic Profile Save)**: Profile submissions will use Server Actions. Saving the profile will update the profile table, sync the skill relations, and mark the user's `is_profile_complete = true` in the `accounts_user` table atomically.
</decisions>

<specifics>
## Specific Guidelines

- **UI Aesthetics**: The profile pages must use a high-end glassmorphic dark theme: translucent panels (`bg-slate-900/50 border border-slate-800/80`), subtle teal gradients (`from-teal-500 to-emerald-400`), and clean inputs, consistent with the participant dashboard design.
- **Prisma Schema Mapping**: Direct mappings to `organizer_organizerprofile`, `participant_participantprofile`, `participant_skill`, and `accounts_user` must be preserved exactly without schema alterations.
</code_context>

<canonical_refs>
## Canonical References

- **Prisma Schema**: [schema.prisma](file:///prisma/schema.prisma) - Mapped models for users, profiles, and skills.
- **Middleware**: [middleware.ts](file:///middleware.ts) - Current route protection and redirect logic.
</canonical_refs>

<deferred>
## Deferred Ideas

- CRUD options for hackathons, categories, and problem statement uploads are deferred to **Phase 5**.
- Participant team registrations, scanner cams, and check-in scanner logs are deferred to **Phase 6**.
</deferred>

---
*Phase: 04-profile-management*  
*Context gathered: 2026-06-03*  
