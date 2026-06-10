---
phase: 3
slug: seating-service-and-razorpay-port
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-03
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for the interactive seating allocation interface.

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

We use the standard project layout scaling values:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Grid cell padding, seat indicators |
| sm | 8px | Bench card headers, status badges |
| md | 16px | Field-to-field spacing, room grid gaps |
| lg | 24px | Layout card interior margins |
| xl | 32px | Section margins, top dashboard bar |
| 2xl | 48px | Dashboard outer page margins |

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
| Dominant (60%) | `slate-950` (`#020617`) | Page background |
| Secondary (30%) | `slate-900` (`#0f172a`) | Glassmorphic panel cards, room cards |
| Accent (10%) | `teal-400`/`emerald-400` | CTA buttons, active allocations |
| Empty / Free Seat | `slate-800` (`#1e293b`) | Empty seat circle borders |
| Occupied Seat | `teal-500` (`#0d9488`) | Assigned seat circle fill and highlights |
| Warning / Mixed Bench | `amber-500` (`#f59e0b`) | Border highlight indicating team fragmentation |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Run Seating Allocation" |
| Save CTA | "Save Seating Layout" |
| Re-run CTA | "Re-allocate Seats" |
| Empty state heading | "No allocation generated" |
| Empty state body | "Run the seating allocation algorithm to assign seats for this hackathon." |
| Loading state | "Allocating seats for {count} team members..." |
| Success toast | "Seating allocation saved successfully." |

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

**Approval:** approved 2026-06-03
