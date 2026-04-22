/* ── Auth & API helpers ─────────────────────────────── */
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.replace('/accounts/login/');
        return null;
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function apiRequest(url, options = {}) {
    const headers = getAuthHeaders();
    if (!headers) return null;
    options.headers = { ...headers, ...(options.headers || {}) };
    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            localStorage.removeItem('access_token');
            window.location.replace('/accounts/login/');
            return null;
        }
        return res;
    } catch (e) {
        toast('Network error. Check your connection.', 'error');
        return null;
    }
}

/* ── Toast Notifications ────────────────────────────── */
function toast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');

    const icon = type === 'success' ? 'fa-check-circle'
               : type === 'error'   ? 'fa-exclamation-circle'
               : 'fa-info-circle';

    el.className = `toast-msg ${type}`;
    el.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    container.appendChild(el);

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

/* ── Format dates ───────────────────────────────────── */
function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Stats counting ─────────────────────────────────── */
function animateCount(el, target) {
    let cur = 0;
    const step = Math.ceil(target / 20);
    const interval = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur;
        if (cur >= target) clearInterval(interval);
    }, 40);
}

function updateStats(hackathons) {
    animateCount(document.getElementById('stat-total'),    hackathons.length);
    animateCount(document.getElementById('stat-live'),     hackathons.filter(h => h.status === 'ONGOING').length);
    animateCount(document.getElementById('stat-upcoming'), hackathons.filter(h => h.status === 'PUBLISHED').length);
    animateCount(document.getElementById('stat-done'),     hackathons.filter(h => h.status === 'COMPLETED').length);
}

/* ── Fetch & Render ─────────────────────────────────── */
async function fetchHackathons() {
    showSkeleton();
    const res = await apiRequest('/api/organizer/hackathons/');
    if (!res) return;
    const data = await res.json().catch(() => []);
    updateStats(Array.isArray(data) ? data : []);
    renderHackathons(Array.isArray(data) ? data : []);
}

function showSkeleton() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('hackathons-grid').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
}

function renderHackathons(list) {
    document.getElementById('loading-state').style.display = 'none';
    const grid = document.getElementById('hackathons-grid');
    const empty = document.getElementById('empty-state');

    if (!list.length) {
        empty.style.display = 'flex';
        grid.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    grid.style.removeProperty('display');
    grid.innerHTML = '';

    list.forEach(h => {
        hackathonCache[h.id] = h;   // cache for details/update modals
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        const statusLabel = { DRAFT: 'Draft', PUBLISHED: 'Published', ONGOING: 'Ongoing', COMPLETED: 'Completed' }[h.status] || h.status;
        col.innerHTML = `
            <div class="hackathon-card">
                <div class="card-top-bar"></div>
                <div class="card-body-inner">
                    <div class="card-header-row">
                        <h4 class="hackathon-title">${escapeHtml(h.name)}</h4>
                        <span class="status-badge status-${h.status || 'DRAFT'}">${statusLabel}</span>
                    </div>
                    <p class="hackathon-desc">${escapeHtml(h.description || '')}</p>
                    <div class="card-meta">
                        <div class="meta-item"><i class="fas fa-calendar-start"></i>${fmt(h.start_date)}</div>
                        <div class="meta-item"><i class="fas fa-users"></i>${h.min_team_size}–${h.max_team_size} members</div>
                        ${h.certificates_enabled ? '<div class="meta-item"><i class="fas fa-certificate" style="color:var(--yellow)"></i>Certificates on</div>' : ''}
                    </div>
                </div>
                <div class="card-footer-inner">
                    <button class="btn-card-details" onclick="openDetailsModal('${h.id}')">
                        <i class="fas fa-info-circle me-2"></i>Details
                    </button>
                    <button class="btn-card-manage" onclick="openManageModal('${h.id}', '${escapeHtml(h.name)}')">
                        <i class="fas fa-cog me-2"></i>Manage
                    </button>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/* ── Manage Modal ───────────────────────────────────── */
let currentManageId = null;
let hackathonCache  = {};   // id → full hackathon object

function openManageModal(id, name) {
    currentManageId = id;
    document.getElementById('manage-hackathon-id').value = id;
    document.getElementById('manageHackathonModalLabel').textContent = name;
    document.getElementById('manageHackathonModalLabel').setAttribute('title', name);
    // Reset tabs
    clearManageAlerts();
    document.getElementById('assign-coordinator-form').reset();
    // Reset to first tab
    const firstTab = document.querySelector('#manageTabs .nav-link');
    bootstrap.Tab.getOrCreateInstance(firstTab).show();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('manageHackathonModal')).show();
}

function clearManageAlerts() {
    ['manage-api-message', 'coordinator-api-message', 'ps-api-message'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'form-alert mb-3 d-none';
        el.textContent = '';
    });
}

function showAlert(elId, msg, isError) {
    const el = document.getElementById(elId);
    el.className = `form-alert mb-3 ${isError ? 'error' : 'success'}`;
    el.textContent = msg;
    el.classList.remove('d-none');
}

async function quickAction(suffix, method) {
    if (!currentManageId) return;
    clearManageAlerts();
    const res = await apiRequest(`/api/organizer/hackathons/${currentManageId}/${suffix}/`, { method });
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
        const msg = typeof data === 'object' ? JSON.stringify(data) : String(data);
        showAlert('manage-api-message', msg, false);
        toast(msg, 'success');
    } else {
        showAlert('manage-api-message', data.detail || 'Action failed.', true);
    }
}

function viewAnalytics()      { quickAction('analytics', 'GET'); }
function notifyParticipants() { quickAction('notify_participants', 'POST'); }
function generateResults()    { quickAction('generate_results', 'POST'); }

/* ── Assign Coordinator ─────────────────────────────── */
document.getElementById('assign-coordinator-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn   = document.getElementById('assign-btn');
    const btext = document.getElementById('assign-btn-text');
    const bspin = document.getElementById('assign-btn-spinner');

    btext.classList.add('d-none');
    bspin.classList.remove('d-none');
    btn.disabled = true;

    const email = this.elements['coordinator_email'].value;
    const id = document.getElementById('manage-hackathon-id').value;

    const res = await apiRequest(`/api/organizer/hackathons/${id}/assign_coordinator/`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });

    btext.classList.remove('d-none');
    bspin.classList.add('d-none');
    btn.disabled = false;

    if (!res) return;
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
        showAlert('coordinator-api-message', data.message || 'Coordinator assigned.', false);
        toast('Coordinator assigned successfully!', 'success');
        this.reset();
    } else {
        const msg = data.error || data.email?.[0] || data.detail || 'Failed to assign.';
        showAlert('coordinator-api-message', msg, true);
    }
});

/* ── Problem Statements (Manage Tab) ───────────────── */

// Lazy-load when the Problems tab is shown
document.getElementById('tab-problems-trigger').addEventListener('shown.bs.tab', function() {
    if (currentManageId) fetchProblemStatements(currentManageId);
});

async function fetchProblemStatements(hackathonId) {
    const listEl    = document.getElementById('ps-list');
    const loadingEl = document.getElementById('ps-list-loading');
    const emptyEl   = document.getElementById('ps-list-empty');

    listEl.innerHTML = '';
    loadingEl.style.display = 'block';
    emptyEl.style.display   = 'none';

    const res = await apiRequest(`/api/organizer/hackathons/${hackathonId}/problem-statements/`);
    loadingEl.style.display = 'none';

    if (!res) return;
    const data = await res.json().catch(() => []);
    const list = Array.isArray(data) ? data : (data.results || []);

    if (!list.length) {
        emptyEl.style.display = 'block';
        return;
    }

    list.forEach(ps => {
        const card = document.createElement('div');
        card.className = 'ps-card';
        card.innerHTML = `
            <div class="ps-card-header">
                <div class="ps-card-title">${escapeHtml(ps.title)}</div>
                <span class="status-badge ${ps.is_active ? 'status-PUBLISHED' : 'status-DRAFT'}">
                    ${ps.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <p class="ps-card-desc">${escapeHtml(ps.description || '')}</p>
            <div class="ps-card-meta">
                ${ps.pdf_file_url ? `<a href="${ps.pdf_file_url}" target="_blank" class="ps-pdf-link"><i class="fas fa-file-pdf me-1"></i>View PDF</a>` : ''}
                <span class="meta-item"><i class="fas fa-users me-1"></i>${ps.max_team_allowed ? ps.max_team_allowed + ' teams max' : 'Unlimited'}</span>
            </div>
            <div class="ps-card-actions">
                <button class="btn-ps-toggle" onclick="toggleProblemActive('${hackathonId}', ${ps.id}, ${!ps.is_active})">
                    <i class="fas fa-${ps.is_active ? 'eye-slash' : 'eye'} me-1"></i>${ps.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-ps-delete" onclick="deleteProblem('${hackathonId}', ${ps.id})">
                    <i class="fas fa-trash-alt me-1"></i>Delete
                </button>
            </div>`;
        listEl.appendChild(card);
    });
}

// Add Problem Statement
document.getElementById('add-ps-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentManageId) return;

    const btn     = document.getElementById('add-ps-btn');
    const btnText = document.getElementById('add-ps-btn-text');
    const btnSpin = document.getElementById('add-ps-btn-spinner');

    // Quick client-side PDF check
    const fileInput = this.elements['pdf_file'];
    if (fileInput.files.length && !fileInput.files[0].name.toLowerCase().endsWith('.pdf')) {
        showAlert('ps-api-message', 'Only PDF files are allowed.', true);
        return;
    }

    btnText.classList.add('d-none');
    btnSpin.classList.remove('d-none');
    btn.disabled = true;

    const fd = new FormData(this);

    // Use raw fetch with auth header (no Content-Type — browser sets multipart boundary)
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/organizer/hackathons/${currentManageId}/problem-statements/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
    }).catch(() => null);

    btnText.classList.remove('d-none');
    btnSpin.classList.add('d-none');
    btn.disabled = false;

    if (!res) { toast('Network error.', 'error'); return; }
    if (res.status === 401) { localStorage.removeItem('access_token'); window.location.replace('/accounts/login/'); return; }

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
        this.reset();
        toast('Problem statement added!', 'success');
        fetchProblemStatements(currentManageId);
        document.getElementById('ps-api-message').className = 'form-alert mb-3 d-none';
    } else {
        const firstErr = Object.values(data)?.[0];
        const msg = (Array.isArray(firstErr) ? firstErr[0] : firstErr) || data.detail || 'Failed to add problem statement.';
        showAlert('ps-api-message', msg, true);
    }
});

async function toggleProblemActive(hackathonId, psId, newState) {
    const res = await apiRequest(`/api/organizer/hackathons/${hackathonId}/problem-statements/${psId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newState })
    });
    if (!res) return;
    if (res.ok) {
        toast(newState ? 'Problem activated.' : 'Problem deactivated.', 'success');
        fetchProblemStatements(hackathonId);
    } else {
        toast('Action failed.', 'error');
    }
}

async function deleteProblem(hackathonId, psId) {
    if (!confirm('Delete this problem statement? This cannot be undone.')) return;
    const res = await apiRequest(`/api/organizer/hackathons/${hackathonId}/problem-statements/${psId}/`, {
        method: 'DELETE'
    });
    if (!res) return;
    if (res.ok || res.status === 204) {
        toast('Problem statement deleted.', 'success');
        fetchProblemStatements(hackathonId);
    } else {
        toast('Delete failed.', 'error');
    }
}

/* ── Date & Field Validation ────────────────────────── */
function validateDates(form, alertElId) {
    const alertEl = document.getElementById(alertElId);
    alertEl.className = 'form-alert mb-3 d-none';
    alertEl.textContent = '';

    // Clear any previous per-field highlights
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const regStart  = form.elements['registration_start'].value;
    const regEnd    = form.elements['registration_deadline'].value;
    const evtStart  = form.elements['start_date'].value;
    const evtEnd    = form.elements['end_date'].value;
    const minTeam   = parseInt(form.elements['min_team_size'].value, 10);
    const maxTeam   = parseInt(form.elements['max_team_size'].value, 10);
    const maxTeamsEl = form.elements['max_teams'];
    const maxTeams  = maxTeamsEl ? parseInt(maxTeamsEl.value, 10) : 0;

    const errors = [];

    // Required check
    if (!regStart || !regEnd || !evtStart || !evtEnd) {
        errors.push('All date fields are required.');
    }

    const rs = new Date(regStart);
    const re = new Date(regEnd);
    const es = new Date(evtStart);
    const ee = new Date(evtEnd);

    // Registration Start must be before Registration Close
    if (regStart && regEnd && rs >= re) {
        errors.push('Registration Open date must be before Registration Close date.');
        markInvalid(form, 'registration_start');
        markInvalid(form, 'registration_deadline');
    }

    // Registration Close must be before or equal to Event Start
    if (regEnd && evtStart && re > es) {
        errors.push('Registration Close date must not be after Event Start date.');
        markInvalid(form, 'registration_deadline');
        markInvalid(form, 'start_date');
    }

    // Event Start must be before Event End
    if (evtStart && evtEnd && es >= ee) {
        errors.push('Event Start date must be before Event End date.');
        markInvalid(form, 'start_date');
        markInvalid(form, 'end_date');
    }

    // Registration Start must be before Event Start
    if (regStart && evtStart && rs >= es) {
        errors.push('Registration Open date must be before Event Start date.');
        markInvalid(form, 'registration_start');
        markInvalid(form, 'start_date');
    }

    // Registration Start must be before Event End
    if (regStart && evtEnd && rs >= ee) {
        errors.push('Registration Open date must be before Event End date.');
        markInvalid(form, 'registration_start');
        markInvalid(form, 'end_date');
    }

    // Min Team Size ≤ Max Team Size
    if (!isNaN(minTeam) && !isNaN(maxTeam) && minTeam > maxTeam) {
        errors.push('Min Team Size cannot be greater than Max Team Size.');
        markInvalid(form, 'min_team_size');
        markInvalid(form, 'max_team_size');
    }

    // Min Team Size ≥ 1
    if (!isNaN(minTeam) && minTeam < 1) {
        errors.push('Min Team Size must be at least 1.');
        markInvalid(form, 'min_team_size');
    }

    // Max Teams ≥ 0
    if (!isNaN(maxTeams) && maxTeams < 0) {
        errors.push('Max Teams cannot be negative.');
        markInvalid(form, 'max_teams');
    }

    if (errors.length) {
        alertEl.className = 'form-alert error mb-3';
        alertEl.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
        alertEl.classList.remove('d-none');
        return false;
    }
    return true;
}

function markInvalid(form, fieldName) {
    const el = form.elements[fieldName];
    if (el) el.classList.add('is-invalid');
}

/* ── Create Hackathon ───────────────────────────────── */
document.getElementById('create-hackathon-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Run validation first
    if (!validateDates(this, 'create-api-message')) return;

    const submitBtn  = document.getElementById('create-submit-btn');
    const btnText    = document.getElementById('create-btn-text');
    const btnSpinner = document.getElementById('create-btn-spinner');

    btnText.classList.add('d-none');
    btnSpinner.classList.remove('d-none');
    submitBtn.disabled = true;

    const fd = new FormData(this);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    body['certificates_enabled'] = this.elements['certificates_enabled'].checked;

    const res = await apiRequest('/api/organizer/hackathons/', {
        method: 'POST',
        body: JSON.stringify(body)
    });

    btnText.classList.remove('d-none');
    btnSpinner.classList.add('d-none');
    submitBtn.disabled = false;

    if (!res) return;
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('createHackathonModal')).hide();
        this.reset();
        toast('Hackathon created successfully!', 'success');
        fetchHackathons();
    } else {
        const alertEl = document.getElementById('create-api-message');
        const firstErr = Object.values(data)?.[0];
        const msg = (Array.isArray(firstErr) ? firstErr[0] : firstErr) || data.detail || 'Failed to create hackathon.';
        alertEl.className = 'form-alert error';
        alertEl.textContent = msg;
        alertEl.classList.remove('d-none');
    }
});

/* ── Sidebar toggle (mobile) ────────────────────────── */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* ── Details Modal ──────────────────────────────────── */
function openDetailsModal(id) {
    const h = hackathonCache[id];
    if (!h) return;

    const statusLabel = { draft: 'Draft', published: 'Published', ongoing: 'Ongoing', completed: 'Completed' }[h.status?.toLowerCase()] || h.status;
    const regLabel    = { upcoming: 'Upcoming', open: 'Open', closed: 'Closed' }[h.registration_status?.toLowerCase()] || h.registration_status || '—';

    document.getElementById('detail-name').textContent       = h.name || '—';
    document.getElementById('detail-status').textContent     = statusLabel;
    document.getElementById('detail-status').className       = `status-badge status-${(h.status||'DRAFT').toUpperCase()}`;
    document.getElementById('detail-reg-status').textContent = regLabel;
    document.getElementById('detail-description').textContent = h.description || '—';
    document.getElementById('detail-reg-start').textContent  = fmt(h.registration_start);
    document.getElementById('detail-reg-end').textContent    = fmt(h.registration_deadline);
    document.getElementById('detail-start').textContent      = fmt(h.start_date);
    document.getElementById('detail-end').textContent        = fmt(h.end_date);
    document.getElementById('detail-team-size').textContent  = `${h.min_team_size} – ${h.max_team_size} members`;
    document.getElementById('detail-max-teams').textContent  = h.max_teams ? h.max_teams : 'Unlimited';
    document.getElementById('detail-certs').textContent      = h.certificates_enabled ? 'Enabled' : 'Disabled';
    document.getElementById('detail-created').textContent    = fmt(h.created_at);
    document.getElementById('detail-updated').textContent    = fmt(h.updated_at);

    // Store id for the Update button
    document.getElementById('detail-update-btn').dataset.hackathonId = id;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('detailsModal')).show();
}

/* ── Update Modal ────────────────────────────────────── */
function openUpdateModal(id) {
    const h = hackathonCache[id];
    if (!h) return;

    // Close details modal first
    bootstrap.Modal.getInstance(document.getElementById('detailsModal'))?.hide();

    // Pre-fill form
    const f = document.getElementById('update-hackathon-form');
    f.elements['name'].value                  = h.name || '';
    f.elements['description'].value           = h.description || '';
    f.elements['registration_start'].value    = toDatetimeLocal(h.registration_start);
    f.elements['registration_deadline'].value = toDatetimeLocal(h.registration_deadline);
    f.elements['start_date'].value            = toDatetimeLocal(h.start_date);
    f.elements['end_date'].value              = toDatetimeLocal(h.end_date);
    f.elements['min_team_size'].value         = h.min_team_size ?? 1;
    f.elements['max_team_size'].value         = h.max_team_size ?? 4;
    f.elements['max_teams'].value             = h.max_teams ?? 0;
    f.elements['certificates_enabled'].checked = !!h.certificates_enabled;

    document.getElementById('update-hackathon-id').value       = id;
    document.getElementById('update-api-message').className   = 'form-alert mb-3 d-none';
    document.getElementById('update-api-message').textContent = '';
    document.getElementById('updateHackathonModal').querySelector('.modal-title').textContent = 'Update — ' + (h.name || 'Hackathon');

    // Show update modal after details is fully hidden
    document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function onHidden() {
        this.removeEventListener('hidden.bs.modal', onHidden);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('updateHackathonModal')).show();
    }, { once: true });
}

function toDatetimeLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    // Format as YYYY-MM-DDTHH:MM
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById('detail-update-btn').addEventListener('click', function() {
    openUpdateModal(this.dataset.hackathonId);
});

/* ── Update Form Submit ──────────────────────────────── */
document.getElementById('update-hackathon-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Run validation first
    if (!validateDates(this, 'update-api-message')) return;

    const submitBtn  = document.getElementById('update-submit-btn');
    const btnText    = document.getElementById('update-btn-text');
    const btnSpinner = document.getElementById('update-btn-spinner');

    btnText.classList.add('d-none');
    btnSpinner.classList.remove('d-none');
    submitBtn.disabled = true;

    const hackathonId = document.getElementById('update-hackathon-id').value;
    const fd   = new FormData(this);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    body['certificates_enabled'] = this.elements['certificates_enabled'].checked;

    const res = await apiRequest(`/api/organizer/hackathons/${hackathonId}/`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });

    btnText.classList.remove('d-none');
    btnSpinner.classList.add('d-none');
    submitBtn.disabled = false;

    if (!res) return;
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
        hackathonCache[hackathonId] = data;  // refresh cache
        bootstrap.Modal.getInstance(document.getElementById('updateHackathonModal')).hide();
        toast('Hackathon updated successfully!', 'success');
        fetchHackathons();
    } else {
        const alertEl  = document.getElementById('update-api-message');
        const firstErr = Object.values(data)?.[0];
        const msg = (Array.isArray(firstErr) ? firstErr[0] : firstErr) || data.detail || 'Failed to update hackathon.';
        alertEl.className = 'form-alert error mb-3';
        alertEl.textContent = msg;
        alertEl.classList.remove('d-none');
    }
});

/* ── Boot ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', fetchHackathons);
