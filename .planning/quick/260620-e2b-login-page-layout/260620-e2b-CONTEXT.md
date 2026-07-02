# Quick Task 260620-e2b: login page layout - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Task Boundary

Improve the login page layout:
1) Remove extra space so all content fits on the screen without scrolling.
2) Combine both `auth-branding` and `auth-form` container in a main div with rounded edges (centered card).

</domain>

<decisions>
## Implementation Decisions

### Page Background & Card Style
- **Page Background**: Subtle grey background (`--bg-secondary` / `#F8F9FA`)
- **Card Style**: Centered rounded card with a soft shadow, max-width around 850px, containing both panels.

### Left Branding Panel
- **Background**: Premium dark blue/indigo gradient background (`linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)` or similar matching the landing page theme).
- **Text & Icon**: White text, white background icon with blue text for a high-contrast premium feel.

### Spacing & Height
- Set paddings and margins to be highly compact to fit all content on standard screen heights without vertical scrollbars.
- Use grid alignment to center the card.

### Mobile Responsiveness
- Hide the branding panel on mobile screens (`max-width: 768px`) and show only the login form inside a compact card layout.

</decisions>

<specifics>
## Specific Ideas
- Reduce divider margins, button margins, and container paddings.
- Add an outer wrapper to center the card horizontally and vertically on the viewport.

</specifics>
