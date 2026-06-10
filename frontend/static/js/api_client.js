/**
 * Central API Client for Syntra
 * Handles attaching CSRF tokens to requests and intercepts 401 Unauthorized
 * to attempt a transparent token refresh.
 */

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    
    // Auto-attach CSRF token for mutating requests
    const method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            options.headers['X-CSRFToken'] = csrfToken;
        }
    }
    
    // Ensure credentials (cookies) are sent
    options.credentials = 'same-origin';
    
    let response = await fetch(url, options);
    
    if (response.status === 401) {
        // Attempt refresh
        const refreshResponse = await fetch('/api/auth/refresh/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        if (refreshResponse.ok) {
            // Retry original request
            response = await fetch(url, options);
        } else {
            // Refresh failed, redirect to login
            window.location.href = '/accounts/login/';
        }
    }
    
    return response;
}

async function handleLogout() {
    await fetchWithAuth('/api/auth/logout/', {
        method: 'POST',
    });
    window.location.href = '/accounts/login/';
}

// Bind logout links automatically if they have class 'logout-btn'
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.logout-btn, a[href="/accounts/logout/"]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });
});
