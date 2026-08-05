(function (window) {
  window.__env = window.__env || {};

  // Retrieve configuration strictly from config.js
  const config = window.__config || {};
  const localUrl = config.apiUrlLocal || '';
  const liveUrl = config.apiUrlLive || '';

  window.__env.apiUrlLocal = localUrl;
  window.__env.apiUrlLive = liveUrl;
  window.__env.version = config.version || '';
  window.__env.production = !!config.production;
  window.__env.hostname = config.hostname || '';

  // Default to localUrl initially
  window.__env.apiUrl = localUrl;

  // Check connectivity to Local API
  function checkLocalHealth() {
    if (!localUrl) {
      window.__env.apiUrl = liveUrl;
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    fetch(localUrl + '/common/lookups/branches', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal,
    })
      .then(() => {
        clearTimeout(timeoutId);
        window.__env.apiUrl = localUrl;
        console.log('Environment: Local API active. Routing requests to:', localUrl);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        window.__env.apiUrl = liveUrl;
        console.log('Environment: Local API unreachable. Falling back to Live:', liveUrl);
      });
  }

  checkLocalHealth();

  window.__env.enableDebug = true;
})(this);
