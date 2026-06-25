# Phase 10: Participant Dashboard UI Integration - Context

**Gathered:** 2026-05-18
**Status:** Locked for planning
**Source:** User discussion

<domain>
## Phase Boundary
This phase handles the frontend UI integration for the Participant dashboard, specifically concerning hackathon browsing, team creation, and discovering/recruiting solo participants.
</domain>

<decisions>
## Implementation Decisions

### Participant Visibility (PROF-03)
- Solo participants need a dedicated UI element (e.g., a toggle button) in their profile or hub to switch their "visibility" status. This dictates whether they appear in Team Leaders' search results.

### Team Recruiting Workflow
- When a Team Leader finds a solo participant in the recruiting tab, they must be able to send a team join request.
- Solo participants require a dedicated "Requests" or "Inbox" area in the UI where they can view incoming join requests from Team Leaders and accept/decline them.
</decisions>

<canonical_refs>
## Canonical References
No external specs — requirements fully captured in decisions above.
</canonical_refs>

<specifics>
## Specific Ideas
- Visibility toggle button.
- "Requests" section for solo participants.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>
