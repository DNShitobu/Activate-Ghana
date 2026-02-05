(() => {
  const form = document.getElementById('reset-form');
  const statusEl = document.getElementById('status');
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  const token = params.get('token');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';

  if (!form || !statusEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password')?.value || '';
    const confirm = document.getElementById('confirm')?.value || '';
    if (password !== confirm) {
      statusEl.textContent = 'Passwords do not match.';
      return;
    }
    fetch(`${API_BASE}/auth/password/reset/confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, password }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        statusEl.textContent = ok ? 'Password updated. You can log in now.' : (data.detail || 'Reset failed.');
      })
      .catch(() => {
        statusEl.textContent = 'Reset failed. Please try again.';
      });
  });
})();
