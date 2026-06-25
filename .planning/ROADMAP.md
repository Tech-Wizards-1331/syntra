# Roadmap: Syntra

## Overview

Syntra's current milestone focuses on the Problem Statement feature for hackathon organizers.

## Phases

- [x] **Phase 1: Problem Statements** - CRUD API for hackathon problem statements with PDF uploads.

## Phase Details

### Phase 1: Problem Statements
**Goal**: Allow Organizers to create, view, update, and delete problem statements for their hackathons, with optional PDF uploads.
**Depends on**: Nothing (Hackathon and OrganizerProfile models already exist)
**Requirements**: HACK-04
**Success Criteria**:
  1. Organizers can CRUD problem statements scoped to their own hackathons.
  2. PDF file uploads are validated (only .pdf allowed).
  3. Problem statements have an is_active toggle.
  4. Non-owners cannot access another organizer's problem statements.
**Plans**: 1 plan (API implementation)

  ### Phase 11: Build a production-ready real-time QR scanner system for Syntra hackathons using a One QR per Team architecture

  **Goal:** [To be planned]
  **Requirements**: TBD
  **Depends on:** Phase 10
  **Plans:** 1/1 plans complete

  Plans:
  - [x] TBD (run /gsd-plan-phase 11 to break down) (completed 2026-05-21)

  ### Phase 12: build the UI for displaying the QR code to participants and/or creating a scanning interface for organizers!

  **Goal:** Integrate the participant frontend templates with the backend APIs to enable hackathon browsing and team management.
  **Requirements**: TBD
  **Depends on:** Phase 11
  **Plans:** 0 plans

  Plans:
  - [ ] TBD (run /gsd-plan-phase 12 to break down)
**Requirements**: HACK-05

  ### Phase 12.1: Integrate Razorpay payment system for hackathons

  **Goal:** Integrate Razorpay payment system (demo mode) with team-wise/participant-wise pricing set by organizer.
  **Requirements**: TBD
  **Depends on:** Phase 12
  **Plans:** 0 plans

  Plans:
  - [ ] TBD (run /gsd-plan-phase 12.1 to break down)
