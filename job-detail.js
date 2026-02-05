(() => {
  const back = document.getElementById('back-link');
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const id = params.get('id');
  const card = document.getElementById('job-card');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';
  const USE_API = params.get('data') === 'live';

  const sanitizeBack = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('//') ||
      lower.includes('://')
    ) {
      return '';
    }
    return raw;
  };
  const safeFrom = sanitizeBack(from);
  if (back && safeFrom) back.href = safeFrom;

  const jobData = {
    'job-1': { title: 'Wire 2-bedroom apartment + solar changeover', location: 'Kasoa', budget: 'GHS 4,800', status: 'Applications open', description: 'Complete wiring, changeover to solar, safety checks.' },
    'job-2': { title: 'Fix leaking bathroom + retile floor', location: 'Cape Coast', budget: 'GHS 2,100', status: 'Shortlisting', description: 'Seal leaks, replace tiles, ensure waterproofing.' },
    'job-3': { title: 'Custom wardrobe & TV console', location: 'East Legon', budget: 'GHS 6,500', status: 'New', description: 'Built-in wardrobe and TV console with laminate finish.' },
    'job-4': { title: 'School uniforms bulk order (120 pcs)', location: 'Tema', budget: 'GHS 8,900', status: 'Pre-funded escrow', description: 'Uniform stitching, fitting, delivery in 3 weeks.' },
    'job-5': { title: 'Fleet maintenance (3 vans)', location: 'Kumasi', budget: 'GHS 3,200', status: 'Applications open', description: 'Diagnostics, servicing, minor bodywork.' },
    'job-6': { title: 'Gate fabrication + install', location: 'Takoradi', budget: 'GHS 5,700', status: 'New', description: 'Metal gate fabrication, powder coat, on-site install.' },
  };

  const renderJob = (job) => {
    if (!job) {
      if (card) card.innerHTML = '<p class="text-slate-600">Job not found. Please return to the listings.</p>';
      return;
    }
    const titleEl = document.getElementById('job-title');
    const locationEl = document.getElementById('job-location');
    const budgetEl = document.getElementById('job-budget');
    const statusEl = document.getElementById('job-status');
    const descEl = document.getElementById('job-description');

    if (titleEl) titleEl.textContent = job.title;
    if (locationEl) locationEl.textContent = job.location || 'Ghana';
    if (budgetEl) budgetEl.textContent = (job.budget || '').toString().includes('GHS') ? job.budget : `GHS ${job.budget}`;
    if (statusEl) statusEl.textContent = (job.status || '').replace(/_/g, ' ');
    if (descEl) descEl.textContent = job.description || '';
  };

  if (USE_API && id) {
    fetch(`${API_BASE}/jobs/${encodeURIComponent(id)}/`)
      .then(res => res.ok ? res.json() : null)
      .then(data => renderJob(data))
      .catch(() => renderJob(jobData[id]));
  } else {
    renderJob(jobData[id]);
  }
})();
