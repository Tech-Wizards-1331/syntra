# Quick Task: Remove button hover underline and fix hover text visibility - Summary

## Changes Made
- Modified `frontend/static/css/design-system.css`:
  - Reverted `a:hover:not(.btn)` to `a:hover` to restore default anchor behavior and prevent double-underline specificity conflicts on navbar links.
  - Added explicit hover text colors (`color: white;` or `color: var(--text-primary);`) to all button subclass hover selectors (`.btn--primary:hover`, `.btn--secondary:hover`, `.btn--ghost:hover`, and `.btn--danger:hover`). This ensures anchor-based button variants do not inherit the blue link text color on hover.

## Verification Status
- Verified that all buttons are no longer underlined on hover.
- Verified that primary blue buttons keep white text on hover (visibility fixed).
- Verified that navbar links do not display double underlines.
