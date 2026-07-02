# Phase 13 — CONTEXT: home.html UI Overhaul

Generated: 2026-06-20
Phase: 13 (home.html full UI rewrite — Light SaaS alignment)

---

## Locked Decisions

### D1: Theme Direction — Light SaaS
- **Decision:** Strip all dark glassmorphism from home.html and align to `design-system.css` Light SaaS theme.
- **Rationale:** home.html currently uses dark rgba backgrounds, teal/yellow/rose glass palette, particle canvas, cursor glow — none of which exist in the design system. User chose full alignment.
- **Impact:** Remove `.glass`, `.hero-orb`, `.grid-bg`, `#particle-canvas`, `#cursor-glow`, `hero-noise`, all dark tailwind classes. Replace with design-system tokens: `--bg-primary`, `--bg-surface`, `--border`, `--primary-blue`, `--text-primary`, etc.

### D2: Navbar Style — Clean Modern Light
- **Decision:** Floating pill navbar becomes a clean white/off-white top bar with subtle border.
- **Implementation:** Use `bg-surface` background, `border` color border, Inter font, blue primary CTA buttons using `.btn--primary`.
- **No dark frosted glass.** No backdrop-filter blur needed.

### D3: Hackathons Section — Marquees Stay, CTA Moves to Center Column
- **Decision:** Keep both left and right marquee sidebar columns.
- **CTA placement:** The CTA card ("Ready to host your hackathon?") becomes the **center column** in a proper 3-column grid layout. It should be vertically centered and prominent — the focal point of the section.
- **Layout:** `display: grid; grid-template-columns: 1fr auto 1fr;` or Tailwind `grid-cols-[1fr_auto_1fr]` with the CTA occupying the middle.

### D4: Timeline Section — REMOVED
- **Decision:** The entire Event Timeline section (lines 265–420 in current home.html) is removed.
- **No replacement needed.** The hackathon discovery is served by the Hackathons marquee section.

### D5: Encoding Artifacts — Fix if outside timeline
- **Decision:** Timeline is removed, so timeline encoding issues go away. Any remaining `â€"` / `Â·` artifacts in testimonials, features, or other sections must be fixed to proper `–` / `·` Unicode.

### D6: Rewrite Depth — Full Rewrite
- **Decision:** Rebuild home.html from scratch using only Light SaaS design-system patterns. Do not patch the existing file incrementally.
- **Keep:** Page structure (Nav, Hero, Hackathons, How It Works, Features, Testimonials, Footer), section IDs for nav anchors, Django template tags (`{% url 'login' %}`, `{% static ... %}`).
- **Remove:** All dark-theme CSS classes, particle canvas, cursor glow, grid-bg, hero-orb, hero-stack, hero-chip, hero-layer, hero-motion, hero-noise, pulse-dot, marquee animation classes (keep marquee logic but restyle), glass class.
- **Add:** Clean card components using `.card`, light section backgrounds, blue `.btn--primary`, proper typography from design-system.

---

## What the Rewrite Must Deliver

### Navbar
- Fixed top, white/off-white background, 1px bottom border using `--border`
- Logo: "Syntra" with brand mark using blue accent
- Nav links: Inter, `--text-secondary`, blue hover
- CTAs: "Get Started" as `.btn--secondary`, "Create Hackathon" as `.btn--primary`
- Mobile hamburger opens a light sidebar menu (no dark overlay)

### Hero Section
- Left column: headline, subtitle, stats row, CTA buttons
- Right column: replace dark hero-stack with a **clean light dashboard mockup card** (white surface, subtle shadow, shows Submissions/Mentor Queue metrics in blue/green colors)
- Badge: "Premium Event Operations" — light blue pill instead of rose-red dark pill
- H1 gradient: can keep `from-blue-600 to-teal-500` gradient on the emphasized span — or use solid `--primary-blue`

### Hackathons Section (3-column)
- Left: marquee column scrolling upward with hackathon cards (light `.card` style)
- Center: CTA card — white card, prominent, vertically centered, "Ready to host your hackathon?" with `.btn--primary`
- Right: reverse-direction marquee column with hackathon cards (light `.card` style)
- Hackathon cards: white background, `--border` border, Online/Offline badge using `.badge--success` / `.badge--warning`

### How It Works (Problem/Solution grid)
- Same 2-column grid
- Problem card: light red tint background `var(--danger-bg)`, `var(--danger)` accent border
- Solution card: light green/blue tint `var(--success-bg)` or `var(--selected-bg)`, `var(--success)` or `var(--primary-blue)` accent

### Features Grid
- 4-column grid of `.card` components
- Icon box: colored bg tint using design-system status colors
- No dark glass. Clean white cards with hover shadow lift.

### Testimonials (Dual Marquee)
- Keep the two marquee rows (forward + reverse)
- Cards: `.card` style, white background, `--text-primary` for quote, `--text-secondary` for name
- Avatar initials circle: blue/teal/rose variants (can keep color variety here)

### Footer
- White card footer with 3-column grid (About, Links, Social)
- Gradient accent bar on top: `from-blue-500 to-teal-400` — keep as a subtle brand accent
- Social links: clean circle buttons with `--border` and hover blue

---

## Files to Modify

| File | Change |
|------|--------|
| `frontend/templates/home.html` | **Full rewrite** |
| `frontend/static/js/home.js` | Review and strip dark-theme JS (particle canvas, cursor glow) |
| `frontend/static/css/design-system.css` | No changes needed — this is the source of truth |

## Files NOT to Modify
- `frontend/static/css/tailwind.css` (generated)
- Any account/participant/organizer templates
- Any backend Python files

---

## Tailwind vs Design-System Usage

home.html currently mixes Tailwind utility classes with custom `.glass`, `.btn--primary`, etc.
The new rewrite should:
1. **Prefer design-system.css classes** for components (`.btn`, `.card`, `.badge`)
2. **Use Tailwind sparingly** for layout only (grid, flex, spacing utilities)
3. **Never** use Tailwind color classes like `bg-slate-900`, `text-teal-300` — use design-system CSS vars instead

---

## Visual Tone Target

The new home.html should feel like:
- Linear, Vercel, Notion landing pages
- Clean white space, subtle shadows, blue primary brand
- Professional SaaS — not a hackathon "hype" page
- Fast, readable, conversion-focused
