---
phase: 2
slug: authentication-custom-password-hashing
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-02
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for frontend phases.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react |
| Font | sans-serif (Inter / System default) |

---

## Spacing Scale

Declaring layout scaling values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, form field labels |
| sm | 8px | Button inline gaps, subtext |
| md | 16px | Field-to-field vertical spacing |
| lg | 24px | Form card internal padding |
| xl | 32px | Layout spacing for header/footer |
| 2xl | 48px | Form container outer margins |
| 3xl | 64px | Page header vertical gap |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 (normal) | 1.5 |
| Label | 12px | 500 (medium) | 1.2 |
| Heading | 24px | 700 (bold) | 1.3 |
| Display | 36px | 800 (extra-bold) | 1.2 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `slate-950` (`#020617`) | Main background canvas, dark overlay |
| Secondary (30%) | `slate-900` (`#0f172a`) | Glassmorphic form panels, field backgrounds |
| Accent (10%) | `teal-400`/`emerald-400` (`#2dd4bf` to `#34d399`) | Buttons, active fields focus, branding highlights |
| Destructive | `red-500` (`#ef4444`) | Error state alerts |

Accent reserved for: Primary submit CTAs, logo emblem gradient, input focus borders.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Sign In" / "Register Account" |
| Empty state heading | "No account found" |
| Empty state body | "Please register or login with Google/GitHub to access the hackathon dashboard." |
| Error state | "Invalid email or password. Please try again or log in via social providers." |
| Destructive confirmation | "Delete: Are you sure you want to delete this session?" |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-02
