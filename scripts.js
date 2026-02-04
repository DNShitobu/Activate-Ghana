// Data
let categoryData = [
  { name: 'Electricians', description: 'Solar, wiring, backup power, repairs', color: '#F68B1F', image: 'images/IMG_6251.jpg' },
  { name: 'Plumbers', description: 'Fix leaks, bathrooms, borehole hookups', color: '#F6B01E', image: 'images/IMG_6266.jpg' },
  { name: 'Poultry & Livestock', description: 'Live birds, eggs, meat, feed plans', color: '#F68B1F', image: 'images/IMG_6280.jpg' },
  { name: 'Agro Inputs', description: 'Fertilizer, pesticide, herbicide supply', color: '#F6B01E', image: 'images/IMG_6283.jpg' },
  { name: 'Nursery & Cashew', description: 'Seedlings, grafting, orchard setup', color: '#F55203', image: 'images/IMG_6319.jpg' },
  { name: 'Mechanics', description: 'Auto diagnostics, fleet maintenance', color: '#F55203', image: 'images/IMG_6320.jpg' },
  { name: 'Carpenters', description: 'Doors, roofing, cabinetry, fit-out', color: '#F68B1F', image: 'images/IMG_6335.jpg' },
  { name: 'Tailors', description: 'Uniforms, occasion wear, alterations', color: '#F6B01E', image: 'images/IMG_6732.jpg' },
  { name: 'Welders', description: 'Gates, windows, structural frames', color: '#F55203', image: 'images/IMG_6736.jpg' },
  { name: 'Masons', description: 'Block work, tiling, concrete, finishing', color: '#F68B1F', image: 'images/IMG_6738.jpg' },
];

const USE_API = new URLSearchParams(window.location.search).get('data') === 'live';
const API_BASE_URL = window.API_BASE || 'http://127.0.0.1:8001/api';
const LIVE_QS = USE_API ? '&data=live' : '';

const marketState = {
  experts: { page: 1, skill: '', location: '', verified: 'any', category: 'All' },
  jobs: { page: 1, keyword: '', location: '', status: 'All' },
  products: { page: 1, query: '', location: '', maxPrice: 0, category: 'All' },
};

function extractPage(url) {
  try {
    const parsed = new URL(url);
    const page = Number(parsed.searchParams.get('page'));
    return Number.isNaN(page) ? 1 : page;
  } catch (err) {
    return 1;
  }
}

function renderPagination(containerId, entity, pageInfo) {
  const containers = [
    ...document.querySelectorAll(`[data-pagination="${entity}"]`),
  ];
  const primary = document.getElementById(containerId);
  if (primary && !containers.includes(primary)) containers.push(primary);
  if (!containers.length) return;
  const html = (!pageInfo || (!pageInfo.next && !pageInfo.previous)) ? '' : (() => {
    const prevPage = pageInfo.previous ? extractPage(pageInfo.previous) : null;
    const nextPage = pageInfo.next ? extractPage(pageInfo.next) : null;
    return `
      ${prevPage ? `<button data-page-entity="${entity}" data-page="${prevPage}" class="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold hover:border-primary transition">Previous</button>` : ''}
      <span class="text-xs text-slate-600">Page ${marketState[entity].page}</span>
      ${nextPage ? `<button data-page-entity="${entity}" data-page="${nextPage}" class="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold hover:border-primary transition">Next</button>` : ''}
    `;
  })();
  containers.forEach(container => {
    container.innerHTML = html;
  });
}

async function fetchPaginated(endpoint, params, page = 1) {
  const search = new URLSearchParams({ ...(params || {}), page });
  const url = `${API_BASE_URL}/${endpoint}/?${search.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  if (Array.isArray(data)) {
    return { results: data, next: null, previous: null, count: data.length };
  }
  return data;
}

let expertData = [
  { id: 'ama-boateng', name: 'Ama Boateng', role: 'Licensed Electrician', skills: ['Electricians', 'Solar'], rating: 4.8, jobs: 126, location: 'Accra - Madina', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=ama-boateng', portfolio: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80'] },
  { id: 'kofi-mensah', name: 'Kofi Mensah', role: 'Plumber', skills: ['Plumbers'], rating: 4.6, jobs: 88, location: 'Kumasi - Asokwa', verified: true, photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=kofi-mensah', portfolio: ['https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'] },
  { id: 'esi-quaye', name: 'Esi Quaye', role: 'Carpenter & Joiner', skills: ['Carpenters'], rating: 4.9, jobs: 140, location: 'Accra - Spintex', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=esi-quaye', portfolio: ['https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'] },
  { id: 'yaw-adom', name: 'Yaw Adom', role: 'Auto Mechanic', skills: ['Mechanics'], rating: 4.5, jobs: 64, location: 'Takoradi', verified: false, photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=yaw-adom', portfolio: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80'] },
  { id: 'selina-owusu', name: 'Selina Owusu', role: 'Tailor', skills: ['Tailors'], rating: 4.7, jobs: 92, location: 'Accra - Kaneshie', verified: true, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=selina-owusu', portfolio: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'] },
  { id: 'issah-fuseini', name: 'Issah Fuseini', role: 'Welder', skills: ['Welders'], rating: 4.4, jobs: 53, location: 'Tamale', verified: false, photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80', profileUrl: 'expert-profile.html?user=issah-fuseini', portfolio: ['https://images.unsplash.com/photo-1508255139162-e1f7b7288ab9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1508255139162-e1f7b7288ab9?auto=format&fit=crop&w=600&q=80'] },
  { id: 'akosua-ampofo', name: 'Akosua Ampofo', role: 'Cashew Nursery Specialist', skills: ['Nursery & Cashew', 'Agro Services'], rating: 4.8, jobs: 41, location: 'Wenchi', verified: true, photo: 'images/IMG_6751.jpg', profileUrl: 'expert-profile.html?user=akosua-ampofo', portfolio: ['images/IMG_6813.jpg', 'images/IMG_6814.jpg'] },
  { id: 'yaw-poultry', name: 'Yaw Poultry', role: 'Poultry Farmer', skills: ['Poultry & Livestock'], rating: 4.6, jobs: 36, location: 'Koforidua', verified: true, photo: 'images/IMG_6757.jpg', profileUrl: 'expert-profile.html?user=yaw-poultry', portfolio: ['images/IMG_6821.jpg', 'images/IMG_6822.jpg'] },
];

let jobData = [
  { id: 'job-1', title: 'Wire 2-bedroom apartment + solar changeover', location: 'Kasoa', budget: 'GHS 4,800', status: 'Applications open', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-1' },
  { id: 'job-2', title: 'Fix leaking bathroom + retile floor', location: 'Cape Coast', budget: 'GHS 2,100', status: 'Shortlisting', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-2' },
  { id: 'job-3', title: 'Custom wardrobe & TV console', location: 'East Legon', budget: 'GHS 6,500', status: 'New', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-3' },
  { id: 'job-4', title: 'School uniforms bulk order (120 pcs)', location: 'Tema', budget: 'GHS 8,900', status: 'Pre-funded escrow', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-4' },
  { id: 'job-5', title: 'Fleet maintenance (3 vans)', location: 'Kumasi', budget: 'GHS 3,200', status: 'Applications open', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-5' },
  { id: 'job-6', title: 'Gate fabrication + install', location: 'Takoradi', budget: 'GHS 5,700', status: 'New', image: 'https://images.unsplash.com/photo-1508255139162-e1f7b7288ab9?auto=format&fit=crop&w=800&q=80', url: 'job-detail.html?id=job-6' },
];

let productData = [
  { id: 'prod-1', name: 'Live Broilers (50 birds)', category: 'Poultry & Livestock', price: 1200, unit: 'crate', quantity: 50, location: 'Kumasi', seller: 'Yaw Poultry', sellerId: 'yaw-poultry', sellerType: 'Farmer', sellerPhone: '050 123 4567', sellerEmail: 'yawpoultry@example.com', image: 'images/IMG_6824.jpg', url: 'product-detail.html?id=prod-1', sellerUrl: 'seller-profile.html?user=yaw-poultry' },
  { id: 'prod-2', name: 'Fresh Eggs (tray)', category: 'Poultry & Livestock', price: 75, unit: 'tray', quantity: 80, location: 'Koforidua', seller: 'Yaw Poultry', sellerId: 'yaw-poultry', sellerType: 'Farmer', sellerPhone: '050 123 4567', sellerEmail: 'yawpoultry@example.com', image: 'images/IMG_6826.jpg', url: 'product-detail.html?id=prod-2', sellerUrl: 'seller-profile.html?user=yaw-poultry' },
  { id: 'prod-3', name: 'Organic Chicken Meat', category: 'Poultry & Livestock', price: 55, unit: 'kg', quantity: 200, location: 'Accra', seller: 'Ama Farms', sellerId: 'ama-farms', sellerType: 'Farmer', sellerPhone: '024 222 3344', sellerEmail: 'amafarms@example.com', image: 'images/IMG_6827.jpg', url: 'product-detail.html?id=prod-3', sellerUrl: 'seller-profile.html?user=ama-farms' },
  { id: 'prod-4', name: 'NPK 15-15-15 Fertilizer', category: 'Agro Inputs', price: 380, unit: '50kg bag', quantity: 140, location: 'Tamale', seller: 'Northern Agro Hub', sellerId: 'northern-agro', sellerType: 'Input Supplier', sellerPhone: '027 555 9012', sellerEmail: 'northernagro@example.com', image: 'images/IMG_6838.jpg', url: 'product-detail.html?id=prod-4', sellerUrl: 'seller-profile.html?user=northern-agro' },
  { id: 'prod-5', name: 'Selective Herbicide', category: 'Agro Inputs', price: 120, unit: 'litre', quantity: 60, location: 'Sunyani', seller: 'GreenGrow Inputs', sellerId: 'greengrow-inputs', sellerType: 'Input Supplier', sellerPhone: '020 334 7788', sellerEmail: 'greengrow@example.com', image: 'images/IMG_6852.jpg', url: 'product-detail.html?id=prod-5', sellerUrl: 'seller-profile.html?user=greengrow-inputs' },
  { id: 'prod-6', name: 'Cashew Seedlings (grafted)', category: 'Nursery & Cashew', price: 25, unit: 'seedling', quantity: 1200, location: 'Wenchi', seller: 'Akosua Ampofo', sellerId: 'akosua-ampofo', sellerType: 'Nursery Expert', sellerPhone: '054 777 1200', sellerEmail: 'akosua@example.com', image: 'images/IMG_6841.jpg', url: 'product-detail.html?id=prod-6', sellerUrl: 'seller-profile.html?user=akosua-ampofo' },
  { id: 'prod-7', name: 'Nursery Planting Service', category: 'Nursery & Cashew', price: 900, unit: 'acre', quantity: 8, location: 'Techiman', seller: 'Seedway Nurseries', sellerId: 'seedway', sellerType: 'Nursery Expert', sellerPhone: '055 101 9090', sellerEmail: 'seedway@example.com', image: 'images/IMG_6848.jpg', url: 'product-detail.html?id=prod-7', sellerUrl: 'seller-profile.html?user=seedway' },
];

let activeProductCategory = 'All';

let activeExpertCategory = 'All';
let userLocation = null;

let disputes = [
  { id: '#D-1042', topic: 'Tile quality vs spec', status: 'Under review', action: 'freeze_wallet', amount: 'GHS 3,200' },
  { id: '#D-1038', topic: 'Delayed rewiring', status: 'Split funds proposed', action: 'split_funds', amount: 'GHS 2,450' },
  { id: '#D-1031', topic: 'Vehicle repair comeback', status: 'Refund recommended', action: 'refund_client', amount: 'GHS 1,200' },
];

let reviews = [
  { contract: '#C-2209', from: 'Client · Lydia', to: 'Ama Boateng', rating: 5, text: 'Power restored with clean cabling. Explained safety steps.' },
  { contract: '#C-2198', from: 'Expert · Kofi Mensah', to: 'Client · Daniel', rating: 4, text: 'Client responsive, clear scope. Minor delay on materials.' },
  { contract: '#C-2187', from: 'Client · Nana', to: 'Esi Quaye', rating: 5, text: 'Wardrobe fit-out better than sample photos. Will rehire.' },
];

let milestones = [];
let proposals = [];
let notifications = [];
let sessionUser = null;
let remoteLoaded = false;

function quickToast(msg, variant = 'info') {
  const t = document.createElement('div');
  t.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white ${variant === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function getChatStore() {
  try {
    return JSON.parse(localStorage.getItem('activate_chats') || '{}');
  } catch (err) {
    return {};
  }
}

function saveChatStore(store) {
  localStorage.setItem('activate_chats', JSON.stringify(store));
}

function setPendingChat(participant, message) {
  if (!participant) return;
  localStorage.setItem('activate_pending_chat', JSON.stringify({ participant, message }));
}

function getPendingChat() {
  try {
    return JSON.parse(localStorage.getItem('activate_pending_chat') || 'null');
  } catch (err) {
    return null;
  }
}

function clearPendingChat() {
  localStorage.removeItem('activate_pending_chat');
}

function createChatThread(participant, initialMessage = '') {
  if (!participant) return null;
  const currentUser = localStorage.getItem('user_name') || 'You';
  let store = getChatStore();
  let activeId = Object.keys(store).find((id) => {
    const thread = store[id];
    return thread?.participants?.includes(currentUser) && thread?.participants?.includes(participant);
  });
  if (!activeId) {
    activeId = `chat-${Date.now()}`;
    store[activeId] = {
      title: `${participant} - ${currentUser}`,
      participants: [currentUser, participant],
      messages: [],
    };
  }
  if (initialMessage) {
    store[activeId].messages.push({ sender: currentUser, text: initialMessage, ts: Date.now() });
  }
  saveChatStore(store);
  return activeId;
}

function renderChatUI() {
  const threadList = document.getElementById('chat-threads');
  const messagesEl = document.getElementById('chat-messages');
  const chatTitle = document.getElementById('chat-title');
  const chatMeta = document.getElementById('chat-meta');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const newChatBtn = document.getElementById('new-chat');
  if (!threadList || !messagesEl || !chatForm || !chatInput) return;

  const currentUser = localStorage.getItem('user_name') || 'You';
  const useRemote = USE_API && localStorage.getItem('jwt_access');
  const params = new URLSearchParams(window.location.search);
  const newParticipant = params.get('new');
  const openThread = params.get('open');
  const starterMessage = params.get('message');

  if (!useRemote) {
    let store = getChatStore();
    let activeId = Object.keys(store)[0] || null;
    if (newParticipant) {
      activeId = createChatThread(newParticipant, starterMessage);
      clearPendingChat();
      store = getChatStore();
    } else if (openThread && store[openThread]) {
      activeId = openThread;
    }
    const pending = getPendingChat();
    if (pending?.participant) {
      activeId = createChatThread(pending.participant, pending.message || '');
      clearPendingChat();
      store = getChatStore();
    }

    const renderThreads = () => {
      const ids = Object.keys(store);
      if (!ids.length) {
        threadList.innerHTML = `<p class="text-sm text-slate-500">No conversations yet.</p>`;
        return;
      }
      threadList.innerHTML = ids.map((id) => {
        const thread = store[id];
        const last = thread.messages[thread.messages.length - 1];
        return `
          <button class="w-full text-left p-3 rounded-xl border ${id === activeId ? 'border-primary bg-primary/10' : 'border-slate-200'}" data-chat-id="${id}">
            <p class="text-sm font-semibold">${thread.title}</p>
            <p class="text-xs text-slate-500">${last?.text || 'No messages yet'}</p>
          </button>
        `;
      }).join('');
    };

    const renderMessages = () => {
      if (!activeId || !store[activeId]) {
        messagesEl.innerHTML = `<p class="text-sm text-slate-500">Select or start a chat.</p>`;
        chatTitle.textContent = 'Select a chat';
        chatMeta.textContent = '';
        return;
      }
      const thread = store[activeId];
      chatTitle.textContent = thread.title;
      chatMeta.textContent = `${thread.participants.join(' - ')}`;
      messagesEl.innerHTML = thread.messages.map((msg) => `
        <div class="flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === currentUser ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800'}">
            <p class="text-xs opacity-70">${msg.sender}</p>
            <p class="text-sm">${msg.text}</p>
          </div>
        </div>
      `).join('');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const createChat = () => {
      const participant = prompt('Enter the name of the client or expert to chat with:');
      if (!participant) return;
      const id = `chat-${Date.now()}`;
      store[id] = {
        title: `${participant} - ${currentUser}`,
        participants: [currentUser, participant],
        messages: [],
      };
      activeId = id;
      saveChatStore(store);
      renderThreads();
      renderMessages();
    };

    newChatBtn?.addEventListener('click', createChat);

    threadList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-chat-id]');
      if (!btn) return;
      activeId = btn.dataset.chatId;
      renderThreads();
      renderMessages();
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeId || !store[activeId]) return;
      const text = chatInput.value.trim();
      if (!text) return;
      store[activeId].messages.push({ sender: currentUser, text, ts: Date.now() });
      saveChatStore(store);
      chatInput.value = '';
      renderThreads();
      renderMessages();
    });

    renderThreads();
    renderMessages();
    return;
  }

  let threads = [];
  let activeId = null;

  const apiJson = async (path, options = {}) => {
    const headers = options.headers || {};
    const token = localStorage.getItem('jwt_access');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!options.method || options.method !== 'GET') headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  };

  const loadThreads = async () => {
    const data = await apiJson('/chat-threads/');
    threads = Array.isArray(data) ? data : (data.data || data.results || []);
    activeId = activeId || threads[0]?.id || null;
  };

  const loadMessages = async () => {
    if (!activeId) return [];
    const data = await apiJson(`/chat-messages/?thread=${activeId}`);
    return Array.isArray(data) ? data : (data.data || data.results || []);
  };

  const renderThreads = (messagesById = {}) => {
    if (!threads.length) {
      threadList.innerHTML = `<p class="text-sm text-slate-500">No conversations yet.</p>`;
      return;
    }
    threadList.innerHTML = threads.map((thread) => {
      const last = messagesById[thread.id]?.slice(-1)[0];
      const title = (thread.participant_names || []).filter(n => n !== currentUser).join(' - ') || 'Chat';
      return `
        <button class="w-full text-left p-3 rounded-xl border ${thread.id === activeId ? 'border-primary bg-primary/10' : 'border-slate-200'}" data-chat-id="${thread.id}">
          <p class="text-sm font-semibold">${title}</p>
          <p class="text-xs text-slate-500">${last?.text || 'No messages yet'}</p>
        </button>
      `;
    }).join('');
  };

  const renderMessages = (messages = []) => {
    if (!activeId) {
      messagesEl.innerHTML = `<p class="text-sm text-slate-500">Select or start a chat.</p>`;
      chatTitle.textContent = 'Select a chat';
      chatMeta.textContent = '';
      return;
    }
    const thread = threads.find(t => t.id === activeId);
    const title = (thread?.participant_names || []).filter(n => n !== currentUser).join(' - ') || 'Chat';
    chatTitle.textContent = title;
    chatMeta.textContent = (thread?.participant_names || []).join(' - ');
    messagesEl.innerHTML = messages.map((msg) => `
      <div class="flex ${msg.sender_name === currentUser ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_name === currentUser ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800'}">
          <p class="text-xs opacity-70">${msg.sender_name || 'User'}</p>
          <p class="text-sm">${msg.text}</p>
        </div>
      </div>
    `).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const createRemoteChat = async (participant, message = '') => {
    const created = await apiJson('/chat-threads/', {
      method: 'POST',
      body: JSON.stringify({ participant_usernames: [participant] }),
    });
    activeId = created.id;
    if (message) {
      await apiJson('/chat-messages/', { method: 'POST', body: JSON.stringify({ thread: activeId, text: message }) });
    }
  };

  newChatBtn?.addEventListener('click', async () => {
    const participant = prompt('Enter the username to chat with:');
    if (!participant) return;
    try {
      await createRemoteChat(participant);
      await loadThreads();
      const msgs = await loadMessages();
      renderThreads({ [activeId]: msgs });
      renderMessages(msgs);
    } catch (err) {
      quickToast('Unable to start chat', 'error');
    }
  });

  threadList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-chat-id]');
    if (!btn) return;
    activeId = Number(btn.dataset.chatId);
    const msgs = await loadMessages();
    renderThreads({ [activeId]: msgs });
    renderMessages(msgs);
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeId) return;
    const text = chatInput.value.trim();
    if (!text) return;
    try {
      await apiJson('/chat-messages/', { method: 'POST', body: JSON.stringify({ thread: activeId, text }) });
      chatInput.value = '';
      const msgs = await loadMessages();
      renderThreads({ [activeId]: msgs });
      renderMessages(msgs);
    } catch (err) {
      quickToast('Failed to send', 'error');
    }
  });

  (async () => {
    try {
      await loadThreads();
      if (newParticipant) {
        await createRemoteChat(newParticipant, starterMessage || '');
        await loadThreads();
      } else if (openThread) {
        activeId = Number(openThread);
      }
      const pending = getPendingChat();
      if (pending?.participant) {
        await createRemoteChat(pending.participant, pending.message || '');
        clearPendingChat();
        await loadThreads();
      }
      const msgs = await loadMessages();
      renderThreads({ [activeId]: msgs });
      renderMessages(msgs);
    } catch (err) {
      quickToast('Failed to load chat', 'error');
    }
  })();
}
function renderSkeleton(targetId, count = 3) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = Array.from({ length: count }).map(() => `
    <article class="card rounded-2xl p-4 animate-pulse space-y-2">
      <div class="w-16 h-16 rounded-xl bg-slate-700"></div>
      <div class="h-3 rounded bg-slate-700 w-2/3"></div>
      <div class="h-3 rounded bg-slate-700 w-1/2"></div>
    </article>
  `).join('');
}

let heroSlides = [
  { title: 'Poultry & farm services', text: 'Sell eggs, live birds, and services directly to buyers.', image: 'images/1-IMG_6479.jpg' },
  { title: 'Agro inputs marketplace', text: 'Fertilizer, pesticide, and farm supplies from verified sellers.', image: 'images/2-IMG_6478.jpg' },
  { title: 'Nursery & cashew experts', text: 'Seedlings, grafting, and orchard setup by trained experts.', image: 'images/3-IMG_6477.jpg' },
  { title: 'Skilled services on demand', text: 'Electricians, plumbers, and artisans with escrow protection.', image: 'images/4-IMG_6476.jpg' },
];

// Helpers
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};
window.scrollToSection = scrollToSection; // expose for buttons

// Lightweight / low-bandwidth toggle: swap to smaller images and disable autoplay.
function enableLiteMode() {
  document.body.dataset.lite = "1";
  heroSlides = heroSlides.map(s => ({ ...s, image: s.image.startsWith('http') ? s.image + "&q=40" : s.image }));
  categoryData = categoryData.map(c => ({ ...c, image: c.image.startsWith('http') ? c.image + "&q=40" : c.image }));
  jobData = jobData.map(j => ({ ...j, image: j.image.startsWith('http') ? j.image + "&q=40" : j.image }));
}

const translations = {
  en: {
    hero_title: "Hire trusted experts or buy farm products in one trusted marketplace.",
  },
  tw: {
    hero_title: "Fa anidaso wɔ adwumayɛfo a wɔdi nokware; sika bɛgyae sɛ wɔadi dwuma yiye.",
  },
  ga: {
    hero_title: "Gbaa okɛji lɛi lɛ nɔ ni ebaaa, gbɛi kɛ fee tso ngɛ boi.",
  },
  ew: {
    hero_title: "Ŋlɔ ɖoɖowo siwo tso anyi, nàkpɔ nu si wòagblẽ be wòadɔ sika yi.",
  },
};

function applyLang(lang) {
  const title = document.querySelector('[data-i18n="hero_title"]');
  if (title && translations[lang]?.hero_title) {
    title.textContent = translations[lang].hero_title;
  }
}

// Render functions
function renderCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  const fromParam = encodeURIComponent(window.location.pathname + window.location.search + '#categories');
  const liveParam = USE_API ? '&data=live' : '';
  grid.innerHTML = categoryData.slice(0, 6).map(cat => `
    <a href="category.html?cat=${encodeURIComponent(cat.name)}&from=${fromParam}${liveParam}" class="card rounded-2xl overflow-hidden block hover:-translate-y-1 transition transform">
      <div class="h-32 bg-cover bg-center" style="background-image:url('${cat.image}')"></div>
      <div class="p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide" style="color:${cat.color}">${cat.name}</p>
        <p class="font-semibold text-lg">${cat.description}</p>
        <p class="text-sm text-primary-light inline-flex items-center gap-1">Tap to view experts <span aria-hidden="true">→</span></p>
      </div>
    </a>
  `).join('');
}

function getCheckedSkills() {
  return Array.from(document.querySelectorAll('[data-skill]:checked')).map(cb => cb.dataset.skill);
}

async function renderExperts(filter = 'All', skillText = '', locationText = '') {
  const list = document.getElementById('expert-list');
  const tableBody = document.getElementById('expert-table-body');
  if (!list) return;
  const checkedSkills = getCheckedSkills();
  const verifiedFilter = document.getElementById('expert-verified')?.value || 'any';
  const useRemote = USE_API && document.getElementById('expert-pagination');
  if (useRemote) {
    marketState.experts.skill = skillText || '';
    marketState.experts.location = locationText || '';
    marketState.experts.verified = verifiedFilter;
    marketState.experts.category = filter;
    const params = { role: 'expert' };
    if (skillText) params.q = skillText;
    if (filter && filter !== 'All') params.q = params.q ? `${params.q} ${filter}` : filter;
    if (locationText) params.location = locationText;
    if (verifiedFilter === 'verified') params.verified_id = 'true';
    try {
      const data = await fetchPaginated('profiles', params, marketState.experts.page);
      const results = data.results || [];
      if (!results.length) {
        list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No experts match your filters.</div>`;
        if (tableBody) tableBody.innerHTML = '';
        renderPagination('expert-pagination', 'experts', data);
        return;
      }
      const mapped = results.map(profile => ({
        name: profile.username,
        role: profile.role || 'Expert',
        location: profile.location || 'Ghana',
        verified: Boolean(profile.verified_id || profile.verified_trade || profile.verified_background),
        photo: profile.avatar_url || 'images/IMG_6751.jpg',
        profileUrl: `expert-profile.html?user=${profile.username}`,
      }));
      list.innerHTML = mapped.map(expert => `
        <article class="card rounded-2xl p-4 space-y-2">
          <div class="flex gap-3">
            <img src="${expert.photo}" alt="${expert.name}" class="w-14 h-14 rounded-xl object-cover" loading="lazy">
            <div>
              <p class="text-sm text-slate-300">${expert.location}</p>
              <a href="${expert.profileUrl}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#experts')}` : ''}" class="font-semibold hover:text-primary">${expert.name}</a>
              <p class="text-sm text-slate-300">${expert.role}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <span class="px-2 py-1 rounded-lg ${expert.verified ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}">${expert.verified ? 'Verified' : 'Pending verify'}</span>
          </div>
        </article>
      `).join('');
      if (tableBody) {
        tableBody.innerHTML = mapped.map(expert => `
          <tr class="border-b border-slate-700/40">
            <td class="px-4 py-3"><a href="${expert.profileUrl}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#experts')}` : ''}" class="text-primary hover:underline">${expert.name}</a></td>
            <td class="px-4 py-3 text-slate-200">${expert.role}</td>
            <td class="px-4 py-3 text-slate-200">${expert.location}</td>
            <td class="px-4 py-3 text-slate-200">${expert.verified ? 'Verified' : 'Pending'}</td>
          </tr>
        `).join('');
      }
      renderPagination('expert-pagination', 'experts', data);
      return;
    } catch (err) {
      // fall back to local data
    }
  }
  const availDays = Number(document.getElementById('expert-availability')?.value || 0);
  const minRate = Number(document.getElementById('expert-rate-min')?.value || 0);
  const maxRate = Number(document.getElementById('expert-rate-max')?.value || 0);
  const filtered = expertData.filter(expert => {
    const matchesCategory = filter === 'All' || expert.skills.some(s => s.toLowerCase() === filter.toLowerCase());
    const matchesSkill = !skillText || expert.skills.some(s => s.toLowerCase().includes(skillText.toLowerCase())) || expert.role.toLowerCase().includes(skillText.toLowerCase());
    const matchesMulti = !checkedSkills.length || checkedSkills.some(s => expert.skills.includes(s));
    const matchesLocation = !locationText || expert.location.toLowerCase().includes(locationText.toLowerCase());
    const matchesVerified = verifiedFilter === 'any' || (verifiedFilter === 'verified' ? expert.verified : !expert.verified);
    const matchesAvailability = !expert.available_in || !availDays || expert.available_in <= availDays;
    const matchesRateMin = !minRate || (expert.rate_min || 0) >= minRate;
    const matchesRateMax = !maxRate || (expert.rate_max || expert.rate_min || 0) <= maxRate || maxRate === 0;
    return matchesCategory && matchesSkill && matchesMulti && matchesLocation && matchesVerified && matchesAvailability && matchesRateMin && matchesRateMax;
  });
  if (!filtered.length) {
    list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No experts match your filters.</div>`;
    if (tableBody) tableBody.innerHTML = '';
    return;
  }
  list.innerHTML = filtered.map(expert => `
    <article class="card rounded-2xl p-4 space-y-2">
      <div class="flex gap-3">
        <img src="${expert.photo}" alt="${expert.name}" class="w-14 h-14 rounded-xl object-cover" loading="lazy">
        <div>
          <p class="text-sm text-slate-300">${expert.location}</p>
          <a href="${expert.profileUrl}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#experts')}` : ''}" class="font-semibold hover:text-primary">${expert.name}</a>
          <p class="text-sm text-slate-300">${expert.role}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <span class="px-2 py-1 rounded-lg ${expert.verified ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}">${expert.verified ? 'Verified' : 'Pending verify'}</span>
        <span class="px-2 py-1 rounded-lg bg-white/10">${expert.rating} ★ · ${expert.jobs} jobs</span>
        ${expert.skills.map(s => `<span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10">${s}</span>`).join('')}
      </div>
      ${expert.portfolio ? `<div class="flex gap-2">${expert.portfolio.slice(0,2).map(p => `<img src="${p}" loading="lazy" alt="Portfolio item" class="w-16 h-16 rounded-lg object-cover border border-white/10">`).join('')}</div>` : ''}
      ${expert.rate_min ? `<p class="text-xs text-slate-300">Typical: GHS ${expert.rate_min}-${expert.rate_max || expert.rate_min}</p>` : ''}
    </article>
  `).join('');
  if (tableBody) {
    tableBody.innerHTML = filtered.map(expert => `
      <tr class="border-b border-slate-700/40">
        <td class="px-4 py-3"><a href="${expert.profileUrl}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#experts')}` : ''}" class="text-primary hover:underline">${expert.name}</a></td>
        <td class="px-4 py-3 text-slate-200">${expert.role}</td>
        <td class="px-4 py-3 text-slate-200">${expert.location}</td>
        <td class="px-4 py-3 text-slate-200">${expert.rating} / 5</td>
      </tr>
    `).join('');
  }
}

function renderExpertFilter(active = activeExpertCategory || 'All') {
  activeExpertCategory = active;
  const filter = document.getElementById('expert-filter');
  if (!filter) return;
  filter.innerHTML = ['All', ...new Set(categoryData.map(c => c.name))].map(name => `
    <button class="px-3 py-2 rounded-full border ${active === name ? 'border-primary bg-primary/20 text-primary' : 'border-white/20'} text-sm font-semibold" data-cat="${name}">${name}</button>
  `).join('');
}

async function renderJobs(text = '', locationText = '', status = 'All') {
  const list = document.getElementById('job-list');
  if (!list) return;
  const useRemote = USE_API && document.getElementById('job-pagination');
  if (useRemote) {
    marketState.jobs.keyword = text || '';
    marketState.jobs.location = locationText || '';
    marketState.jobs.status = status || 'All';
    const params = {};
    if (text) params.q = text;
    if (locationText) params.location = locationText;
    if (status && status !== 'All') {
      const map = {
        'Applications open': 'applications_open',
        'Shortlisting': 'shortlisting',
        'Pre-funded escrow': 'prefunded',
        'In progress': 'in_progress',
        'Completed': 'completed',
      };
      params.status = map[status] || status.toLowerCase().replace(/\s+/g, '_');
    }
    try {
      const data = await fetchPaginated('jobs', params, marketState.jobs.page);
      const results = data.results || [];
      if (!results.length) {
        list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No jobs match your filters.</div>`;
        const tableBody = document.getElementById('job-table-body');
        if (tableBody) tableBody.innerHTML = '';
        renderPagination('job-pagination', 'jobs', data);
        return;
      }
      const mapped = results.map(job => ({
        id: job.id,
        title: job.title,
        location: job.location || 'Ghana',
        budget: `GHS ${job.budget}`,
        status: (job.status || '').replace(/_/g, ' '),
        image: job.image || 'images/IMG_6854.jpg',
        url: `job-detail.html?id=${job.id}`,
      }));
      list.innerHTML = mapped.map(job => `
        <article class="card rounded-2xl overflow-hidden">
          <div class="h-36 bg-cover bg-center" style="background-image:url('${job.image}')" loading="lazy"></div>
          <div class="p-4 space-y-1">
            <p class="text-xs uppercase tracking-wide text-slate-300">${job.location}</p>
            <a href="${job.url}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#jobs')}` : ''}" class="font-semibold text-lg hover:text-primary">${job.title}</a>
            <p class="text-sm text-slate-300">${job.budget}</p>
            <span class="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-semibold">${job.status}</span>
          </div>
        </article>
      `).join('');
      const tableBody = document.getElementById('job-table-body');
      if (tableBody) {
        tableBody.innerHTML = mapped.map(job => `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3"><a href="${job.url}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#jobs')}` : ''}" class="text-primary hover:underline">${job.title}</a></td>
            <td class="px-4 py-3 text-slate-600">${job.location}</td>
            <td class="px-4 py-3 text-slate-600">${job.budget}</td>
            <td class="px-4 py-3 text-slate-600">${job.status}</td>
          </tr>
        `).join('');
      }
      renderPagination('job-pagination', 'jobs', data);
      return;
    } catch (err) {
      // fall back to local data
    }
  }
  const filtered = jobData.filter(job => {
    const matchesText = !text || job.title.toLowerCase().includes(text.toLowerCase()) || job.location.toLowerCase().includes(text.toLowerCase());
    const matchesLocation = !locationText || job.location.toLowerCase().includes(locationText.toLowerCase());
    const matchesStatus = status === 'All' || job.status.toLowerCase() === status.toLowerCase();
    return matchesText && matchesLocation && matchesStatus;
  });
  if (!filtered.length) {
    list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No jobs match your filters.</div>`;
    const tableBody = document.getElementById('job-table-body');
    if (tableBody) tableBody.innerHTML = '';
    return;
  }
  list.innerHTML = filtered.map(job => `
    <article class="card rounded-2xl overflow-hidden">
      <div class="h-36 bg-cover bg-center" style="background-image:url('${job.image}')" loading="lazy"></div>
      <div class="p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-300">${job.location}</p>
        <a href="${job.url}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#jobs')}` : ''}" class="font-semibold text-lg hover:text-primary">${job.title}</a>
        <p class="text-sm text-slate-300">${job.budget}</p>
        <span class="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-semibold">${job.status}</span>
      </div>
    </article>
  `).join('');

  const tableBody = document.getElementById('job-table-body');
  if (tableBody) {
    tableBody.innerHTML = filtered.map(job => `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-3"><a href="${job.url}${LIVE_QS}${window.location.pathname.includes('marketplace') ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#jobs')}` : ''}" class="text-primary hover:underline">${job.title}</a></td>
        <td class="px-4 py-3 text-slate-600">${job.location}</td>
        <td class="px-4 py-3 text-slate-600">${job.budget}</td>
        <td class="px-4 py-3 text-slate-600">${job.status}</td>
      </tr>
    `).join('');
  }
}

function getStoredProducts() {
  try {
    const raw = localStorage.getItem('activate_products');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function getAllProducts() {
  const stored = getStoredProducts();
  return [...stored, ...productData];
}

function renderProductFilters(active = activeProductCategory || 'All') {
  activeProductCategory = active;
  const filter = document.getElementById('product-filter');
  if (!filter) return;
  const categories = ['All', ...new Set(getAllProducts().map(p => p.category))];
  filter.innerHTML = categories.map(name => `
    <button class="px-3 py-2 rounded-full border ${active === name ? 'border-primary bg-primary/20 text-primary' : 'border-white/20'} text-sm font-semibold" data-prod-cat="${name}">${name}</button>
  `).join('');
}

async function renderProducts(filter = 'All', query = '', locationText = '', maxPrice = 0) {
  const list = document.getElementById('product-list');
  const tableBody = document.getElementById('product-table-body');
  if (!list && !tableBody) return;
  const useRemote = USE_API && document.getElementById('product-pagination');
  if (useRemote) {
    marketState.products.query = query || '';
    marketState.products.location = locationText || '';
    marketState.products.maxPrice = maxPrice || 0;
    marketState.products.category = filter || 'All';
    const params = {};
    if (query) params.q = query;
    if (locationText) params.location = locationText;
    if (maxPrice) params.max_price = maxPrice;
    if (filter && filter !== 'All') params.category = filter;
    try {
      const data = await fetchPaginated('products', params, marketState.products.page);
      const results = data.results || [];
      const mapped = results.map(product => ({
        ...product,
        url: `product-detail.html?id=${product.id}`,
        sellerUrl: product.seller_name ? `seller-profile.html?user=${product.seller_name}` : '#',
      }));
      if (list) {
        if (!mapped.length) {
          list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No products match your filters.</div>`;
        } else {
          list.innerHTML = mapped.map(product => `
            <article class="card rounded-2xl overflow-hidden">
              <img src="${product.image_url || product.image || ''}" alt="${product.name}" class="w-full h-40 object-cover" loading="lazy">
              <div class="p-4 space-y-2">
                <p class="text-xs uppercase tracking-wide text-slate-300">${product.category}</p>
            <a href="${product.url}${LIVE_QS}${(window.location.pathname.includes('marketplace') || window.location.pathname.includes('products')) ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#products')}` : ''}" class="font-semibold text-lg hover:text-primary">${product.name}</a>
                <p class="text-sm text-slate-300">GHS ${product.price} · ${product.unit} · Qty ${product.quantity}</p>
                <p class="text-sm text-slate-400">${product.location}</p>
                <p class="text-sm text-slate-300">Seller: <a href="${product.sellerUrl}" class="text-primary-light hover:text-white">${product.seller || product.seller_name || 'Seller'}</a></p>
              </div>
            </article>
          `).join('');
        }
      }
      if (tableBody) {
        tableBody.innerHTML = mapped.map(product => `
          <tr class="border-b border-slate-700/40">
            <td class="px-4 py-3"><a href="${product.url}${LIVE_QS}${(window.location.pathname.includes('marketplace') || window.location.pathname.includes('products')) ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#products')}` : ''}" class="text-primary hover:underline">${product.name}</a></td>
            <td class="px-4 py-3 text-slate-200">${product.category}</td>
            <td class="px-4 py-3 text-slate-200">GHS ${product.price} / ${product.unit}</td>
            <td class="px-4 py-3 text-slate-200">${product.quantity}</td>
            <td class="px-4 py-3 text-slate-200">${product.location}</td>
            <td class="px-4 py-3"><a href="${product.sellerUrl}" class="text-primary hover:underline">${product.seller || product.seller_name || 'Seller'}</a></td>
          </tr>
        `).join('');
      }
      renderPagination('product-pagination', 'products', data);
      return;
    } catch (err) {
      // fall back to local data
    }
  }
  const items = getAllProducts();
  const filtered = items.filter(product => {
    const matchesCategory = filter === 'All' || product.category === filter;
    const matchesQuery = !query || product.name.toLowerCase().includes(query.toLowerCase()) || product.category.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = !locationText || product.location.toLowerCase().includes(locationText.toLowerCase());
    const matchesPrice = !maxPrice || product.price <= maxPrice;
    return matchesCategory && matchesQuery && matchesLocation && matchesPrice;
  });
  if (list) {
    if (!filtered.length) {
      list.innerHTML = `<div class="col-span-full card rounded-2xl p-6 text-center text-slate-200">No products match your filters.</div>`;
    } else {
      list.innerHTML = filtered.map(product => `
        <article class="card rounded-2xl overflow-hidden">
          <img src="${product.image || product.image_url || ''}" alt="${product.name}" class="w-full h-40 object-cover" loading="lazy">
          <div class="p-4 space-y-2">
            <p class="text-xs uppercase tracking-wide text-slate-300">${product.category}</p>
            <a href="${product.url}${LIVE_QS}${(window.location.pathname.includes('marketplace') || window.location.pathname.includes('products')) ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#products')}` : ''}" class="font-semibold text-lg hover:text-primary">${product.name}</a>
            <p class="text-sm text-slate-300">GHS ${product.price} · ${product.unit} · Qty ${product.quantity}</p>
            <p class="text-sm text-slate-400">${product.location}</p>
            <p class="text-sm text-slate-300">Seller: <a href="${product.sellerUrl || '#'}" class="text-primary-light hover:text-white">${product.seller || product.seller_name || 'Seller'}</a></p>
          </div>
        </article>
      `).join('');
    }
  }
  if (tableBody) {
    tableBody.innerHTML = filtered.map(product => `
      <tr class="border-b border-slate-700/40">
        <td class="px-4 py-3"><a href="${product.url}${LIVE_QS}${(window.location.pathname.includes('marketplace') || window.location.pathname.includes('products')) ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#products')}` : ''}" class="text-primary hover:underline">${product.name}</a></td>
        <td class="px-4 py-3 text-slate-200">${product.category}</td>
        <td class="px-4 py-3 text-slate-200">GHS ${product.price} / ${product.unit}</td>
        <td class="px-4 py-3 text-slate-200">${product.quantity}</td>
        <td class="px-4 py-3 text-slate-200">${product.location}</td>
        <td class="px-4 py-3"><a href="${product.sellerUrl || '#'}" class="text-primary hover:underline">${product.seller || product.seller_name || 'Seller'}</a></td>
      </tr>
    `).join('');
  }
}

async function renderProductDetail() {
  const wrap = document.getElementById('product-detail');
  if (!wrap) return;
  const id = new URLSearchParams(window.location.search).get('id');
  let product = getAllProducts().find(p => p.id === id) || getAllProducts()[0];
  if (USE_API && id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/`);
      if (res.ok) {
        const direct = await res.json();
        product = {
          ...direct,
          url: `product-detail.html?id=${direct.id}`,
          sellerUrl: direct.seller_name ? `seller-profile.html?user=${direct.seller_name}` : '#',
        };
      }
    } catch (err) {
      // fall back to local data
    }
  }
  if (!product) return;
  const sellerName = product.seller || product.seller_name || 'Seller';
  const sellerPhone = product.sellerPhone || product.contact_phone || '';
  const sellerEmail = product.sellerEmail || product.contact_email || '';
  wrap.innerHTML = `
    <div class="card rounded-3xl overflow-hidden">
      <img src="${product.image || product.image_url || ''}" alt="${product.name}" class="w-full h-72 object-cover">
      <div class="p-6 space-y-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">${product.category}</p>
        <h1 class="text-2xl font-bold">${product.name}</h1>
        <p class="text-slate-600">Price: <span class="font-semibold">GHS ${product.price}</span> per ${product.unit}</p>
        <p class="text-slate-600">Available quantity: <span class="font-semibold">${product.quantity}</span></p>
        <p class="text-slate-600">Location: ${product.location}</p>
        <p class="text-slate-600">Seller: <a href="${product.sellerUrl || '#'}" class="text-primary hover:underline">${sellerName}</a></p>
        <div class="flex flex-wrap gap-2">
          <button id="contact-seller-btn" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold">Contact seller</button>
          <button id="bulk-quote-btn" class="px-4 py-2 rounded-lg border border-slate-300 font-semibold">Request bulk quote</button>
        </div>
        <div id="contact-seller-form" class="hidden space-y-3 pt-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <p class="text-sm font-semibold">Seller contact details</p>
            <p class="text-sm text-slate-600">Phone: <span class="font-semibold">${sellerPhone || 'Available after request'}</span></p>
            <p class="text-sm text-slate-600">Email: <span class="font-semibold">${sellerEmail || 'Available after request'}</span></p>
            <p class="text-sm text-slate-600">Location: <span class="font-semibold">${product.location}</span></p>
            <div class="pt-2">
              <button id="chat-seller-btn" type="button" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold">Chat seller</button>
              <span class="text-xs text-slate-500 ml-2">Login required for chat.</span>
            </div>
          </div>
          <form id="contact-seller-message" class="grid md:grid-cols-2 gap-3">
            <input name="name" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Your name">
            <input name="phone" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Phone or WhatsApp">
            <input name="email" type="email" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Email (optional)">
            <textarea name="message" rows="3" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Message to seller"></textarea>
            <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold md:col-span-2">Send message</button>
          </form>
        </div>
        <form id="bulk-quote-form" class="hidden grid md:grid-cols-2 gap-3 pt-3">
          <input name="business" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Business/Client name">
          <input name="contact" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Phone/WhatsApp">
          <input name="quantity" type="number" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Quantity needed">
          <input name="delivery" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Delivery location">
          <input name="date" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Needed by (date)">
          <input name="priceTarget" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Target price (optional)">
          <textarea name="notes" rows="3" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Extra notes (packaging, delivery, payment)"></textarea>
          <button type="submit" class="px-4 py-2 rounded-lg border border-slate-300 font-semibold md:col-span-2">Submit quote request</button>
        </form>
      </div>
    </div>
  `;

  const contactBtn = document.getElementById('contact-seller-btn');
  const bulkBtn = document.getElementById('bulk-quote-btn');
  const contactForm = document.getElementById('contact-seller-form');
  const contactMessageForm = document.getElementById('contact-seller-message');
  const chatSellerBtn = document.getElementById('chat-seller-btn');
  const bulkForm = document.getElementById('bulk-quote-form');
  if (contactBtn && contactForm) {
    contactBtn.addEventListener('click', () => {
      contactForm.classList.toggle('hidden');
      bulkForm?.classList.add('hidden');
    });
  }
  if (bulkBtn && bulkForm) {
    bulkBtn.addEventListener('click', () => {
      bulkForm.classList.toggle('hidden');
      contactForm?.classList.add('hidden');
    });
  }
  if (contactMessageForm) {
    contactMessageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      quickToast('Message sent to seller');
      contactMessageForm.reset();
      contactForm?.classList.add('hidden');
    });
  }
  if (chatSellerBtn) {
    chatSellerBtn.addEventListener('click', () => {
      const loggedIn = !!localStorage.getItem('jwt_access');
      const name = contactMessageForm?.querySelector('[name="name"]')?.value || localStorage.getItem('user_name') || 'Buyer';
      const phone = contactMessageForm?.querySelector('[name="phone"]')?.value || '';
      const email = contactMessageForm?.querySelector('[name="email"]')?.value || '';
      const messageLines = [
        `Hi ${sellerName}, I'm ${name}.`,
        phone ? `Phone/WhatsApp: ${phone}` : null,
        email ? `Email: ${email}` : null,
        `Interested in ${product.name}.`,
      ].filter(Boolean).join(' ');
      if (!loggedIn) {
        setPendingChat(sellerName, messageLines);
        const next = `chat.html?new=${encodeURIComponent(sellerName)}&message=${encodeURIComponent(messageLines)}`;
        window.location.href = `login.html?next=${encodeURIComponent(next)}`;
        return;
      }
      const threadId = createChatThread(sellerName, messageLines);
      window.location.href = `chat.html?open=${encodeURIComponent(threadId)}`;
    });
  }
  if (bulkForm) {
    bulkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(bulkForm).entries());
      const loggedIn = !!localStorage.getItem('jwt_access');
      if (USE_API && loggedIn) {
        fetch(`${API_BASE_URL}/quotes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwt_access')}` },
          body: JSON.stringify({
            product: product.id,
            quantity: Number(data.quantity || 0),
            delivery_location: data.delivery || '',
            needed_by: data.date || '',
            target_price: data.priceTarget || null,
            notes: data.notes || '',
          }),
        }).then(() => {
          quickToast('Quote request submitted');
        }).catch(() => quickToast('Quote request failed', 'error'));
      } else {
        const list = JSON.parse(localStorage.getItem('activate_quotes') || '[]');
        list.unshift({ id: `quote-${Date.now()}`, productId: product.id, productName: product.name, seller: sellerName, ...data });
        localStorage.setItem('activate_quotes', JSON.stringify(list));
      }
      if (loggedIn) {
        const intro = [
          `Quote request for ${product.name}`,
          data.quantity ? `Qty: ${data.quantity}` : null,
          data.delivery ? `Delivery: ${data.delivery}` : null,
          data.date ? `Needed by: ${data.date}` : null,
          data.priceTarget ? `Target price: ${data.priceTarget}` : null,
          data.notes ? `Notes: ${data.notes}` : null,
        ].filter(Boolean).join(' | ');
        const threadId = createChatThread(sellerName, intro);
        quickToast('Quote request submitted. Opening chat...');
        window.location.href = `chat.html?open=${encodeURIComponent(threadId)}`;
        return;
      }
      quickToast('Quote request submitted. Log in to continue via chat.');
      bulkForm.reset();
      bulkForm.classList.add('hidden');
    });
  }
}

async function renderExpertProfile() {
  const wrap = document.getElementById('expert-profile');
  if (!wrap) return;
  const userId = new URLSearchParams(window.location.search).get('user');
  let target = expertData.find(e => e.id === userId) || expertData[0];
  if (USE_API && userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/profiles/?role=expert&q=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || data.data || []);
        const profile = list.find(p => p.username === userId) || list[0];
        if (profile) {
          target = {
            id: profile.username,
            name: profile.username,
            role: profile.role || 'Expert',
            location: profile.location || 'Ghana',
            photo: profile.avatar_url || 'images/IMG_6751.jpg',
            skills: [],
            rating: profile.rating || 0,
            jobs: profile.jobs || 0,
          };
        }
      }
    } catch (err) {
      // fall back to local data
    }
  }
  if (!target) {
    wrap.innerHTML = `<p class="text-sm text-slate-500">Expert not found.</p>`;
    return;
  }
  wrap.innerHTML = `
    <div class="flex flex-col md:flex-row gap-4">
      <img src="${target.photo}" alt="${target.name}" class="w-24 h-24 rounded-xl object-cover">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-500">${target.location}</p>
        <h1 class="text-2xl font-bold">${target.name}</h1>
        <p class="text-slate-600">${target.role}</p>
        <p class="text-sm text-slate-500">${target.rating || 0} * - ${target.jobs || 0} jobs</p>
      </div>
    </div>
    ${(target.skills && target.skills.length) ? `
    <div class="flex flex-wrap gap-2">
      ${(target.skills || []).map(s => `<span class="px-2 py-1 rounded-lg bg-slate-100 text-sm">${s}</span>`).join('')}
    </div>` : ''}
    <div class="flex gap-2">
      <a href="chat.html?new=${encodeURIComponent(target.name)}" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold">Message expert</a>
      <a href="signup.html" class="px-4 py-2 rounded-lg border border-slate-200 font-semibold">Hire this expert</a>
    </div>
  `;
}

function renderSellerProfile() {
  const wrap = document.getElementById('seller-profile');
  if (!wrap) return;
  const sellerId = new URLSearchParams(window.location.search).get('user');
  const products = getAllProducts().filter(p => p.sellerId === sellerId || p.seller === sellerId || p.seller_name === sellerId);
  const sellerName = products[0]?.seller || products[0]?.seller_name || 'Seller';
  const sellerPhone = products[0]?.sellerPhone || products[0]?.contact_phone || 'Available on request';
  const sellerEmail = products[0]?.sellerEmail || products[0]?.contact_email || 'Available on request';
  wrap.innerHTML = `
    <div class="card rounded-3xl p-6 space-y-2">
      <p class="text-xs uppercase tracking-wide text-slate-500">Seller profile</p>
      <h1 class="text-2xl font-bold">${sellerName}</h1>
      <p class="text-slate-600">Verified vendor - Ghana</p>
      <div class="text-sm text-slate-600 space-y-1">
        <p>Phone: <span class="font-semibold">${sellerPhone}</span></p>
        <p>Email: <span class="font-semibold">${sellerEmail}</span></p>
      </div>
    </div>
  `;
  const list = document.getElementById('seller-products');
  if (list) {
    list.innerHTML = products.map(product => `
      <article class="card rounded-2xl overflow-hidden">
        <img src="${product.image || product.image_url || ''}" alt="${product.name}" class="w-full h-40 object-cover" loading="lazy">
        <div class="p-4 space-y-2">
          <p class="text-xs uppercase tracking-wide text-slate-300">${product.category}</p>
            <a href="${product.url}${LIVE_QS}${(window.location.pathname.includes('marketplace') || window.location.pathname.includes('products')) ? `&from=${encodeURIComponent(window.location.pathname + window.location.search + '#products')}` : ''}" class="font-semibold text-lg hover:text-primary">${product.name}</a>
          <p class="text-sm text-slate-300">GHS ${product.price} - ${product.unit} - Qty ${product.quantity}</p>
          <p class="text-sm text-slate-400">${product.location}</p>
        </div>
      </article>
    `).join('');
  }
  const formWrap = document.getElementById('seller-quote-form');
  if (formWrap) {
    formWrap.innerHTML = `
      <form id="seller-quote-template" class="grid md:grid-cols-2 gap-3">
        <input name="client" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Client name">
        <input name="contact" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Client phone/email">
        <input name="product" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Product">
        <input name="price" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Unit price (GHS)">
        <input name="quantity" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Quantity offered">
        <input name="delivery" class="rounded-lg border border-slate-300 px-3 py-2" placeholder="Delivery terms">
        <textarea name="notes" rows="3" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Extra notes"></textarea>
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold md:col-span-2">Send quote template</button>
      </form>
    `;
    const form = document.getElementById('seller-quote-template');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      quickToast('Quote sent to client');
      form.reset();
    });
  }
}
function renderDisputes() {
  const list = document.getElementById('dispute-list');
  if (!list) return;
  list.innerHTML = disputes.map(d => `
    <article class="card rounded-2xl p-4 space-y-2">
      <div class="flex gap-2">
        <span class="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-xs">${d.status}</span>
        <span class="px-2 py-1 rounded-lg bg-white/10 text-xs">${d.action}</span>
      </div>
      <p class="font-semibold">${d.id}</p>
      <p class="text-sm text-slate-300">${d.topic}</p>
      <p class="text-xs text-slate-400">${d.amount}</p>
      ${d.timer ? `<p class="text-xs text-slate-400">Auto-release in: ${d.timer}</p>` : ''}
    </article>
  `).join('');
}

function renderReviews() {
  const list = document.getElementById('review-list');
  if (!list) return;
  list.innerHTML = reviews.map(r => `
    <article class="card rounded-2xl p-4 space-y-2">
      <div class="flex gap-2">
        <span class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs">${r.state || 'Published'}</span>
        <span class="px-2 py-1 rounded-lg bg-white/10 text-xs">${r.contract}</span>
      </div>
      <p class="font-semibold">${r.from} → ${r.to}</p>
      <p class="text-sm text-slate-300">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</p>
      <p class="text-sm">${r.text}</p>
      ${r.evidence ? `<div class="flex gap-2">${r.evidence.slice(0,2).map(p => `<img src="${p}" loading="lazy" alt="Evidence" class="w-16 h-16 rounded-lg object-cover border border-white/10">`).join('')}</div>` : ''}
      ${r.private_note ? `<p class="text-xs text-amber-200">Private note to admins: ${r.private_note}</p>` : ''}
    </article>
  `).join('');
}

// Carousel
function initCarousel() {
  const slidesContainer = document.getElementById('top-slides');
  const dotsContainer = document.getElementById('top-dots');
  if (!slidesContainer || !dotsContainer) return;

  slidesContainer.innerHTML = heroSlides.map((slide) => `
    <div class="min-w-full h-72 lg:h-96 relative">
      <img src="${slide.image}" alt="${slide.title}" class="w-full h-full object-cover" loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
      <div class="absolute bottom-5 left-5 right-5 space-y-2">
        <p class="text-sm text-slate-200">${slide.text}</p>
        <p class="text-xl lg:text-2xl font-semibold">${slide.title}</p>
      </div>
    </div>
  `).join('');
  dotsContainer.innerHTML = heroSlides.map((_, idx) => `
    <button class="w-2.5 h-2.5 rounded-full bg-white/40 ${idx === 0 ? '!bg-white' : ''}" data-idx="${idx}" aria-label="Go to slide ${idx + 1}"></button>
  `).join('');

  let current = 0;
  const update = (idx) => {
    current = idx;
    slidesContainer.style.transform = `translateX(-${idx * 100}%)`;
    dotsContainer.querySelectorAll('button').forEach((btn, i) => {
      btn.classList.toggle('!bg-white', i === idx);
    });
  };
  dotsContainer.addEventListener('click', (e) => {
    if (e.target.dataset.idx !== undefined) {
      update(Number(e.target.dataset.idx));
    }
  });
  if (document.body.dataset.lite !== "1") {
    setInterval(() => update((current + 1) % heroSlides.length), 5000);
  }
}

// Event wiring
function wireFilters() {
  const filter = document.getElementById('expert-filter');
  if (filter) {
    filter.addEventListener('click', (e) => {
      if (e.target.dataset.cat) {
        const skillVal = document.getElementById('expert-skill')?.value || document.getElementById('skill-input')?.value || '';
        const locVal = document.getElementById('expert-location')?.value || document.getElementById('location-input')?.value || '';
        activeExpertCategory = e.target.dataset.cat;
        renderExpertFilter(activeExpertCategory);
        marketState.experts.page = 1;
        renderExperts(activeExpertCategory, skillVal, locVal);
      }
    });
  }

  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      activeExpertCategory = 'All';
      renderExpertFilter(activeExpertCategory);
      marketState.experts.page = 1;
      renderExperts('All', document.getElementById('skill-input')?.value || '', document.getElementById('location-input')?.value || '');
      scrollToSection('experts');
    });
  }

  const navSearch = document.getElementById('nav-search-form');
  if (navSearch) {
    navSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('nav-search')?.value || '';
      activeExpertCategory = 'All';
      renderExpertFilter(activeExpertCategory);
      marketState.experts.page = 1;
      renderExperts('All', val, '');
      scrollToSection('experts');
    });
  }

  const expertsForm = document.getElementById('experts-filter-form');
  if (expertsForm) {
    expertsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const skillVal = document.getElementById('expert-skill').value;
      const locVal = document.getElementById('expert-location').value;
      marketState.experts.page = 1;
      renderExperts(activeExpertCategory, skillVal, locVal);
      scrollToSection('experts');
    });
  }

  const jobsForm = document.getElementById('jobs-filter-form');
  if (jobsForm) {
    jobsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('job-keyword').value;
      const loc = document.getElementById('job-location').value;
      const status = document.getElementById('job-status').value;
      marketState.jobs.page = 1;
      renderJobs(text, loc, status);
      scrollToSection('jobs');
    });
  }

  const viewAllBtn = document.getElementById('jobs-view-all');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      const tableSection = document.getElementById('jobs-table-section');
      tableSection.classList.toggle('hidden');
      const text = document.getElementById('job-keyword').value;
      const loc = document.getElementById('job-location').value;
      const status = document.getElementById('job-status').value;
      renderJobs(text, loc, status);
      tableSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const expertsViewAll = document.getElementById('experts-view-all');
  if (expertsViewAll) {
    expertsViewAll.addEventListener('click', () => {
      const tableSection = document.getElementById('experts-table-section');
      tableSection.classList.toggle('hidden');
      const skillVal = document.getElementById('expert-skill')?.value || '';
      const locVal = document.getElementById('expert-location')?.value || '';
      renderExperts(activeExpertCategory, skillVal, locVal);
      tableSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const productFilter = document.getElementById('product-filter');
  if (productFilter) {
    productFilter.addEventListener('click', (e) => {
      if (e.target.dataset.prodCat) {
        const query = document.getElementById('product-query')?.value || '';
        const loc = document.getElementById('product-location')?.value || '';
        const max = Number(document.getElementById('product-max')?.value || 0);
        activeProductCategory = e.target.dataset.prodCat;
        renderProductFilters(activeProductCategory);
        marketState.products.page = 1;
        renderProducts(activeProductCategory, query, loc, max);
      }
    });
  }

  const productForm = document.getElementById('product-filter-form');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('product-query')?.value || '';
      const loc = document.getElementById('product-location')?.value || '';
      const max = Number(document.getElementById('product-max')?.value || 0);
      marketState.products.page = 1;
      renderProducts(activeProductCategory, query, loc, max);
      scrollToSection('products');
    });
  }

  const productViewAll = document.getElementById('products-view-all');
  if (productViewAll) {
    productViewAll.addEventListener('click', () => {
      const tableSection = document.getElementById('products-table-section');
      tableSection.classList.toggle('hidden');
      const query = document.getElementById('product-query')?.value || '';
      const loc = document.getElementById('product-location')?.value || '';
      const max = Number(document.getElementById('product-max')?.value || 0);
      marketState.products.page = 1;
      renderProducts(activeProductCategory, query, loc, max);
      tableSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-entity]');
    if (!btn) return;
    const entity = btn.dataset.pageEntity;
    const page = Number(btn.dataset.page || 1);
    if (!marketState[entity]) return;
    marketState[entity].page = page;
    if (entity === 'experts') {
      renderExperts(marketState.experts.category, marketState.experts.skill, marketState.experts.location);
    }
    if (entity === 'jobs') {
      renderJobs(marketState.jobs.keyword, marketState.jobs.location, marketState.jobs.status);
    }
    if (entity === 'products') {
      renderProducts(marketState.products.category, marketState.products.query, marketState.products.location, marketState.products.maxPrice);
    }
  });

  const radiusInput = document.getElementById('expert-radius');
  if (radiusInput) {
    radiusInput.addEventListener('input', () => {
      const label = document.getElementById('radius-label');
      if (label) label.textContent = `${radiusInput.value}km`;
    });
  }
}

function init() {
  if (document.getElementById('category-grid')) renderCategories();
  if (document.getElementById('expert-filter')) renderExpertFilter();
  renderSkeleton('expert-list');
  renderSkeleton('job-list');
  renderExperts();
  renderJobs();
  renderDisputes();
  renderReviews();
  renderProductFilters();
  renderProducts();
  renderProductDetail();
  renderSellerProfile();
  renderExpertProfile();
  renderChatUI();
  initCarousel();
  wireFilters();
  if (USE_API) loadRemoteData();
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', () => applyLang(langSelect.value));
  }
}

document.addEventListener('DOMContentLoaded', init);
async function loadRemoteData() {
  renderSkeleton('expert-list');
  renderSkeleton('job-list');
  const token = localStorage.getItem('jwt_access');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const endpoints = [
    { key: 'experts', url: `${API_BASE_URL}/experts/` },
    { key: 'jobs', url: `${API_BASE_URL}/jobs/` },
    { key: 'products', url: `${API_BASE_URL}/products/` },
    { key: 'disputes', url: `${API_BASE_URL}/disputes/` },
    { key: 'reviews', url: `${API_BASE_URL}/reviews/` },
    { key: 'milestones', url: `${API_BASE_URL}/milestones/` },
    { key: 'proposals', url: `${API_BASE_URL}/proposals/` },
    { key: 'notifications', url: `${API_BASE_URL}/notifications/` },
  ];
  try {
    const res = await Promise.all(endpoints.map(e => fetch(e.url, { headers })));
    const json = await Promise.all(res.map(r => r.ok ? r.json() : null));
    json.forEach((payload, idx) => {
      if (!payload) return;
      const data = Array.isArray(payload) ? payload : (payload.data || payload.results || null);
      if (!data) return;
      switch (endpoints[idx].key) {
        case 'experts':
          expertData = data;
          renderExpertFilter(activeExpertCategory);
          renderExperts(activeExpertCategory);
          renderExpertProfile();
          break;
        case 'jobs':
          jobData = data;
          renderJobs();
          break;
        case 'products':
          productData = data.map(p => ({
            ...p,
            url: `product-detail.html?id=${p.id}`,
            sellerUrl: p.seller_name ? `seller-profile.html?user=${p.seller_name}` : (p.seller ? `seller-profile.html?user=${p.seller}` : ''),
          }));
          renderProductFilters();
          renderProducts();
          renderProductDetail();
          renderSellerProfile();
          break;
        case 'disputes':
          disputes = data;
          renderDisputes();
          break;
        case 'reviews':
          reviews = data;
          renderReviews();
          break;
        case 'milestones':
          milestones = data;
          break;
        case 'proposals':
          proposals = data;
          break;
        case 'notifications':
          notifications = data;
          updateBell();
          break;
      }
    });
    remoteLoaded = true;
  } catch (err) {
    console.warn('Remote data fetch failed, using local seed', err);
    showToast?.('Using demo data (offline)', 'error');
  }
}

function updateBell() {
  const count = notifications.filter(n => n.unread).length;
  const badge = document.querySelector('#bell-unread');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}
// Attempt to get user geolocation for "near me" filters
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const radiusLabel = document.getElementById('radius-label');
      if (radiusLabel) radiusLabel.textContent = `${document.getElementById('expert-radius')?.value || 0}km`;
    },
    () => { userLocation = null; },
    { timeout: 4000 }
  );
}




