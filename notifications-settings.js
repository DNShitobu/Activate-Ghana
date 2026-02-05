(() => {
  const API_BASE = (window.API_BASE || 'http://127.0.0.1:8001/api').replace(/\/api$/, '');
  const token = localStorage.getItem('jwt_access');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  const apiGet = (url) => fetch(API_BASE + url, { headers: authHeaders }).then(r => r.ok ? r.json() : Promise.reject());
  const apiPatch = (url, body) => fetch(API_BASE + url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(body) });
  const emailEl = document.getElementById('email-enabled');
  const pushEl = document.getElementById('push-enabled');

  if (!emailEl || !pushEl) return;
  apiGet('/api/notification-prefs/1/').then(d => {
    emailEl.checked = d.email_enabled;
    pushEl.checked = d.push_enabled;
  }).catch(() => {});

  const saveBtn = document.getElementById('save-prefs');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      apiPatch('/api/notification-prefs/1/', { email_enabled: emailEl.checked, push_enabled: pushEl.checked });
    });
  }
})();
