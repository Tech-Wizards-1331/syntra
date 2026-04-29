<!-- GSD:project-start source:PROJECT.md -->
## Project

**Syntra Backend**

Syntra is a hackathon management system backend built with Django REST Framework. It handles the full lifecycle of hackathon events, serving organizers, participants, judges, and administrators. The platform is currently being extended to support a new `coordinator` role, allowing Sub-Admins to assign Coordinators with scoped permissions per hackathon.

**Core Value:** A complete, production-ready Django model layer and API that accurately represents the full hackathon management domain with proper role-based access control and scalable patterns.

### Constraints

- **Auth Model**: Must continue using the existing custom `User` model pattern (email-based, AbstractUser).
- **Tech Stack**: Python and Django 6.0.3 must be used.
- **Role Architecture**: Roles are currently global. Sub-Admin assigning Coordinators implies a need for a per-hackathon association, so the architecture must gracefully handle scoping without breaking the global role setup.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
