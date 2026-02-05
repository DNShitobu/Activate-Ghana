(() => {
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';
  const token = localStorage.getItem('jwt_access');
  const role = localStorage.getItem('user_role');

  if (!token || role !== 'admin') {
    window.location.href = 'admin-login.html';
    return;
  }

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const state = { users: [], jobs: [], proposals: [] };
  const milestoneTable = document.getElementById('milestone-table');
  const proposalTable = document.getElementById('table-proposals');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && Array.isArray(payload.results)) return payload.results;
    return [];
  }

  function getRole(user) {
    if (user?.role) return user.role;
    if (user?.is_staff) return 'admin';
    if (user?.is_expert) return 'expert';
    if (user?.is_client) return 'client';
    return 'client';
  }

  function setCounts() {
    const clients = state.users.filter(u => getRole(u) === 'client');
    const experts = state.users.filter(u => getRole(u) === 'expert');
    const countClients = document.getElementById('count-clients');
    const countExperts = document.getElementById('count-experts');
    const countJobs = document.getElementById('count-jobs');
    if (countClients) countClients.textContent = clients.length;
    if (countExperts) countExperts.textContent = experts.length;
    if (countJobs) countJobs.textContent = state.jobs.length;
  }

  function rowUser(u) {
    const label = escapeHtml(u.username || u.name || u.email || 'User');
    const email = escapeHtml(u.email || '');
    return `<tr class="border-b">
      <td class="py-2 px-3">${label}</td>
      <td class="py-2 px-3 text-slate-500">${email}</td>
      <td class="py-2 px-3">
        <button class="text-danger hover:underline" data-action="delete-user" data-id="${u.id}">Remove</button>
      </td>
    </tr>`;
  }

  function rowJob(j) {
    return `<tr class="border-b">
      <td class="py-2 px-3">${escapeHtml(j.title)}</td>
      <td class="py-2 px-3">${escapeHtml(j.budget)}</td>
      <td class="py-2 px-3 text-slate-500">${escapeHtml(j.location || '')}</td>
      <td class="py-2 px-3">
        <button class="text-danger hover:underline" data-action="delete-job" data-id="${j.id}">Remove</button>
      </td>
    </tr>`;
  }

  function rowProposal(p) {
    const jobLabel = escapeHtml(p.job?.title || p.job || 'Job');
    const expertLabel = escapeHtml(p.expert?.name || p.expert || p.expert_name || 'Expert');
    return `<tr class="border-b">
      <td class="py-2 px-3">${jobLabel}</td>
      <td class="py-2 px-3">${expertLabel}</td>
      <td class="py-2 px-3">GHS ${escapeHtml(p.price || 0)}</td>
      <td class="py-2 px-3">${escapeHtml(p.revisions || 1)}</td>
      <td class="py-2 px-3">${escapeHtml(p.state || 'pending')}</td>
      <td class="py-2 px-3 space-x-2">
        <button data-type="pr" data-id="${p.id}" data-state="accepted" class="text-emerald-700 border border-emerald-300 px-2 py-1 rounded text-xs">Accept</button>
        <button data-type="pr" data-id="${p.id}" data-state="declined" class="border border-slate-300 px-2 py-1 rounded text-xs">Decline</button>
        <button data-type="pr" data-id="${p.id}" data-state="counter" class="text-amber-700 border border-amber-300 px-2 py-1 rounded text-xs">Counter</button>
      </td>
    </tr>`;
  }

  function renderTables() {
    const clientFilter = document.getElementById('filter-clients')?.value.toLowerCase() || '';
    const expertFilter = document.getElementById('filter-experts')?.value.toLowerCase() || '';
    const jobFilter = document.getElementById('filter-jobs')?.value.toLowerCase() || '';
    const proposalFilter = document.getElementById('filter-proposals')?.value.toLowerCase() || '';

    const tableClients = document.getElementById('table-clients');
    const tableExperts = document.getElementById('table-experts');
    const tableJobs = document.getElementById('table-jobs');

    if (tableClients) {
      tableClients.innerHTML = state.users
        .filter(u => {
          const name = (u.username || u.name || u.email || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return getRole(u) === 'client' && (!clientFilter || name.includes(clientFilter) || email.includes(clientFilter));
        })
        .map(u => rowUser(u)).join('');
    }

    if (tableExperts) {
      tableExperts.innerHTML = state.users
        .filter(u => {
          const name = (u.username || u.name || u.email || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return getRole(u) === 'expert' && (!expertFilter || name.includes(expertFilter) || email.includes(expertFilter));
        })
        .map(u => rowUser(u)).join('');
    }

    if (tableJobs) {
      tableJobs.innerHTML = state.jobs
        .filter(j => {
          const title = (j.title || '').toLowerCase();
          const location = (j.location || '').toLowerCase();
          const description = (j.description || '').toLowerCase();
          return !jobFilter || title.includes(jobFilter) || location.includes(jobFilter) || description.includes(jobFilter);
        })
        .map(j => rowJob(j)).join('');
    }

    if (proposalTable) {
      proposalTable.innerHTML = state.proposals
        .filter(p => {
          const job = (p.job?.title || p.job || '').toLowerCase();
          const expert = (p.expert?.name || p.expert || p.expert_name || '').toLowerCase();
          return !proposalFilter || job.includes(proposalFilter) || expert.includes(proposalFilter);
        })
        .map(p => rowProposal(p)).join('');
    }

    setCounts();
  }

  function renderMilestones(rows) {
    if (!milestoneTable) return;
    milestoneTable.innerHTML = rows.map(m => `
      <tr class="border-b">
        <td class="px-3 py-2">${escapeHtml(m.title || m.name || 'Milestone')}</td>
        <td class="px-3 py-2">GHS ${escapeHtml(m.amount || m.value || 0)}</td>
        <td class="px-3 py-2">${escapeHtml(m.state || 'pending')}</td>
        <td class="px-3 py-2">${escapeHtml(m.auto_release || m.auto_release_at || '—')}</td>
        <td class="px-3 py-2 space-x-2 text-xs">
          <button data-type="ms" data-id="${m.id}" data-state="approved" class="px-2 py-1 rounded border border-slate-300">Approve</button>
          <button data-type="ms" data-id="${m.id}" data-state="in_dispute" class="px-2 py-1 rounded border border-amber-300 text-amber-700">Dispute</button>
          <button data-type="ms" data-id="${m.id}" data-state="frozen" class="px-2 py-1 rounded border border-red-300 text-red-700">Freeze</button>
          <button data-type="ms" data-id="${m.id}" data-state="partial_release" class="px-2 py-1 rounded border border-emerald-300 text-emerald-700">Release partial</button>
        </td>
      </tr>
    `).join('');
  }

  async function fetchUsers() {
    const res = await fetch(`${API_BASE}/users/`, { headers });
    if (!res.ok) throw new Error('Failed to load users');
    state.users = normalizeList(await res.json());
    renderTables();
  }

  async function fetchJobs() {
    const res = await fetch(`${API_BASE}/jobs/`, { headers });
    if (!res.ok) throw new Error('Failed to load jobs');
    state.jobs = normalizeList(await res.json());
    renderTables();
  }

  async function fetchProposals() {
    if (!proposalTable) return;
    const res = await fetch(`${API_BASE}/proposals/`, { headers });
    if (!res.ok) throw new Error('Failed to load proposals');
    state.proposals = normalizeList(await res.json());
    renderTables();
  }

  async function fetchMilestones() {
    if (!milestoneTable) return;
    const res = await fetch(`${API_BASE}/milestones/`, { headers });
    if (!res.ok) throw new Error('Failed to load milestones');
    const payload = normalizeList(await res.json());
    renderMilestones(payload);
  }

  async function deleteUser(id) {
    if (!confirm('Remove this user?')) return;
    const res = await fetch(`${API_BASE}/users/${id}/`, { method: 'DELETE', headers });
    if (res.ok) {
      state.users = state.users.filter(u => u.id !== id);
      renderTables();
      showToast('User removed');
    } else {
      showToast('Failed to remove user', 'error');
    }
  }

  async function deleteJob(id) {
    if (!confirm('Remove this job?')) return;
    const res = await fetch(`${API_BASE}/jobs/${id}/`, { method: 'DELETE', headers });
    if (res.ok) {
      state.jobs = state.jobs.filter(j => j.id !== id);
      renderTables();
      showToast('Job removed');
    } else {
      showToast('Failed to remove job', 'error');
    }
  }

  const addUserForm = document.getElementById('add-user-form');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      const isAdmin = payload.role === 'admin';
      payload.is_staff = isAdmin;
      const res = await fetch(`${API_BASE}/users/`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const created = await res.json();
        const record = created?.data || created;
        if (record) state.users.push(record);
        renderTables();
        showToast('User created');
        e.target.reset();
      } else {
        showToast('Failed to create user', 'error');
      }
    });
  }

  const addJobForm = document.getElementById('add-job-form');
  if (addJobForm) {
    addJobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      payload.budget = Number(payload.budget || 0);
      const res = await fetch(`${API_BASE}/jobs/`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const created = await res.json();
        const record = created?.data || created;
        if (record) state.jobs.unshift(record);
        renderTables();
        showToast('Job posted');
        e.target.reset();
      } else {
        showToast('Failed to post job', 'error');
      }
    });
  }

  ['filter-clients', 'filter-experts', 'filter-jobs', 'filter-proposals'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderTables);
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
    });
  }

  document.addEventListener('click', async (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const id = actionBtn.dataset.id;
      if (actionBtn.dataset.action === 'delete-user') {
        deleteUser(id);
      }
      if (actionBtn.dataset.action === 'delete-job') {
        deleteJob(id);
      }
      return;
    }
    const btn = e.target.closest('button[data-type]');
    if (!btn) return;
    const id = btn.dataset.id;
    const stateValue = btn.dataset.state;
    try {
      if (btn.dataset.type === 'ms') {
        const res = await fetch(`${API_BASE}/milestones/${id}/`, { method: 'PATCH', headers, body: JSON.stringify({ state: stateValue }) });
        if (!res.ok) throw new Error('Failed to update milestone');
        fetchMilestones();
      }
      if (btn.dataset.type === 'pr') {
        const res = await fetch(`${API_BASE}/proposals/${id}/`, { method: 'PATCH', headers, body: JSON.stringify({ state: stateValue }) });
        if (!res.ok) throw new Error('Failed to update proposal');
        fetchProposals();
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  });

  fetchUsers().catch(err => showToast(err.message, 'error'));
  fetchJobs().catch(err => showToast(err.message, 'error'));
  fetchMilestones().catch(err => showToast(err.message, 'error'));
  fetchProposals().catch(err => showToast(err.message, 'error'));
})();
