(() => {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));

  const safeUrl = (value) => {
    const url = String(value || '').trim();
    if (!url) return '';
    const lower = url.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return '';
    if (lower.startsWith('http://') || lower.startsWith('https://')) return url;
    if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../') || lower.startsWith('#')) return url;
    if (lower.startsWith('//') || lower.includes('://')) return '';
    return url;
  };

  const safeLink = (base, suffix = '') => {
    const url = safeUrl(base);
    if (!url) return '#';
    return `${url}${suffix || ''}`;
  };

  const safeLocalPath = (value) => {
    const url = safeUrl(value);
    if (!url) return '';
    const lower = url.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('//')) return '';
    return url;
  };

  const colorClassMap = {
    '#f6b01e': 'border-amber-400',
    '#f68b1f': 'border-primary',
    '#f55203': 'border-orange-500',
    '#313131': 'border-slate-700',
    '#34d399': 'border-emerald-400',
    '#f59e0b': 'border-amber-500',
    '#c084fc': 'border-violet-400',
    '#38bdf8': 'border-sky-400',
  };
  const borderClasses = [...Object.values(colorClassMap), 'border-white/20'];

  const categoryData = [
    { name: 'Electricians', description: 'Solar, wiring, backup power, repairs', color: '#F6B01E', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Plumbers', description: 'Fix leaks, bathrooms, borehole hookups', color: '#313131', image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Carpenters', description: 'Doors, roofing, cabinetry, fit-out', color: '#F55203', image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Mechanics', description: 'Auto diagnostics, fleet maintenance', color: '#34d399', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Tailors', description: 'Uniforms, occasion wear, alterations', color: '#f59e0b', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Welders', description: 'Gates, windows, structural frames', color: '#c084fc', image: 'https://images.unsplash.com/photo-1508255139162-e1f7b7288ab9?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Drivers', description: 'School runs, delivery, contract drivers', color: '#38bdf8', image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Masons', description: 'Block work, tiling, concrete, finishing', color: '#F68B1F', image: 'https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=1200&q=80' },
  ];

  const expertData = [
    { name: 'Ama Boateng', role: 'Licensed Electrician', skills: ['Electricians', 'Solar'], rating: 4.8, jobs: 126, location: 'Accra - Madina', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=ama-boateng' },
    { name: 'Kofi Mensah', role: 'Plumber', skills: ['Plumbers'], rating: 4.6, jobs: 88, location: 'Kumasi - Asokwa', verified: true, photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=kofi-mensah' },
    { name: 'Esi Quaye', role: 'Carpenter & Joiner', skills: ['Carpenters'], rating: 4.9, jobs: 140, location: 'Accra - Spintex', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=esi-quaye' },
    { name: 'Yaw Adom', role: 'Auto Mechanic', skills: ['Mechanics'], rating: 4.5, jobs: 64, location: 'Takoradi', verified: false, photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=yaw-adom' },
    { name: 'Selina Owusu', role: 'Tailor', skills: ['Tailors'], rating: 4.7, jobs: 92, location: 'Accra - Kaneshie', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=selina-owusu' },
    { name: 'Issah Fuseini', role: 'Welder', skills: ['Welders'], rating: 4.4, jobs: 53, location: 'Tamale', verified: false, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=issah-fuseini' },
  ];

  const params = new URLSearchParams(window.location.search);
  const catName = params.get('cat');
  const from = params.get('from');
  const back = document.getElementById('back-link');
  const safeFrom = safeLocalPath(from);
  if (back && safeFrom) back.href = safeFrom;

  const category = categoryData.find(c => c.name.toLowerCase() === (catName || '').toLowerCase()) || categoryData[0];

  const heroImage = document.getElementById('hero-image');
  if (heroImage) {
    heroImage.src = safeUrl(category.image);
    heroImage.alt = category.name;
  }
  const chip = document.getElementById('cat-chip');
  if (chip) {
    chip.textContent = category.name;
    borderClasses.forEach(cls => chip.classList.remove(cls));
    const colorKey = String(category.color || '').toLowerCase();
    chip.classList.add(colorClassMap[colorKey] || 'border-primary');
  }
  const title = document.getElementById('cat-title');
  if (title) title.textContent = `${category.name} in Ghana`;
  const desc = document.getElementById('cat-desc');
  if (desc) desc.textContent = category.description;

  const list = document.getElementById('cat-experts');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8001/api';
  const USE_API = params.get('data') === 'live';

  const renderExperts = (experts) => {
    if (!list) return;
    if (!experts.length) {
      list.innerHTML = '<div class="card rounded-2xl p-6 text-center text-slate-200 col-span-full">No experts found yet for this skill.</div>';
      return;
    }
    list.innerHTML = experts.map(expert => `
      <article class="card rounded-2xl p-4 space-y-2">
        <div class="flex gap-3">
          <img src="${safeUrl(expert.photo)}" alt="${escapeHtml(expert.name)}" class="w-14 h-14 rounded-xl object-cover">
          <div>
            <p class="text-sm text-slate-300">${escapeHtml(expert.location)}</p>
            <a href="${safeLink(expert.profileUrl, safeFrom ? '&from=' + encodeURIComponent(safeFrom) : '')}" class="font-semibold hover:text-primary">${escapeHtml(expert.name)}</a>
            <p class="text-sm text-slate-300">${escapeHtml(expert.role)}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <span class="px-2 py-1 rounded-lg ${expert.verified ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}">${expert.verified ? 'Verified' : 'Pending verify'}</span>
          <span class="px-2 py-1 rounded-lg bg-white/10">${escapeHtml(expert.rating)} &#9733; - ${escapeHtml(expert.jobs)} jobs</span>
          ${(expert.skills || []).map(s => `<span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10">${escapeHtml(s)}</span>`).join('')}
        </div>
      </article>
    `).join('');
  };

  if (USE_API) {
    fetch(`${API_BASE}/profiles/?role=expert&q=${encodeURIComponent(category.name)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const listData = Array.isArray(data) ? data : (data?.results || data?.data || []);
        const mapped = listData.map(profile => ({
          name: profile.username,
          role: profile.role || 'Expert',
          location: profile.location || 'Ghana',
          verified: Boolean(profile.verified_id || profile.verified_trade || profile.verified_background),
          photo: profile.avatar_url || 'images/IMG_6751.jpg',
          profileUrl: `expert-profile.html?user=${encodeURIComponent(profile.username)}`,
          skills: [category.name],
          rating: profile.rating || 0,
          jobs: profile.jobs || 0,
        }));
        renderExperts(mapped);
      })
      .catch(() => {
        const filtered = expertData.filter(ex => ex.skills.map(s => s.toLowerCase()).includes(category.name.toLowerCase()));
        renderExperts(filtered);
      });
  } else {
    const filtered = expertData.filter(ex => ex.skills.map(s => s.toLowerCase()).includes(category.name.toLowerCase()));
    renderExperts(filtered);
  }
})();
