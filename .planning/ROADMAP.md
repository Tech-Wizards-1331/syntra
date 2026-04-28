# Roadmap: Syntra

## Overview

Syntra will be built in four coarse phases, moving from the foundational identity and role system to the core event management features, followed by team building capabilities, and finally the physical-world QR utility for attendance and food tokens.

## Phases

- [ ] **Phase 1: Foundation & Identity** - Shared User model and separate Profile tables for Roles.
- [ ] **Phase 2: Hackathon Core** - Event creation and phase management for Organizers.
- [ ] **Phase 3: Teams & Recruitment** - Team creation with guest records and skill-based search.
- [ ] **Phase 4: QR Attendance & Utility** - Team-based QR generation and token management.

## Phase Details

### Phase 1: Foundation & Identity
**Goal**: Establish the base authentication system with strictly separate roles and profiles.
**Depends on**: Nothing
**Requirements**: AUTH-01, AUTH-02, PROF-01, PROF-02
**Success Criteria**:
  1. Users can sign up as either an Organizer or a Participant.
  2. Organizers and Participants have distinct data fields in their profiles.
  3. A user cannot hold both roles simultaneously.
**Plans**: 2 plans (Foundation, Profiles)

Plans:
- [ ] 01-01: Update Custom User model with Role field and Strictly Separate Identity logic.
- [ ] 01-02: Create Organizer and Participant profile models (email, college, skills, etc.).
- [ ] 01-03: Configure Social Auth (Google/GitHub) using django-allauth.

### Phase 2: Hackathon Core
**Goal**: Allow Organizers to create events and manage their lifecycle phases.
**Depends on**: Phase 1
**Requirements**: HACK-01, HACK-02, HACK-03
**Success Criteria**:
  1. Organizers can create a new hackathon.
  2. Organizers can define and transition between hackathon phases.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Hackathon and Phase models and management API.

### Phase 3: Teams & Recruitment
**Goal**: Enable team building with guest records and participant discovery.
**Depends on**: Phase 2
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, PROF-03
**Success Criteria**:
  1. Team Leaders can create teams and list teammates without requiring full accounts for them.
  2. Participants can toggle visibility and search for teams by skills.
**Plans**: 2 plans (Teams, Recruitment)

Plans:
- [ ] 03-01: Team model and Guest Record management.
- [ ] 03-02: Search and filtering for solo participants and teams.

### Phase 4: QR Attendance & Utility
**Goal**: Integrate physical-world utility via team-based QR codes.
**Depends on**: Phase 3
**Requirements**: QR-01, QR-02, QR-03
**Success Criteria**:
  1. Each registered team has a unique, scannable QR code.
  2. Organizers can scan the QR to track attendance and food token usage.
**Plans**: 1 plan

Plans:
- [ ] 04-01: QR generation and scanning/tracking logic.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Identity | 0/2 | Not started | - |
| 2. Hackathon Core | 0/1 | Not started | - |
| 3. Teams & Recruitment | 0/2 | Not started | - |
| 4. QR Attendance & Utility | 0/1 | Not started | - |
