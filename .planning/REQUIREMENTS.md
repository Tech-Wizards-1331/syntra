# Requirements: Syntra

**Defined:** 2026-04-28
**Core Value:** Streamlined hackathon management with robust role scoping and integrated physical-world utility (QR attendance).

## v1 Requirements

### Authentication & Roles

- [ ] **AUTH-01**: User can sign up with email/password and select a role (Organizer or Participant).
- [ ] **AUTH-02**: Roles are strictly separate; a user cannot change roles or hold multiple roles.
- [ ] **AUTH-03**: Super Admin has full system access via Django admin or custom dashboard.
- [ ] **AUTH-04**: User can authenticate using Google or GitHub accounts.

### Profile Management

- [ ] **PROF-01**: Organizer can manage their profile (Company Name, Website, Logo, etc.).
- [ ] **PROF-02**: Participant can manage their profile (Email, Skills, College Name, Semester, Degree, Bio, Resume link).
- [ ] **PROF-03**: Participants can toggle "Visibility" to be searchable by Team Leaders.

### Hackathon Management

- [ ] **HACK-01**: Organizer can create a Hackathon event with basic details (Name, Date, Description).
- [ ] **HACK-02**: Organizer can define phases for a hackathon (e.g., Registration, Team Building, Active).
- [ ] **HACK-03**: Only one phase can be "Active" at a time per hackathon.

### Team Management

- [ ] **TEAM-01**: Participant (as Team Leader) can create a team for a hackathon.
- [ ] **TEAM-02**: Team Leader can add teammates as "Guest Records" with full info (Name, Email, Skills, College, Semester, Degree - no account created).
- [ ] **TEAM-03**: Solo participants can search for teams looking for their skills.
- [ ] **TEAM-04**: Team Leaders can search for solo participants based on skills.

### QR Utility & Attendance

- [ ] **QR-01**: System generates a unique QR code for each team upon successful registration.
- [ ] **QR-02**: Organizer can scan a team QR code to mark attendance for the whole team.
- [ ] **QR-03**: System tracks "Food Tokens" per team, allowing Organizers to mark tokens as used.

## v2 Requirements

### Submissions & Judging

- **SUB-01**: Teams can submit project links (Github, Devpost, etc.).
- **SUB-02**: Teams can upload project files/assets.
- **JUDG-01**: System supports a separate "Judge" role.
- **JUDG-02**: Judges can score projects based on defined criteria.

### Extended Roles

- **ROLE-01**: Coordinator role for scoped hackathon management.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time Chat | Use external tools (Discord/Slack) for v1 to reduce complexity. |
| Automatic Team Matching | Manual search is sufficient for MVP. |
| Payments/Sponsorships | Focus on management and attendance first. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| PROF-01 | Phase 1 | Pending |
| PROF-02 | Phase 1 | Pending |
| HACK-01 | Phase 2 | Pending |
| HACK-02 | Phase 2 | Pending |
| TEAM-01 | Phase 3 | Pending |
| TEAM-02 | Phase 3 | Pending |
| TEAM-03 | Phase 3 | Pending |
| QR-01 | Phase 4 | Pending |
| QR-02 | Phase 4 | Pending |
| QR-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 12 (Core features)
- Unmapped: 2 (AUTH-03, PROF-03 - to be mapped in later phases or minor tasks)

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 after initial definition*
