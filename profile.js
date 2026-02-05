(() => {
  if (!localStorage.getItem('jwt_access')) {
    window.location.href = 'login.html';
    return;
  }

  const profileForm = document.getElementById('profile-form');
  const productForm = document.getElementById('product-form');
  const productList = document.getElementById('product-list-profile');
  const storageKey = 'activate_products';
  const USE_API = new URLSearchParams(window.location.search).get('data') === 'live';
  const API_BASE_URL = window.API_BASE || 'http://127.0.0.1:8001/api';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const loadProducts = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (err) {
      return [];
    }
  };

  const saveProducts = (list) => {
    localStorage.setItem(storageKey, JSON.stringify(list));
  };

  const renderAvatar = (url) => {
    const img = document.getElementById('avatar-image');
    const placeholder = document.getElementById('avatar-placeholder');
    if (!img || !placeholder) return;
    if (!url) {
      img.removeAttribute('src');
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');
      return;
    }
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('jwt_access');
    if (!(USE_API && token)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/profiles/me/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      document.getElementById('profile-description').value = data.bio || '';
      document.getElementById('location').value = data.location || '';
      document.getElementById('phone').value = data.phone || '';
      document.getElementById('email').value = data.email || '';
      renderAvatar(data.avatar_url || '');
    } catch (err) {
      // ignore
    }
  };

  const renderProductList = async () => {
    if (!productList) return;
    if (USE_API && localStorage.getItem('jwt_access')) {
      try {
        const res = await fetch(`${API_BASE_URL}/products/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_access')}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || data.results || []);
          const me = (localStorage.getItem('user_name') || '').toLowerCase();
          const items = list.filter(p => (p.seller_name || '').toLowerCase() === me);
          if (!items.length) {
            productList.innerHTML = '<p class="text-sm text-slate-500">No products added yet.</p>';
            return;
          }
          productList.innerHTML = items.map((product) => `
            <div class="rounded-xl border border-slate-200 p-4 space-y-2">
              <p class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(product.category)}</p>
              <p class="font-semibold">${escapeHtml(product.name)}</p>
              <p class="text-sm text-slate-600">GHS ${escapeHtml(product.price)} · ${escapeHtml(product.unit)} · Qty ${escapeHtml(product.quantity)}</p>
              <p class="text-sm text-slate-500">${escapeHtml(product.location)}</p>
            </div>
          `).join('');
          return;
        }
      } catch (err) {
        // fall back to local
      }
    }
    const items = loadProducts();
    if (!items.length) {
      productList.innerHTML = '<p class="text-sm text-slate-500">No products added yet.</p>';
      return;
    }
    productList.innerHTML = items.map((product) => `
      <div class="rounded-xl border border-slate-200 p-4 space-y-2">
        <p class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(product.category)}</p>
        <p class="font-semibold">${escapeHtml(product.name)}</p>
        <p class="text-sm text-slate-600">GHS ${escapeHtml(product.price)} · ${escapeHtml(product.unit)} · Qty ${escapeHtml(product.quantity)}</p>
        <p class="text-sm text-slate-500">${escapeHtml(product.location)}</p>
      </div>
    `).join('');
  };

  const renderQuoteRequests = async () => {
    const quoteTable = document.getElementById('quote-table');
    if (!quoteTable) return;
    if (!(USE_API && localStorage.getItem('jwt_access'))) {
      quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-slate-500" colspan="7">Log in with live data to view requests.</td></tr>';
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
      const incoming = list.filter(q => (q.product_seller_name || '').toLowerCase() === me);
      if (!incoming.length) {
        quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-slate-500" colspan="7">No quote requests yet.</td></tr>';
        return;
      }
      quoteTable.innerHTML = incoming.map(q => `
        <tr class="border-b">
          <td class="py-2 px-3">${escapeHtml(q.buyer_name || 'Buyer')}</td>
          <td class="py-2 px-3">${escapeHtml(q.product_name || q.product)}</td>
          <td class="py-2 px-3">${escapeHtml(q.quantity || 0)}</td>
          <td class="py-2 px-3">${escapeHtml(q.delivery_location || '-')}</td>
          <td class="py-2 px-3">${escapeHtml(q.needed_by || '-')}</td>
          <td class="py-2 px-3">${escapeHtml(q.status || 'new')}</td>
          <td class="py-2 px-3 space-x-2">
            <button data-quote-action="quoted" data-quote-id="${q.id}" class="px-2 py-1 rounded border border-emerald-300 text-emerald-700 text-xs">Mark quoted</button>
            <button data-quote-action="accepted" data-quote-id="${q.id}" class="px-2 py-1 rounded border border-slate-300 text-xs">Accept</button>
            <button data-quote-action="declined" data-quote-id="${q.id}" class="px-2 py-1 rounded border border-amber-300 text-amber-700 text-xs">Decline</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      quoteTable.innerHTML = '<tr><td class="py-3 px-3 text-red-600" colspan="7">Failed to load quote requests.</td></tr>';
    }
  };

  const bindProfileSave = () => {
    if (!profileForm) return;
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('jwt_access');
      if (!(USE_API && token)) {
        alert('Log in with ?data=live to save to the API.');
        return;
      }
      const bio = document.getElementById('profile-description')?.value || '';
      const phone = document.getElementById('phone')?.value || '';
      const location = document.getElementById('location')?.value || '';
      const avatarFile = document.getElementById('avatar')?.files?.[0];
      const kycId = document.getElementById('kyc-id')?.files?.[0];
      const kycTrade = document.getElementById('kyc-trade')?.files?.[0];
      const kycBackground = document.getElementById('kyc-background')?.files?.[0];

      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('phone', phone);
      formData.append('location', location);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (kycId) formData.append('kyc_id_document', kycId);
      if (kycTrade) formData.append('kyc_trade_license', kycTrade);
      if (kycBackground) formData.append('kyc_background_check', kycBackground);

      try {
        const res = await fetch(`${API_BASE_URL}/profiles/me/`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        renderAvatar(data.avatar_url || '');
        alert('Profile updated.');
      } catch (err) {
        alert('Profile update failed.');
      }
    });
  };

  const bindProductSave = () => {
    if (!productForm) return;
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('jwt_access');
      const fd = new FormData(productForm);
      const payload = Object.fromEntries(fd.entries());
      const profilePhone = document.getElementById('phone')?.value || '';
      const profileEmail = document.getElementById('email')?.value || '';
      if (USE_API && token) {
        const body = new FormData();
        body.append('name', payload.name || 'New product');
        body.append('category', payload.category || 'General');
        body.append('price', payload.price || 0);
        body.append('unit', payload.unit || 'unit');
        body.append('quantity', payload.quantity || 0);
        body.append('location', payload.location || 'Ghana');
        body.append('description', payload.notes || '');
        body.append('contact_phone', payload.sellerPhone || profilePhone || '');
        body.append('contact_email', payload.sellerEmail || profileEmail || '');
        if (payload.imageUrl) body.append('image_url', payload.imageUrl);
        const imageFile = productForm.querySelector('input[name="imageFile"]')?.files?.[0];
        if (imageFile) body.append('image', imageFile);
        try {
          const res = await fetch(`${API_BASE_URL}/products/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body,
          });
          if (!res.ok) throw new Error('Failed to create product');
          productForm.reset();
          renderProductList();
          return;
        } catch (err) {
          alert('Product save failed. Check your connection.');
        }
      }
      const list = loadProducts();
      const stamp = Date.now();
      const sellerName = payload.seller || localStorage.getItem('user_name') || 'ACTIVATE Seller';
      const sellerId = sellerName.toLowerCase().replace(/\s+/g, '-');
      list.unshift({
        id: `prod-${stamp}`,
        name: payload.name || 'New product',
        category: payload.category || 'General',
        price: Number(payload.price || 0),
        unit: payload.unit || 'unit',
        quantity: Number(payload.quantity || 0),
        location: payload.location || 'Ghana',
        seller: sellerName,
        sellerId,
        sellerType: 'Seller',
        sellerPhone: payload.sellerPhone || profilePhone || '000 000 0000',
        sellerEmail: payload.sellerEmail || profileEmail || 'seller@example.com',
        image: payload.imageUrl || 'images/IMG_6854.jpg',
        url: `product-detail.html?id=prod-${stamp}`,
        sellerUrl: `seller-profile.html?user=${sellerId}`,
      });
      saveProducts(list);
      productForm.reset();
      renderProductList();
    });
  };

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-quote-action]');
    if (!btn) return;
    const token = localStorage.getItem('jwt_access');
    if (!token) return;
    const id = btn.dataset.quoteId;
    const status = btn.dataset.quoteAction;
    try {
      const res = await fetch(`${API_BASE_URL}/quotes/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      renderQuoteRequests();
    } catch (err) {
      alert('Failed to update quote');
    }
  });

  const avatarInput = document.getElementById('avatar');
  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      renderAvatar(url);
    });
  }

  loadProfile();
  bindProfileSave();
  bindProductSave();
  renderProductList();
  renderQuoteRequests();
})();
