(() => {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access');
  const refresh = params.get('refresh');
  const role = params.get('role');
  const username = params.get('username');
  if (access) localStorage.setItem('jwt_access', access);
  if (refresh) localStorage.setItem('jwt_refresh', refresh);
  if (role) localStorage.setItem('user_role', role);
  if (username) localStorage.setItem('user_name', username);
  const dest = role === 'admin' ? 'admin-dashboard.html' : (role === 'expert' ? 'dashboard-expert.html' : 'dashboard.html');
  const status = document.getElementById('status');
  if (status) status.textContent = 'Signed in. Redirecting…';
  setTimeout(() => { window.location.href = dest; }, 800);
})();
