# Quick Task 260620-f7a: login error highlighting - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Task Boundary

Highlight invalid credentials error messages in the login and signup pages using a premium SaaS design pattern:
1. Fix the CSS styling bug where the error banner gets unstyled classes (`auth-msg auth-msg-error` instead of `.message message--error`).
2. Add a premium horizontal card-shake micro-animation on login/signup failure.

</domain>

<decisions>
## Implementation Decisions

### Alert Banner Highlight
- **Banner Classes**: Use the design system's existing alert banner styles (`message message--error`), featuring a soft red background, red left border, and red text.
- **Entry Animation**: The banner should slide down smoothly on entry (already configured in `.message` with the `slideIn` keyframe).

### Card Shake Animation
- **CSS Definition**: Define a keyframe-based horizontal shake animation (`@keyframes shake`) and a `.shake` class in the global `design-system.css`.
- **JS Trigger**: Toggle the `.shake` class on the `.auth-card` container element in `auth_api.js` whenever an error occurs.
- **Animation Reset**: Force a browser reflow before adding the `.shake` class so that the animation re-triggers on consecutive validation errors.

</decisions>

<specifics>
## Specific Ideas
- Modify `auth_api.js` to set classes to `message message--error` / `message message--success`.
- In `auth_api.js` `showApiMessage`, locate the nearest `.auth-card` and add the `.shake` class.

</specifics>
