(() => {
  const statusEl = document.getElementById('status');
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';

  if (!statusEl) return;
  if (!token) {
    statusEl.textContent = 'Missing token. Please request a new verification email.';
    return;
  }
  fetch(`${API_BASE}/auth/email/verify/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      statusEl.textContent = ok ? 'Email verified successfully.' : (data.detail || 'Verification failed.');
    })
    .catch(() => {
      statusEl.textContent = 'Verification failed. Please try again.';
    });
})();
