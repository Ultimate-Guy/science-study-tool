const ADBLOCK = {
  blocked: [
    '*youtube.com/get_video_info?*adformat=*',
    '*googlevideo.com/videoplayback*',
    '*youtube.com/api/stats/ads/*',
    '*youtube.com/pagead/*',
    '*youtube.com/api/stats*',
    '*youtube.com/get_midroll*',
    '*youtube.com/ptracking*',
    '*.facebook.com/ads/*',
    '*youtube.com/youtubei/v1/player*',
    '*youtube.com/s/player*',
    '*graph.facebook.com/ads/*',
    '*.fbcdn.net/ads/*',
    '*facebook.com/tr/*',
    '*analytics.twitter.com/*',
    '*.twitter.com/i/ads/*',
    '*.advertising.com/*',
    '*/ads/*',
    '*/adserver/*',
    '*/banner_ads/*',
    '*/tracking/ads/*',
    '*doubleclick.net*',
    '*googlesyndication.com*',
    '*pagead/i*',
    '*adsense/i*'
  ]
};

const ADRULES = ADBLOCK.blocked.map(pattern => {
  try {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\?/g, '\\?')
      .replace(/\*/g, '.*');
    return new RegExp('^' + regexPattern + '$', 'i');
  } catch (e) {
    console.error('Invalid adblock pattern:', pattern, e);
    return null;
  }
}).filter(Boolean);

function isAdBlocked(url) {
  return ADRULES.some(regex => regex.test(url));
}

const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
self.basePath = self.basePath || basePath;

self.$scramjet = {
  files: {
    wasm: 'https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm',
    sync: 'https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js'
  }
};

importScripts('https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js');
importScripts('https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({ prefix: basePath + 'scramjet/' });

const DEFAULT_WISP_SERVERS = [
  { name: 'Incog Works', url: 'wss://incog.works/wisp/' },
  { name: 'LunarRR', url: 'wss://lunarrr.eminescusm.ro/w/' }
];

let wispConfig = {
  wispurl: DEFAULT_WISP_SERVERS[0].url,
  servers: DEFAULT_WISP_SERVERS,
  autoswitch: true,
  transport: 'epoxy'
};

let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);
resolveConfigReady();

function pingWispServer(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        try { ws.close(); } catch (e) {}
        resolve({ url, success: false, latency: null });
      }, 3000);

      ws.onopen = () => {
        clearTimeout(timeout);
        const latency = Date.now() - start;
        try { ws.close(); } catch (e) {}
        resolve({ url, success: true, latency });
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        try { ws.close(); } catch (e) {}
        resolve({ url, success: false, latency: null });
      };
    } catch (error) {
      resolve({ url, success: false, latency: null });
    }
  });
}

async function chooseBestServer() {
  if (!wispConfig.autoswitch || !wispConfig.servers.length) {
    return wispConfig.wispurl;
  }

  const results = await Promise.all(wispConfig.servers.map(s => pingWispServer(s.url)));
  const healthy = results.filter(r => r.success).sort((a, b) => a.latency - b.latency);
  if (healthy.length) {
    return healthy[0].url;
  }
  return wispConfig.wispurl;
}

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => new Response('Network unavailable', { status: 503, statusText: 'Service Unavailable' }))
  );
});
