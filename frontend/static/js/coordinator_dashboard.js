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

    el.className = `toast-notification toast-${type}`;
    el.innerHTML = `<i class="fas ${icon} me-2"></i>${msg}`;
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, duration);
}

/* ── Responsibility Label Mapping ───────────────────── */
const RESPONSIBILITY_LABELS = {
    'PROBLEM_STATEMENTS': { label: 'Problem Statements', icon: 'fa-file-alt', color: '#00d4aa' },
    'ANALYTICS': { label: 'Analytics', icon: 'fa-chart-bar', color: '#fbbf24' },
    'TEAM_MANAGEMENT': { label: 'Team Management', icon: 'fa-users', color: '#818cf8' },
};

/* ── Dashboard Data Fetcher ─────────────────────────── */
async function loadDashboard() {
    const res = await apiRequest('/api/organizer/hackathons/coordinator_dashboard/');
    if (!res) return;

    const data = await res.json();

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
    statTeams.textContent = '—'; // Placeholder until teams feature is built

    if (data.length === 0) {
        emptyState.style.display = '';
        hackathonList.innerHTML = '';
        return;
    }

    // Hide empty state, show hackathon cards
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
        const statusClass = h.status === 'published' ? 'badge-published'
                          : h.status === 'ongoing'   ? 'badge-ongoing'
                          : h.status === 'completed'  ? 'badge-completed'
                          : 'badge-draft';

        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="hackathon-card">
                <div class="hackathon-card-header">
                    <h3 class="hackathon-card-title">${h.name}</h3>
                    <span class="status-badge ${statusClass}">${h.status}</span>
                </div>
                <p class="hackathon-card-desc">${h.description ? h.description.substring(0, 100) + (h.description.length > 100 ? '…' : '') : 'No description'}</p>
                <div class="hackathon-card-resps">
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
        `;
        hackathonList.appendChild(card);
    });
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadDashboard);
