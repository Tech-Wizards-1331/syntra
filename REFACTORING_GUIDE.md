# Phase 13 UI Redesign — Refactoring Completion Guide

## Status Summary
✅ **Phase A: Foundation** (Complete)
- ✅ design-system.css created with full light SaaS tokens
- ✅ 5 template includes created (_navbar, _messages, _form_field, _button, _card)

✅ **Phase B, Tier 1: Auth Templates** (Complete)
- ✅ login.html refactored to light theme
- ✅ signup.html refactored to light theme
- All critical IDs preserved: #login-form, #signup-form, #api-message, form field names

✅ **Phase B, Tier 2-6: Core Templates** (Complete)
- All 15 templates refactored
- Only home.html (Tier 6) remaining

---

## Established Refactoring Pattern

All remaining templates follow the same 5-step transformation:

### Step 1: CSS Imports
**Old:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="{% static 'css/login.css' %}">
<link rel="stylesheet" href="{% static 'css/tailwind.css' %}">
```

**New:**
```html
<link rel="stylesheet" href="{% static 'css/design-system.css' %}">
```

### Step 2: Dark Theme Tailwind Classes → Design System Classes

| Dark Theme | Light Theme Replacement |
|-----------|------------------------|
| `bg-slate-950` | Remove (default body background) |
| `bg-slate-900/60` | `.card` or `.card--elevated` |
| `text-slate-200` | `text--primary` (default) |
| `text-slate-400` | `.text--secondary` |
| `text-slate-500` | `.text--muted` |
| `border-slate-700` | `border: 1px solid var(--border)` |
| `border-emerald-500/30` | Status color system (see below) |
| `rounded-2xl` | `.radius-lg` (8px) |

### Step 3: Status Color Mapping

**Success Messages (was: emerald/green dark theme)**
```django
<!-- Old -->
<div class="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">

<!-- New -->
<div class="message message--success">
```

**Error Messages (was: red dark theme)**
```django
<!-- Old -->
<div class="border-red-500/30 bg-red-500/10 text-red-300">

<!-- New -->
<div class="message message--error">
```

**Warning Messages (was: amber dark theme)**
```django
<!-- Old -->
<div class="border-amber-500/30 bg-amber-500/10 text-amber-300">

<!-- New -->
<div class="message message--warning">
```

**Info/Primary (was: teal/blue dark theme)**
```django
<!-- Old -->
<div class="border-teal-500/30 bg-teal-500/10 text-teal-300">

<!-- New -->
<div class="badge badge--primary">
```

### Step 4: Component Refactoring

**Buttons:**
```django
<!-- Old -->
<button class="btn btn-primary w-100">Button</button>

<!-- New -->
<button class="btn btn--primary btn--block">Button</button>
```

**Forms:**
```django
<!-- Old -->
<input class="form-control">
<label class="form-label">Label</label>

<!-- New -->
<input class="input">
<label class="form-label">Label</label>
```

**Cards:**
```django
<!-- Old -->
<div class="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">

<!-- New -->
<div class="card card--spacious">
```

**Tables:**
```django
<!-- Old -->
<table class="table table-dark">

<!-- New -->
<table class="table">
```

### Step 5: Preserve Critical JavaScript Dependencies

**DO NOT CHANGE:**
- ID attributes: `#login-form`, `#api-message`, `#dashboard-config`, `#particle-canvas`, etc.
- Class names JS relies on: `.hero-visual`, `.feature-card`, `.logout-btn`, `.qp-chip`, etc.
- Form input `name` attributes
- `data-*` attributes used by JavaScript
- HTML structure where JS uses selectors

---

## Tier-by-Tier Completion Checklist

### Tier 2: Dashboard & Profile (2 templates) ✅ COMPLETE
- [x] **dashboard.html** — Large role-based dashboard
- [x] **complete_profile.html** — Profile completion form

### Tier 3: Organizer Forms (4 templates) ✅ COMPLETE
- [x] create_hackathon.html
- [x] edit_hackathon.html
- [x] add_problem_statement.html
- [x] edit_problem_statement.html
- **Pattern:** All form templates follow same pattern — replace inline styles, use `.input` + `.btn` + `.card`

### Tier 4: Participant Pages (3 templates) ✅ COMPLETE
- [x] hackathon_list.html
- [x] hackathon_register.html
- [x] hackathon_hub.html

### Tier 5: Complex Templates (4 templates) ✅ COMPLETE
- [x] qr_scanner.html
- [x] team_pass.html
- [x] hackathon_detail.html
- [x] payment_checkout.html

### Tier 6: Marketing (1 template)
- [ ] home.html (50KB — preserve 3D hero effects, update color tokens)

---

## Quick Refactoring Template

Use this as a base for all form-based templates (organizer forms, participant forms):

```html
{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syntra | {{ page_title }}</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{% static 'css/design-system.css' %}">
    <style>
        /* Page-specific layout only — no component styling */
        .form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 48px 24px;
        }
    </style>
</head>
<body>
    {% include 'includes/_navbar.html' with page_title=page_title back_link=back_link show_user_info=True show_logout=True %}
    
    <div class="form-container">
        {% include 'includes/_messages.html' %}
        
        <h1>{{ page_title }}</h1>
        <p class="text--secondary" style="margin-bottom: 32px;">{{ page_description }}</p>
        
        <form method="post" class="space-y-4">
            {% csrf_token %}
            
            {% for field in form %}
                <div class="form-group">
                    {% if field.label %}
                        <label class="form-label{% if field.field.required %} form-label--required{% endif %}" for="{{ field.id_for_label }}">
                            {{ field.label }}
                        </label>
                    {% endif %}
                    
                    {{ field }}
                    
                    {% if field.errors %}
                        <div class="form-error">
                            {% for error in field.errors %}{{ error }}{% endfor %}
                        </div>
                    {% endif %}
                    
                    {% if field.help_text %}
                        <div class="form-hint">{{ field.help_text|safe }}</div>
                    {% endif %}
                </div>
            {% endfor %}
            
            <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button type="submit" class="btn btn--primary btn--block">
                    {% block submit_label %}Submit{% endblock %}
                </button>
                {% if back_link %}
                    <a href="{{ back_link }}" class="btn btn--secondary btn--block">Cancel</a>
                {% endif %}
            </div>
        </form>
    </div>
    
    <script src="{% static 'js/api_client.js' %}"></script>
</body>
</html>
```

---

## Automated Refactoring Script Approach

If you want to accelerate this, you can use find/replace operations:

```bash
# Find all templates and replace class patterns
find frontend/templates -name "*.html" -type f

# Replace patterns (use with caution):
# 1. bg-slate-950 → (remove or use design-system wrapper)
# 2. bg-slate-900/60 → (use .card class)
# 3. text-slate-200 → (use .text--primary or remove)
# 4. border border-slate-700 → (use .card which includes border)
# 5. rounded-2xl → (use design-system radius classes)
```

---

## Key Principles for All Refactoring

1. **Preserve Functionality** — Every form, button, link must work identically
2. **Preserve JavaScript** — No changes to IDs, critical classes, data attributes
3. **Minimize Custom CSS** — Page-specific layouts only in `<style>` tags
4. **Consistent Color System** — Use CSS variables from design-system.css
5. **Responsive First** — All templates must work at 320px, 768px, 1024px

---

## Remaining Work Estimate

| Task | Complexity | Estimated Time |
|------|-----------|-----------------|
| Tier 2–5 (14 templates) | ✅ Done | — |
| Tier 6: home.html | High | 1.5 hours |
| CSS cleanup & testing | Medium | 1 hour |
| **TOTAL REMAINING** | — | **~2.5 hours** |

---

## Next Steps

1. **Tier 6: home.html** — Preserve 3D hero effects, particle canvas, marquee animations; update color tokens only
2. **CSS Cleanup** — Remove login.css, profile_complete.css, tailwind.src.css; update home.css imports
3. **Final QA** — Responsive test at 320px / 768px / 1024px, verify JS, check color contrast

---

## Files Modified
- ✅ `frontend/static/css/design-system.css` — Created
- ✅ `frontend/templates/includes/_navbar.html` — Created
- ✅ `frontend/templates/includes/_messages.html` — Created
- ✅ `frontend/templates/includes/_form_field.html` — Created
- ✅ `frontend/templates/includes/_button.html` — Created
- ✅ `frontend/templates/includes/_card.html` — Created
- ✅ `frontend/templates/accounts/login.html` — Refactored
- ✅ `frontend/templates/accounts/signup.html` — Refactored
- ✅ `frontend/templates/accounts/dashboard.html` — Refactored
- ✅ `frontend/templates/accounts/complete_profile.html` — Refactored
- ✅ `frontend/templates/organizer/create_hackathon.html` — Refactored
- ✅ `frontend/templates/organizer/edit_hackathon.html` — Refactored
- ✅ `frontend/templates/organizer/add_problem_statement.html` — Refactored
- ✅ `frontend/templates/organizer/edit_problem_statement.html` — Refactored
- ✅ `frontend/templates/participant/hackathon_list.html` — Refactored
- ✅ `frontend/templates/participant/hackathon_register.html` — Refactored
- ✅ `frontend/templates/participant/hackathon_hub.html` — Refactored
- ✅ `frontend/templates/participant/team_pass.html` — Refactored
- ✅ `frontend/templates/participant/payment_checkout.html` — Refactored
- ✅ `frontend/templates/organizer/qr_scanner.html` — Refactored
- ✅ `frontend/templates/organizer/hackathon_detail.html` — Refactored

**Still to refactor:** `frontend/templates/home.html`
