const PROXY_STORAGE = {
  transport: 'proxy_transport',
  server: 'proxy_server',
  autoswitch: 'proxy_autoswitch',
  searchEngine: 'proxy_searchEngine',
  bookmarks: 'proxy_bookmarks',
  tabs: 'proxy_tabs',
  activeTab: 'proxy_active_tab'
};

const DEFAULT_WISP_SERVERS = [
  { name: 'Incog Works', url: 'wss://incog.works/wisp/' },
  { name: 'LunarRR', url: 'wss://lunarrr.eminescusm.ro/w/' }
];

const DEFAULT_SEARCH_ENGINES = [
  { id: 'google', name: 'Google', searchUrl: 'https://google.com/search?q=', homeUrl: 'https://google.com' },
  { id: 'duckduckgo', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=', homeUrl: 'https://duckduckgo.com' },
  { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q=', homeUrl: 'https://www.bing.com' },
  { id: 'yahoo', name: 'Yahoo', searchUrl: 'https://search.yahoo.com/search?p=', homeUrl: 'https://search.yahoo.com' }
];

const DEFAULT_BOOKMARKS = [
  { title: 'Google', url: 'https://google.com' },
  { title: 'DuckDuckGo', url: 'https://duckduckgo.com' },
  { title: 'YouTube', url: 'https://youtube.com' },
  { title: 'OpenAI Chat', url: 'https://chat.openai.com' }
];

const DEFAULT_TAB_URL = 'https://google.com';

const state = {
  tabs: [],
  activeTabId: null
};

function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProxySetting(key, defaultValue) {
  const value = localStorage.getItem(PROXY_STORAGE[key]);
  return value === null ? defaultValue : value;
}

function setProxySetting(key, value) {
  localStorage.setItem(PROXY_STORAGE[key], value);
}
function getSearchEngineSetting() {
  const engineId = getProxySetting('searchEngine', 'google');
  return DEFAULT_SEARCH_ENGINES.find((engine) => engine.id === engineId) || DEFAULT_SEARCH_ENGINES[0];
}

function buildSearchUrl(query) {
  const searchEngine = getSearchEngineSetting();
  const encoded = encodeURIComponent(query.trim());
  return `${searchEngine.searchUrl}${encoded}`;
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) return DEFAULT_TAB_URL;
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_TAB_URL;
  if (/^(about|blob|data|file):/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `${location.protocol}${trimmed}`;
  }
  const looksLikeUrl = /\.[a-zA-Z]{2,}(\/|$)/.test(trimmed);
  const looksLikeSearch = trimmed.includes(' ') || !looksLikeUrl;
  if (looksLikeSearch) {
    return buildSearchUrl(trimmed);
  }
  return `https://${trimmed}`;
}
function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];
}

function saveTabs() {
  setStorage(PROXY_STORAGE.tabs, state.tabs);
  setStorage(PROXY_STORAGE.activeTab, state.activeTabId);
}

function renderTabs() {
  const container = document.getElementById('proxy-tabs');
  if (!container) return;
  container.innerHTML = '';

  state.tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'proxy-tab' + (tab.id === state.activeTabId ? ' active' : '');
    button.textContent = tab.title || new URL(tab.history[tab.index] || DEFAULT_TAB_URL).hostname.replace('www.', '');

    button.addEventListener('click', () => {
      if (tab.id !== state.activeTabId) {
        state.activeTabId = tab.id;
        saveTabs();
        renderTabs();
        const activeTab = getActiveTab();
        if (activeTab) {
          navigateTo(activeTab.history[activeTab.index], false);
        }
      }
    });

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close tab';
    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });
    button.appendChild(closeBtn);
    container.appendChild(button);
  });

  const addTab = document.createElement('button');
  addTab.type = 'button';
  addTab.className = 'proxy-tab proxy-tab-add';
  addTab.textContent = '+';
  addTab.title = 'New tab';
  addTab.addEventListener('click', () => createTab());
  container.appendChild(addTab);
}

function createTab(url = DEFAULT_TAB_URL) {
  const normalized = normalizeUrl(url);
  const newTab = {
    id: `tab-${Date.now()}`,
    title: 'New Tab',
    history: [normalized],
    index: 0
  };
  state.tabs.push(newTab);
  state.activeTabId = newTab.id;
  saveTabs();
  renderTabs();
  navigateTo(normalized, false);
}

function closeTab(id) {
  if (state.tabs.length === 1) return;
  const removalIndex = state.tabs.findIndex((tab) => tab.id === id);
  if (removalIndex === -1) return;
  state.tabs.splice(removalIndex, 1);
  if (state.activeTabId === id) {
    const nextTab = state.tabs[Math.max(0, removalIndex - 1)];
    state.activeTabId = nextTab.id;
    saveTabs();
    renderTabs();
    navigateTo(nextTab.history[nextTab.index], false);
  } else {
    saveTabs();
    renderTabs();
  }
}

function loadTabState() {
  const savedTabs = getStorage(PROXY_STORAGE.tabs, null);
  state.tabs = savedTabs && savedTabs.length ? savedTabs : [{ id: 'tab-1', title: 'Home', history: [DEFAULT_TAB_URL], index: 0 }];
  state.activeTabId = getStorage(PROXY_STORAGE.activeTab, state.tabs[0].id);
  if (!state.tabs.some((tab) => tab.id === state.activeTabId)) {
    state.activeTabId = state.tabs[0].id;
  }
}

function updateNavigationButtons() {
  const activeTab = getActiveTab();
  document.getElementById('proxy-back').disabled = !activeTab || activeTab.index <= 0;
  document.getElementById('proxy-forward').disabled = !activeTab || activeTab.index >= activeTab.history.length - 1;
}

function pushHistory(url) {
  const activeTab = getActiveTab();
  if (!activeTab) return;
  if (activeTab.history[activeTab.index] === url) return;
  activeTab.history = activeTab.history.slice(0, activeTab.index + 1);
  activeTab.history.push(url);
  activeTab.index = activeTab.history.length - 1;
  saveTabs();
  updateNavigationButtons();
}

function loadHistoryState() {
  loadTabState();
  renderTabs();
  updateNavigationButtons();
}

function setStatus(message, error = false) {
  const status = document.getElementById('proxy-status');
  if (!status) return;
  status.textContent = message;
  status.style.color = error ? '#ff6b6b' : '#d7d7d7';
}

function updateBookmarkList() {
  const list = document.getElementById('proxy-bookmarks');
  const bookmarks = getStorage(PROXY_STORAGE.bookmarks, DEFAULT_BOOKMARKS);
  list.innerHTML = '';
  bookmarks.forEach((bookmark, index) => {
    const item = document.createElement('li');
    item.textContent = bookmark.title || bookmark.url;
    item.title = bookmark.url;
    item.addEventListener('click', () => navigateTo(bookmark.url));
    item.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const confirmed = confirm(`Remove bookmark '${bookmark.title || bookmark.url}'?`);
      if (confirmed) {
        bookmarks.splice(index, 1);
        setStorage(PROXY_STORAGE.bookmarks, bookmarks);
        updateBookmarkList();
      }
    });
    list.appendChild(item);
  });
}

function setStatus(message, error = false) {
  const status = document.getElementById('proxy-status');
  status.textContent = message;
  status.style.color = error ? '#ff6b6b' : '#d7d7d7';
}

function sendProxyConfig() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  const config = {
    type: 'config',
    wispurl: getProxySetting('server', DEFAULT_WISP_SERVERS[0].url),
    servers: DEFAULT_WISP_SERVERS,
    autoswitch: getProxySetting('autoswitch', 'true') !== 'false',
    transport: getProxySetting('transport', 'epoxy')
  };
  navigator.serviceWorker.controller.postMessage(config);
}

function sendPing() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: 'ping' });
}

function bindServiceWorkerControl() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      sendProxyConfig();
      sendPing();
    });
  }
}

async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return true;
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return false;
  }
}

function bindToolbar() {
  document.getElementById('proxy-go').addEventListener('click', () => {
    const address = document.getElementById('proxy-address').value;
    navigateTo(address);
  });

  document.getElementById('proxy-address').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      navigateTo(event.target.value);
    }
  });

  document.getElementById('proxy-back').addEventListener('click', () => {
    const activeTab = getActiveTab();
    if (!activeTab || activeTab.index <= 0) return;
    activeTab.index -= 1;
    saveTabs();
    navigateTo(activeTab.history[activeTab.index], false);
  });

  document.getElementById('proxy-forward').addEventListener('click', () => {
    const activeTab = getActiveTab();
    if (!activeTab || activeTab.index >= activeTab.history.length - 1) return;
    activeTab.index += 1;
    saveTabs();
    navigateTo(activeTab.history[activeTab.index], false);
  });

  document.getElementById('proxy-reload').addEventListener('click', () => {
    const frame = document.getElementById('proxy-frame');
    frame.src = frame.src || 'about:blank';
  });

  document.getElementById('proxy-return-home').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('proxy-add-bookmark').addEventListener('click', () => {
    const frame = document.getElementById('proxy-frame');
    const currentUrl = frame.src || 'about:blank';
    addBookmark(currentUrl);
  });

  document.getElementById('proxy-bookmark-current').addEventListener('click', () => {
    const currentUrl = document.getElementById('proxy-frame').src || 'about:blank';
    addBookmark(currentUrl);
  });

  document.getElementById('proxy-save-settings').addEventListener('click', () => {
    const transport = document.getElementById('proxy-transport').value;
    const server = document.getElementById('proxy-server').value;
    const searchEngine = document.getElementById('proxy-search-engine').value;
    const autoswitch = document.getElementById('proxy-autoswitch').dataset.enabled === 'true';

    setProxySetting('transport', transport);
    setProxySetting('server', server);
    setProxySetting('searchEngine', searchEngine);
    setProxySetting('autoswitch', autoswitch ? 'true' : 'false');
    sendProxyConfig();
    setStatus(`Saved ${transport} + ${server} + ${searchEngine}`);
  });

  document.getElementById('proxy-autoswitch').addEventListener('click', () => {
    const toggle = document.getElementById('proxy-autoswitch');
    const enabled = toggle.dataset.enabled !== 'true';
    toggle.dataset.enabled = enabled ? 'true' : 'false';
    toggle.textContent = enabled ? 'Enabled' : 'Disabled';
  });
}

function addBookmark(url) {
  if (!url || url === 'about:blank') return;
  const bookmarks = getStorage(PROXY_STORAGE.bookmarks, DEFAULT_BOOKMARKS);
  const existing = bookmarks.find((item) => item.url === url);
  if (!existing) {
    bookmarks.unshift({ title: new URL(url).hostname.replace('www.', ''), url });
    setStorage(PROXY_STORAGE.bookmarks, bookmarks.slice(0, 20));
    updateBookmarkList();
  }
}

function renderServerOptions() {
  const select = document.getElementById('proxy-server');
  select.innerHTML = '';
  DEFAULT_WISP_SERVERS.forEach((server) => {
    const option = document.createElement('option');
    option.value = server.url;
    option.textContent = `${server.name} (${server.url})`;
    select.appendChild(option);
  });
  select.value = getProxySetting('server', DEFAULT_WISP_SERVERS[0].url);

  const transport = document.getElementById('proxy-transport');
  transport.value = getProxySetting('transport', 'epoxy');

  const searchEngine = document.getElementById('proxy-search-engine');
  if (searchEngine) {
    searchEngine.innerHTML = '';
    DEFAULT_SEARCH_ENGINES.forEach((engine) => {
      const option = document.createElement('option');
      option.value = engine.id;
      option.textContent = engine.name;
      searchEngine.appendChild(option);
    });
    searchEngine.value = getProxySetting('searchEngine', 'google');
  }

  const autoswitchButton = document.getElementById('proxy-autoswitch');
  const autoswitch = getProxySetting('autoswitch', 'true') === 'true';
  autoswitchButton.dataset.enabled = autoswitch ? 'true' : 'false';
  autoswitchButton.textContent = autoswitch ? 'Enabled' : 'Disabled';
}

function navigateTo(rawUrl, push = true) {
  const url = normalizeUrl(rawUrl);
  const frame = document.getElementById('proxy-frame');
  const address = document.getElementById('proxy-address');
  address.value = url;
  frame.src = url;
  if (push) pushHistory(url);
  updateNavigationButtons();
  document.getElementById('proxy-page-title').textContent = url;
}

function initPage() {
  bindToolbar();
  bindServiceWorkerControl();
  loadHistoryState();
  updateBookmarkList();
  renderServerOptions();
  ensureServiceWorker().then((registered) => {
    if (registered) {
      if (navigator.serviceWorker.controller) {
        sendProxyConfig();
        sendPing();
      }
      setStatus('Proxy ready');
    } else {
      setStatus('Service worker not available', true);
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'wispChanged') {
      const source = event.data.name || event.data.url || 'WISP';
      setStatus(`Connected via ${source}`);
    }
  });

  const activeTab = getActiveTab();
  const current = activeTab ? activeTab.history[activeTab.index] : null;
  if (current) {
    navigateTo(current, false);
  } else {
    navigateTo(DEFAULT_TAB_URL);
  }
}

initPage();
