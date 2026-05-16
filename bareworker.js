// Bare HTTP Worker - minified version
// Handles HTTP requests through the proxy transport
// Based on mercury workshop's bare-mux implementation

let handlers = new Map();
let clientId = 0;

const handleMessage = async (event) => {
  const { data } = event;
  
  if (data.type === 'register') {
    const port = event.ports[0];
    const id = clientId++;
    handlers.set(id, port);
    port.postMessage({ id });
  }
  
  if (data.type === 'request' && handlers.has(data.id)) {
    const port = handlers.get(data.id);
    try {
      const response = await fetch(data.url, {
        method: data.method || 'GET',
        headers: data.headers || {},
        body: data.body || undefined,
        credentials: 'include'
      });
      
      const buffer = await response.arrayBuffer();
      port.postMessage({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        body: buffer
      }, [buffer]);
    } catch (error) {
      port.postMessage({
        error: error.message
      });
    }
  }
};

self.addEventListener('message', handleMessage);
self.addEventListener('connect', (event) => {
  const port = event.ports[0];
  const id = clientId++;
  handlers.set(id, port);
  port.postMessage({ id });
  port.onmessage = handleMessage;
});
