// Lightweight auth wiring to Django API with JWT storage.
// Configure API base URL here:
const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';
const USE_LIVE = new URLSearchParams(window.location.search).get('data') === 'live';

const endpoints = {
  login: `${API_BASE}/auth/login/`,
  loginEmail: `${API_BASE}/auth/login-email/`,
  signup: `${API_BASE}/auth/signup/`,
  adminLogin: `${API_BASE}/auth/admin/login/`,
  adminLoginEmail: `${API_BASE}/auth/admin/login-email/`,
  refresh: `${API_BASE}/auth/jwt/refresh/`,
  passwordReset: `${API_BASE}/auth/password/reset/`,
  resendVerify: `${API_BASE}/auth/email/verify/`,
  passwordResetConfirm: `${API_BASE}/auth/password/reset/confirm/`,
  oauthGoogle: `${API_BASE}/auth/oauth/google/start`,
  oauthLinkedIn: `${API_BASE}/auth/oauth/linkedin/start`,
  profile: `${API_BASE}/me/`,
  postJob: `${API_BASE}/jobs/`,
  onboarding: `${API_BASE}/experts/onboarding/`,
};

const storage = {
  save(tokens, role, username) {
    if (tokens?.access) localStorage.setItem('jwt_access', tokens.access);
    if (tokens?.refresh) localStorage.setItem('jwt_refresh', tokens.refresh);
    if (role) localStorage.setItem('user_role', role);
    if (username) localStorage.setItem('user_name', username);
  },
  clear() {
    ['jwt_access', 'jwt_refresh', 'user_role', 'user_name'].forEach(k => localStorage.removeItem(k));
  },
  access() { return localStorage.getItem('jwt_access'); },
  role() { return localStorage.getItem('user_role'); },
  username() { return localStorage.getItem('user_name'); },
};

function getNextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next) return null;
  if (next.startsWith('http://') || next.startsWith('https://')) return null;
  return next;
}

async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  const token = storage.access();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

function showToast(msg, variant = 'info') {
  const el = document.createElement('div');
  el.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white ${variant === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function bindLogin(formId, roleTarget) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitRole = e.submitter?.dataset?.role;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    // normalize identifier/admin fields to username for API
    if (payload.identifier) {
      payload.username = payload.identifier;
      delete payload.identifier;
    }
    if (payload["admin-username"]) {
      payload.username = payload["admin-username"];
      delete payload["admin-username"];
    }
    if (payload["admin-password"]) {
      payload.password = payload["admin-password"];
      delete payload["admin-password"];
    }
    const role = submitRole || roleTarget || 'client';
    const isEmail = typeof payload.username === 'string' && payload.username.includes('@');
    const endpoint = role === 'admin'
      ? (isEmail ? endpoints.adminLoginEmail : endpoints.adminLogin)
      : (isEmail ? endpoints.loginEmail : endpoints.login);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      storage.save(data, role, data.username || payload.username);
      showToast('Logged in');
      const dest = role === 'admin'
        ? 'admin-dashboard.html'
        : (role === 'expert' || fd.get('role') === 'expert') ? 'dashboard-expert.html' : 'dashboard.html';
      window.location.href = getNextPath() || dest;
    } catch (err) {
      showToast(err.message || 'Login error', 'error');
    }
  });
}

function bindSignup(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    // map to backend expectations
    const rawRole = fd.get('role') || '';
    const role = rawRole.toLowerCase().includes('expert') ? 'expert' : 'client';
    payload.username = payload.name || payload.contact || payload.username;
    if (payload.contact && payload.contact.includes('@')) {
      payload.email = payload.contact;
    }
    if (!payload.email) payload.email = `${payload.username || 'user'}@example.com`;
    payload.role = role;
    if (payload.confirm && payload.password !== payload.confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch(endpoints.signup, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Sign up failed');
      const data = await res.json();
      storage.save(data, role, data.username || payload.username);
      showToast('Account created');
      const dest = role === 'expert' ? 'dashboard-expert.html' : 'dashboard.html';
      window.location.href = getNextPath() || dest;
    } catch (err) {
      showToast(err.message || 'Signup error', 'error');
    }
  });
}

function bindPasswordReset(linkId) {
  const link = document.getElementById(linkId);
  if (!link) return;
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your email for reset link:');
    if (!email) return;
    try {
      const res = await fetch(endpoints.passwordReset, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error('Reset failed');
      showToast('Reset email sent');
    } catch (err) {
      showToast(err.message || 'Reset error', 'error');
    }
  });
}

function bindResendVerification(linkId) {
  const link = document.getElementById(linkId);
  if (!link) return;
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your email to resend verification:');
    if (!email) return;
    try {
      const res = await fetch(endpoints.resendVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Request failed');
      showToast('Verification email sent');
    } catch (err) {
      showToast(err.message || 'Request failed', 'error');
    }
  });
}

function bindOAuth(buttonId, provider) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const url = provider === 'google' ? endpoints.oauthGoogle : endpoints.oauthLinkedIn;
    window.location.href = url;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindLogin('login-form', 'client');
  bindLogin('admin-login-form', 'admin');
  bindSignup('signup-form');
  bindPasswordReset('forgot-password');
  bindOAuth('google-login', 'google');
  bindOAuth('linkedin-login', 'linkedin');
  bindOAuth('google-login-admin', 'google');
  bindOAuth('linkedin-login-admin', 'linkedin');
  bindOAuth('google-signup', 'google');
  bindOAuth('linkedin-signup', 'linkedin');
  bindResendVerification('resend-verify');
  bindResendVerification('resend-verify-signup');

  // password eye toggles
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    const target = document.getElementById(btn.dataset.togglePassword);
    if (!target) return;
    btn.addEventListener('click', () => {
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? 'Hide' : 'Show';
    });
  });

  // inject stored user context into dashboards/headers if present
  const name = storage.username();
  const role = storage.role();
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name || 'there');
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = role ? `${role[0].toUpperCase()}${role.slice(1)}` : '');
});
