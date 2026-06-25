# Phase 10: Participant Dashboard UI Integration - Plan

**Goal:** Integrate the participant frontend templates with the backend APIs to enable hackathon browsing, team management, and the recruiting workflow.

## Plan 10-01: Connect Views and API Integrations

**Wave:** 1
**Depends on:** None

<task>
<title>Create TeamRequest Model and APIs for Recruiting Workflow</title>
<read_first>
- `backend/participant/models.py`
- `backend/participant/api_serializers.py`
- `backend/participant/api_views.py`
- `backend/participant/api_urls.py`
</read_first>
<action>
1. In `participant/models.py`, add a `TeamRequest` model:
   - `team`: ForeignKey to `Team`
   - `receiver`: ForeignKey to `settings.AUTH_USER_MODEL`
   - `status`: CharField choices: `pending`, `accepted`, `declined`
   - `created_at`: DateTimeField
   - `unique_together` on `team` and `receiver`
2. Create `TeamRequestSerializer` in `api_serializers.py`.
3. Add a new `TeamRequestViewSet` in `api_views.py` (inheriting ModelViewSet or similar) allowing:
   - Team Leaders to CREATE a request for a solo user.
   - Solo users to LIST their pending requests.
   - Solo users to UPDATE a request to `accepted` (which automatically creates a `TeamMember` record) or `declined`.
4. Register the router in `api_urls.py`.
</action>
<acceptance_criteria>
- `participant/models.py` contains `TeamRequest` class.
- `participant/api_views.py` contains `TeamRequestViewSet`.
- `api_urls.py` registers `requests` endpoint.
</acceptance_criteria>
</task>

<task>
<title>Setup Participant Django Template Views and Routing</title>
<read_first>
- `backend/participant/urls.py`
- `backend/participant/views.py`
</read_first>
<action>
1. In `backend/participant/views.py`, create class-based views inheriting from `LoginRequiredMixin` and `TemplateView`:
   - `HackathonListView`: Renders `participant/hackathon_list.html`.
   - `HackathonRegisterView`: Renders `participant/hackathon_register.html`.
   - `TeamHubView`: Renders `participant/hackathon_hub.html`.
   - `ParticipantInboxView`: Renders `participant/inbox.html` (for viewing invites and toggling visibility).
2. Map these views in `backend/participant/urls.py`:
   - `path('hackathons/', views.HackathonListView.as_view(), name='hackathon-list')`
   - `path('hackathons/<int:pk>/register/', views.HackathonRegisterView.as_view(), name='hackathon-register')`
   - `path('teams/<int:pk>/hub/', views.TeamHubView.as_view(), name='team-hub')`
   - `path('inbox/', views.ParticipantInboxView.as_view(), name='participant-inbox')`
</action>
<acceptance_criteria>
- `backend/participant/views.py` contains `HackathonListView`, `HackathonRegisterView`, `TeamHubView`, and `ParticipantInboxView`.
- `backend/participant/urls.py` contains URL patterns routing to these views.
</acceptance_criteria>
</task>

## Plan 10-02: Frontend UI Wireup

**Wave:** 2
**Depends on:** Plan 10-01

<task>
<title>Connect Hackathon List UI to Database Context</title>
<read_first>
- `frontend/templates/participant/hackathon_list.html`
- `backend/participant/views.py`
</read_first>
<action>
Update `HackathonListView` to fetch `Hackathon` objects (e.g. `Hackathon.objects.filter(is_active=True)`) and pass them as `hackathons` context data.
Modify `frontend/templates/participant/hackathon_list.html` to loop through `{% for hackathon in hackathons %}` and dynamically populate the Hackathon cards (Name, Date, Description, and a link to the registration page).
</action>
<acceptance_criteria>
- `hackathon_list.html` contains the `{% for hackathon in hackathons %}` Django template tag.
- `HackathonListView` in `views.py` defines `get_context_data` to inject the hackathons.
</acceptance_criteria>
</task>

<task>
<title>Implement Team Recruiting Search and Invites in Hub UI</title>
<read_first>
- `frontend/templates/participant/hackathon_hub.html`
</read_first>
<action>
In `frontend/templates/participant/hackathon_hub.html`, write vanilla JavaScript to allow Team Leaders to search for solo participants and send requests.
1. Fetch data from `/api/participant/discovery/?skill=<query>`.
2. Render the results dynamically.
3. Add an "Invite" button to each result that makes a POST request to `/api/participant/requests/` with the target `receiver` ID and the `team` ID.
</action>
<acceptance_criteria>
- `hackathon_hub.html` contains JS to fetch from `/api/participant/discovery/`.
- `hackathon_hub.html` contains JS to POST to `/api/participant/requests/`.
</acceptance_criteria>
</task>

<task>
<title>Create Solo Participant Inbox UI</title>
<read_first>
- `frontend/templates/participant/inbox.html`
- `backend/participant/models.py`
</read_first>
<action>
Create a new template `frontend/templates/participant/inbox.html`.
1. Render a toggle button to change `ParticipantProfile.visibility`. Add JS to PATCH the profile endpoint when clicked.
2. Render a list of pending `TeamRequest` objects for the logged-in user (fetch via JS from `/api/participant/requests/` or pass via Django context).
3. Add "Accept" and "Decline" buttons next to each request that PATCH the request status to the API.
</action>
<acceptance_criteria>
- `inbox.html` file exists.
- `inbox.html` contains logic to toggle visibility and accept/decline team requests.
</acceptance_criteria>
</task>
