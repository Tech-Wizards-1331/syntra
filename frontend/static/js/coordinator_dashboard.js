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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function fmt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Responsibility Label Mapping ───────────────────── */
const RESPONSIBILITY_LABELS = {
    'PROBLEM_STATEMENTS': { label: 'Problem Statements', icon: 'fa-file-alt', color: '#00d4aa' },
    'ANALYTICS': { label: 'Analytics', icon: 'fa-chart-bar', color: '#fbbf24' },
    'TEAM_MANAGEMENT': { label: 'Team Management', icon: 'fa-users', color: '#818cf8' },
};

/* ── Dashboard State ────────────────────────────────── */
let dashboardData = [];
let currentManageId = null;

/* ── Dashboard Data Fetcher ─────────────────────────── */
async function loadDashboard() {
    const res = await apiRequest('/api/organizer/hackathons/coordinator_dashboard/');
    if (!res) return;

    const data = await res.json();
    dashboardData = data;

    const statHackathons = document.getElementById('stat-hackathons');
    const statProblemStatements = document.getElementById('stat-problem-statements');
    const statTeams = document.getElementById('stat-teams');
    const hackathonList = document.getElementById('hackathon-list');
    const emptyState = document.getElementById('empty-state');

    // Update stat cards
    statHackathons.textContent = data.length;

    let totalPS = 0;
    data.forEach(entry => {
        totalPS += entry.stats.problem_statements_count || 0;
    });
    statProblemStatements.textContent = totalPS;
    statTeams.textContent = '—';

    if (data.length === 0) {
        emptyState.style.display = '';
        hackathonList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    hackathonList.innerHTML = '';

    data.forEach(entry => {
        const h = entry.hackathon;
        const resps = entry.responsibilities || [];
        const stats = entry.stats || {};

        // Build responsibility badges
        const badges = resps.map(r => {
            const meta = RESPONSIBILITY_LABELS[r] || { label: r, icon: 'fa-tag', color: '#666' };
            return `<span class="resp-badge" style="--badge-color: ${meta.color}">
                        <i class="fas ${meta.icon} me-1"></i>${meta.label}
                    </span>`;
        }).join('');

        // Status badge
        const statusLabel = { DRAFT: 'Draft', PUBLISHED: 'Published', ONGOING: 'Ongoing', COMPLETED: 'Completed' }[h.status] || h.status || 'Draft';
        const statusClass = `status-${h.status || 'DRAFT'}`;

        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="hackathon-card">
                <div class="card-top-bar"></div>
                <div class="card-body-inner">
                    <div class="card-header-row">
                        <h4 class="hackathon-title">${escapeHtml(h.name)}</h4>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <p class="hackathon-desc">${escapeHtml(h.description || '').substring(0, 100)}${(h.description || '').length > 100 ? '…' : ''}</p>
                    <div class="hackathon-card-resps mb-2">
                        <small class="text-muted d-block mb-1">Your Responsibilities</small>
                        ${badges || '<span class="text-muted">None assigned</span>'}
                    </div>
                    <div class="hackathon-card-stats">
                        <div class="mini-stat">
                            <i class="fas fa-file-alt"></i>
                            <span>${stats.problem_statements_count || 0} Problem Statements</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer-inner">
                    <button class="btn-card-details" onclick="openDetailsModal('${h.id}')">
                        <i class="fas fa-info-circle me-2"></i>Details
                    </button>
                    <button class="btn-card-manage" onclick="openManageModal('${h.id}')">
                        <i class="fas fa-cog me-2"></i>Manage
                    </button>
                </div>
            </div>`;
        hackathonList.appendChild(card);
    });
}

/* ── Details Modal ──────────────────────────────────── */
async function openDetailsModal(hackathonId) {
    const res = await apiRequest(`/api/organizer/hackathons/${hackathonId}/`);
    if (!res) return;
    const h = await res.json();

    document.getElementById('detail-name').textContent = h.name;
    document.getElementById('detail-description').textContent = h.description || '—';

    const statusLabel = { DRAFT: 'Draft', PUBLISHED: 'Published', ONGOING: 'Ongoing', COMPLETED: 'Completed' }[h.status] || h.status || 'Draft';
    const detStatus = document.getElementById('detail-status');
    detStatus.textContent = statusLabel;
    detStatus.className = `status-badge status-${h.status || 'DRAFT'}`;

    document.getElementById('detail-reg-start').textContent = fmt(h.registration_start);
    document.getElementById('detail-reg-end').textContent = fmt(h.registration_deadline);
    document.getElementById('detail-start').textContent = fmt(h.start_date);
    document.getElementById('detail-end').textContent = fmt(h.end_date);
    document.getElementById('detail-team-size').textContent = `${h.min_team_size} – ${h.max_team_size}`;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('detailsModal')).show();
}

/* ── Manage Modal ───────────────────────────────────── */
function openManageModal(hackathonId) {
    currentManageId = hackathonId;
    document.getElementById('manage-hackathon-id').value = hackathonId;

    // Find the entry from cached data
    const entry = dashboardData.find(e => String(e.hackathon.id) === String(hackathonId));
    const resps = entry ? entry.responsibilities : [];
    const hName = entry ? entry.hackathon.name : 'Hackathon';

    document.getElementById('manageModalLabel').textContent = hName;

    // Build tabs dynamically based on assigned responsibilities
    const tabsContainer = document.getElementById('manageTabs');
    const tabContent = document.getElementById('manageTabContent');
    tabsContainer.innerHTML = '';
    tabContent.innerHTML = '';

    let first = true;

    if (resps.includes('PROBLEM_STATEMENTS')) {
        tabsContainer.innerHTML += `
            <li class="nav-item">
                <a class="nav-link ${first ? 'active' : ''}" data-bs-toggle="tab" href="#tab-problems" id="tab-problems-trigger">
                    <i class="fas fa-file-alt me-1"></i>Problem Statements
                </a>
            </li>`;
        tabContent.innerHTML += buildProblemsTab(first);
        first = false;
    }

    if (resps.includes('ANALYTICS')) {
        tabsContainer.innerHTML += `
            <li class="nav-item">
                <a class="nav-link ${first ? 'active' : ''}" data-bs-toggle="tab" href="#tab-analytics" id="tab-analytics-trigger">
                    <i class="fas fa-chart-bar me-1"></i>Analytics
                </a>
            </li>`;
        tabContent.innerHTML += buildAnalyticsTab(first);
        first = false;
    }

    if (resps.includes('TEAM_MANAGEMENT')) {
        tabsContainer.innerHTML += `
            <li class="nav-item">
                <a class="nav-link ${first ? 'active' : ''}" data-bs-toggle="tab" href="#tab-teams" id="tab-teams-trigger">
                    <i class="fas fa-users me-1"></i>Teams
                </a>
            </li>`;
        tabContent.innerHTML += buildTeamsTab(first);
        first = false;
    }

    if (tabsContainer.innerHTML === '') {
        tabContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-lock" style="font-size:2rem;color:#94a3b8;"></i>
                <p class="text-muted mt-3">No responsibilities assigned for this hackathon.</p>
            </div>`;
    }

    // Wire up problem statements tab event
    const psTrigger = document.getElementById('tab-problems-trigger');
    if (psTrigger) {
        // Load immediately if it's the first tab
        if (resps.indexOf('PROBLEM_STATEMENTS') === 0) {
            fetchProblemStatements(hackathonId);
        }
        psTrigger.addEventListener('shown.bs.tab', function() {
            fetchProblemStatements(hackathonId);
        });
    }

    // Wire up add problem form
    setTimeout(() => {
        const addPsForm = document.getElementById('add-ps-form');
        if (addPsForm) {
            addPsForm.onsubmit = async function(e) {
                e.preventDefault();
                await addProblemStatement(this);
            };
        }
    }, 100);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('manageModal')).show();
}

/* ── Tab Builders ───────────────────────────────────── */
function buildProblemsTab(isActive) {
    return `
        <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="tab-problems">
            <div id="ps-api-message" class="form-alert mb-3 d-none"></div>

            <div id="ps-list-loading" class="text-center py-3" style="display:none;">
                <i class="fas fa-circle-notch fa-spin me-2"></i>Loading...
            </div>
            <div id="ps-list-empty" class="text-center py-4" style="display:none;">
                <div class="empty-icon-wrap" style="width:48px;height:48px;border-radius:12px;margin:0 auto 12px;font-size:1.2rem;">
                    <i class="fas fa-file-alt"></i>
                </div>
                <p class="text-muted small mb-0">No problem statements yet. Add one below.</p>
            </div>
            <div id="ps-list" class="ps-card-list mb-4"></div>

            <div class="form-section-label">Add Problem Statement</div>
            <form id="add-ps-form" enctype="multipart/form-data" novalidate>
                <div class="mb-3">
                    <label class="form-label">Title <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="title" required placeholder="e.g. AI-Powered Healthcare">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description <span class="text-danger">*</span></label>
                    <textarea class="form-control" name="description" rows="2" required placeholder="Describe the problem..."></textarea>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label">PDF File <span class="text-danger">*</span></label>
                        <input type="file" class="form-control" name="pdf_file" accept=".pdf" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Max Teams <span class="text-muted" style="font-size:0.75rem">(0 = unlimited)</span></label>
                        <input type="number" class="form-control" name="max_team_allowed" value="0" min="0">
                    </div>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn create-btn" id="add-ps-btn">
                        <span id="add-ps-btn-text"><i class="fas fa-plus me-2"></i>Add Problem</span>
                        <span id="add-ps-btn-spinner" class="d-none"><i class="fas fa-circle-notch fa-spin me-2"></i>Adding...</span>
                    </button>
                </div>
            </form>
        </div>`;
}

function buildAnalyticsTab(isActive) {
    return `
        <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="tab-analytics">
            <div class="text-center py-5">
                <i class="fas fa-chart-bar" style="font-size:2rem;color:#fbbf24;"></i>
                <h5 class="mt-3" style="color:#e2e8f0;">Analytics</h5>
                <p class="text-muted">Analytics dashboard coming soon.</p>
            </div>
        </div>`;
}

function buildTeamsTab(isActive) {
    return `
        <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="tab-teams">
            <div class="text-center py-5">
                <i class="fas fa-users" style="font-size:2rem;color:#818cf8;"></i>
                <h5 class="mt-3" style="color:#e2e8f0;">Team Management</h5>
                <p class="text-muted">Team management dashboard coming soon.</p>
            </div>
        </div>`;
}

/* ── Problem Statements CRUD ────────────────────────── */
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

async function addProblemStatement(formEl) {
    if (!currentManageId) return;

    const btn     = document.getElementById('add-ps-btn');
    const btnText = document.getElementById('add-ps-btn-text');
    const btnSpin = document.getElementById('add-ps-btn-spinner');

    const fileInput = formEl.elements['pdf_file'];
    if (fileInput.files.length && !fileInput.files[0].name.toLowerCase().endsWith('.pdf')) {
        showAlert('ps-api-message', 'Only PDF files are allowed.', true);
        return;
    }

    btnText.classList.add('d-none');
    btnSpin.classList.remove('d-none');
    btn.disabled = true;

    const fd = new FormData(formEl);
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
        formEl.reset();
        toast('Problem statement added!', 'success');
        fetchProblemStatements(currentManageId);
        const msgEl = document.getElementById('ps-api-message');
        if (msgEl) { msgEl.className = 'form-alert mb-3 d-none'; }
    } else {
        const firstErr = Object.values(data)?.[0];
        const msg = (Array.isArray(firstErr) ? firstErr[0] : firstErr) || data.detail || 'Failed to add problem statement.';
        showAlert('ps-api-message', msg, true);
    }
}

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

function showAlert(elId, msg, isError) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = `form-alert mb-3 ${isError ? 'error' : 'success'}`;
    el.textContent = msg;
    el.classList.remove('d-none');
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadDashboard);
