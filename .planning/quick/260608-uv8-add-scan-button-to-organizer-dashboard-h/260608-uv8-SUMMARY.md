---
quick_id: 260608-uv8
completed: 2026-06-08
commit: ae27faeb6f9d17e37b58208c7b81b4e1a38ad666
---

# Quick Task 260608-uv8: Add Scan Button to Organizer Dashboard - Summary

**Scan action button added to hackathons list in organizer dashboard linked to the QR scanner interface**

## Accomplishments
- Added a "Scan" action button next to the "Seating" action button for each hackathon in the organizer dashboard.
- Configured the button to link directly to `/organizer/scan?hackathonId=${h.id}` passing the hackathon ID as a query parameter.
- Integrated the Lucide `Scan` icon to match dashboard styling.

## Task Commits
1. **Task 1: Add scan button to organizer dashboard** - `ae27faeb6f9d17e37b58208c7b81b4e1a38ad666` (feat)

## Files Modified
- `app/organizer/dashboard/page.tsx` - Added the Scan button link and styled it to match other action buttons.
