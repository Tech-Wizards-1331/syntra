function showApiMessage(message, isError) {
    const box = document.getElementById('api-message');
    if (!box) {
        return;
    }
    box.style.display = 'block';
    box.className = isError ? 'auth-msg auth-msg-error' : 'auth-msg auth-msg-success';
    box.textContent = message;
}

function parseError(payload) {
    if (!payload || typeof payload !== 'object') {
        return 'Something went wrong. Please try again.';
    }

    if (payload.detail && typeof payload.detail === 'string') {
        return payload.detail;
    }

    const firstKey = Object.keys(payload)[0];
    if (!firstKey) {
        return 'Something went wrong. Please try again.';
    }

    const value = payload[firstKey];
    if (Array.isArray(value) && value.length) {
        return String(value[0]);
    }
    if (typeof value === 'string') {
        return value;
    }

    return 'Something went wrong. Please try again.';
}

function storeTokens(payload) {
    const tokens = payload && payload.tokens;
    if (!tokens) {
        return;
    }
    if (tokens.access) {
        localStorage.setItem('access_token', tokens.access);
    }
    if (tokens.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
    }
}

function handleLoginSuccess(payload, nextUrl) {
    const user = payload.user || {};
    if (nextUrl) {
        window.location.href = nextUrl;
        return;
    }

    if (!user.role) {
        window.location.href = '/accounts/select-role/';
        return;
    }

    if (!user.is_profile_complete) {
        window.location.href = '/accounts/complete-profile/';
        return;
    }

    window.location.href = '/accounts/social-redirect/';
}

async function submitAuthForm(form, isSignup) {
    const apiUrl = form.dataset.apiUrl;
    const formData = Object.fromEntries(new FormData(form).entries());
    let data;

    if (isSignup) {
        data = {
            full_name: formData.full_name || '',
            email: formData.email || '',
            password: formData.password1 || '',
            password2: formData.password2 || '',
        };
    } else {
        data = {
            email: formData.email || '',
            password: formData.password || '',
        };
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        showApiMessage(parseError(payload), true);
        return;
    }

    storeTokens(payload);

    if (isSignup) {
        showApiMessage('Account created. Please complete your role selection.', false);
        window.location.href = '/accounts/select-role/';
        return;
    }

    const nextInput = form.querySelector('input[name="next"]');
    const nextUrl = nextInput ? nextInput.value : '';
    handleLoginSuccess(payload, nextUrl);
}

function setupAuthApi() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitAuthForm(loginForm, false);
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitAuthForm(signupForm, true);
        });
    }
}

document.addEventListener('DOMContentLoaded', setupAuthApi);
