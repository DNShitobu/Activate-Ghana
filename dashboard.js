(() => {
  if (!localStorage.getItem('jwt_access')) {
    window.location.href = 'login.html';
    return;
  }

  const USE_API = new URLSearchParams(window.location.search).get('data') === 'live';
  const API_BASE_URL = window.API_BASE || 'http://127.0.0.1:8001/api';
  const quoteTable = document.getElementById('buyer-quote-table');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const renderBuyerQuotes = async () => {
    if (!quoteTable) return;
    if (!(USE_API && localStorage.getItem('jwt_access'))) {
      quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-slate-500" colspan="5">Log in with live data to view quotes.</td></tr>';
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/quotes/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_access')}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || data.results || []);
      const me = (localStorage.getItem('user_name') || '').toLowerCase();
      const mine = list.filter(q => (q.buyer_name || '').toLowerCase() === me);
      if (!mine.length) {
        quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-slate-500" colspan="5">No quote requests yet.</td></tr>';
        return;
      }
      quoteTable.innerHTML = mine.map(q => `
        <tr class="border-b">
          <td class="py-2 px-3">${escapeHtml(q.product_seller_name || 'Seller')}</td>
          <td class="py-2 px-3">${escapeHtml(q.product_name || q.product)}</td>
          <td class="py-2 px-3">${escapeHtml(q.quantity || 0)}</td>
          <td class="py-2 px-3">${escapeHtml(q.delivery_location || '-')}</td>
          <td class="py-2 px-3">${escapeHtml(q.status || 'new')}</td>
        </tr>
      `).join('');
    } catch (err) {
      quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-red-600" colspan="5">Failed to load quote requests.</td></tr>';
    }
  };

  renderBuyerQuotes();
})();
