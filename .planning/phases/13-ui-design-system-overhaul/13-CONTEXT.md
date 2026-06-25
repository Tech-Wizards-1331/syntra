# Phase 13: UI Design System Overhaul - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Source:** Developer specification (direct input)

<domain>
## Phase Boundary

Complete visual redesign of all existing Django templates. This is a **UI skin + design system task only** — no features, workflows, or product logic changes. All functionality already exists and must be preserved exactly.

**Scope:** 15 Django templates, 5 CSS files, shared design system
**Architecture:** Django templates + vanilla CSS design system (replaces dark-mode Tailwind + Bootstrap hybrid)
**Direction:** Linear / Notion / Stripe-inspired enterprise SaaS

</domain>

<decisions>
## Implementation Decisions

### Design Language
- Style: Minimal, enterprise-grade, highly structured, fast and scannable
- Inspiration: Linear / Notion / Stripe-level polish
- NO decorative UI, NO experimental visuals

### Color System — LOCKED
- Primary background: #FCFCFD (avoid pure white dominance)
- Secondary: #F8F9FA
- Elevated cards: #FFFFFF or #F8F9FA
- Borders: #E5E7EB
- Primary interaction blue: #2563EB
- Hover blue: #1D4ED8
- Selected background: #EFF6FF
- Success: #16A34A / bg: #DCFCE7
- Warning: #F59E0B / bg: #FEF3C7
- Danger: #DC2626 / bg: #FEE2E2
- RULES: No gradients, no neon colors, no heavy color usage, restrained SaaS palette

### Typography — LOCKED
- Primary font: Inter
- Optional secondary: Geist
- Body weight: 400–500
- Emphasis: 500
- Headings: 600–700
- Display headings: Inter Tight + 600–700
- Strong hierarchy between labels and values
- Headings: tighter letter spacing (-0.02em to -0.04em)
- Numbers (KPIs) must visually dominate labels

### Layout Rules — LOCKED
- Clean SaaS dashboard grid
- High spacing discipline (structured, not overly sparse)
- Clear section grouping
- Role-based UI layout styling only (no logic changes)
- Optimized for dense enterprise dashboards

### Cards / Surfaces — LOCKED
- Border: 1px solid #E5E7EB
- Subtle shadow + border combined
- Soft rounded corners (8px recommended)
- Layered surfaces instead of flat UI
- NO shadow-only cards, NO flat undifferentiated sections

### Component Style — LOCKED
- Buttons: Minimal, clean. Primary / Secondary / Ghost only. 150–200ms hover transition. Subtle hover state changes.
- Tables: Dense, readable, structured. Row hover states. Subtle dividers. Optimized for large datasets.
- Navigation: Left sidebar layout. Clear grouping. Active state: #EFF6FF bg. Simple monochrome icons.
- Modals: Clean surface. Soft shadow + border. No visual clutter.

### Dashboard Visual Hierarchy — LOCKED
- KPI-first visual priority
- Large numeric emphasis
- Clear separation: Overview / Activity / Insights / Operations
- Must support fast scanning of information

### Interaction Style — LOCKED
- Subtle hover states only
- No flashy animations
- Fast, responsive feel
- Micro-interactions only (hover, selection, focus)

### Responsiveness — LOCKED
- Fully responsive UI
- Mobile + tablet optimized layouts
- Tables must adapt gracefully
- No layout breaking under data density

### Agent's Discretion
- Exact border-radius values for each component type
- Specific shadow values (must be subtle)
- Sidebar navigation groupings
- Exact spacing tokens (must follow 4px/8px grid)
- Icon library choice (recommend Lucide or simple SVG)
- Base layout template structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Existing Templates (to be restyled)
- `frontend/templates/accounts/login.html` — Auth login page
- `frontend/templates/accounts/signup.html` — Auth signup page
- `frontend/templates/accounts/dashboard.html` — Role-based dashboard
- `frontend/templates/accounts/complete_profile.html` — Profile completion form
- `frontend/templates/organizer/create_hackathon.html` — Create hackathon form
- `frontend/templates/organizer/edit_hackathon.html` — Edit hackathon form
- `frontend/templates/organizer/hackathon_detail.html` — Organizer hackathon management (1001 lines)
- `frontend/templates/organizer/add_problem_statement.html` — Add problem statement form
- `frontend/templates/organizer/edit_problem_statement.html` — Edit problem statement form
- `frontend/templates/organizer/qr_scanner.html` — QR scanner interface
- `frontend/templates/participant/hackathon_list.html` — Browse open hackathons
- `frontend/templates/participant/hackathon_register.html` — Multi-step registration wizard
- `frontend/templates/participant/hackathon_hub.html` — Participant hackathon hub
- `frontend/templates/participant/team_pass.html` — Team pass / QR code display
- `frontend/templates/participant/payment_checkout.html` — Payment checkout
- `frontend/templates/home.html` — Landing page (50KB)

### Existing CSS (to be replaced)
- `frontend/static/css/login.css` — Auth pages custom CSS (dark theme)
- `frontend/static/css/profile_complete.css` — Profile form CSS
- `frontend/static/css/home.css` — Home page CSS
- `frontend/static/css/tailwind.src.css` — Tailwind source with component styles
- `frontend/static/css/tailwind.css` — Compiled Tailwind output

### Existing JS (preserve functionality)
- `frontend/static/js/api_client.js` — API client utility
- `frontend/static/js/auth_api.js` — Auth API handlers
- `frontend/static/js/home.js` — Home page interactions
- `frontend/static/js/login.js` — Login form handler
- `frontend/static/js/logout.js` — Logout handler
- `frontend/static/js/profile_complete.js` — Profile form handler

</canonical_refs>

<specifics>
## Specific Ideas

### Current State Analysis
- Current UI: Dark theme (bg-slate-950), glassmorphism, neon glow effects, Orbitron tech font
- CSS setup: Tailwind + Bootstrap hybrid with heavy inline styles
- Problem: "Common and student project vibed" — developer wants enterprise-grade SaaS look
- Templates contain massive inline `<style>` blocks and duplicated component patterns

### Transformation Required
- Dark theme → Light SaaS theme (#FCFCFD base)
- Glassmorphism + glow → Clean bordered cards with subtle shadows
- Orbitron/tech fonts → Inter with strict hierarchy
- Gradient buttons → Solid, minimal buttons
- Scattered inline styles → Centralized design system CSS
- Bootstrap + Tailwind dependency → Clean vanilla CSS design tokens

</specifics>

<deferred>
## Deferred Ideas

- Dark mode toggle (light-first, dark mode can be added later)
- Design token export to Figma
- Component library documentation page

</deferred>

---

*Phase: 13-ui-design-system-overhaul*
*Context gathered: 2026-06-01 via developer specification*
