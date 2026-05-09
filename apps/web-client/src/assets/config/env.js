(function (window) {
  window.__env = window.__env || {};

  // Retrieve URLs from config.js source
  const config = window.__config || {};

  // Restore fallbacks to prevent 'undefined' which causes relative path issues (like 4202/undefined)
  const localUrl = config.apiUrlLocal || 'http://localhost:8080/api';
  const liveUrl =
    config.apiUrlLive || 'https://sme-software-backend.onrender.com/api';

  console.log('Environment Debug: Config loaded:', config);

  // 1. Set a "Predictive" default (Live)
  window.__env.apiUrl = liveUrl;

  // 2. Perform a "Connection Check" to Local API
  console.log('Environment: Checking connectivity to Local API...');

  fetch(localUrl + '/auth/contexts?user_name=ping', {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-cache',
  })
    .then(() => {
      window.__env.apiUrl = localUrl;
      console.log('Environment: Local API detected. Switching to:', localUrl);
    })
    .catch(() => {
      window.__env.apiUrl = liveUrl;
      console.log('Environment: Local API unreachable. Using Live:', liveUrl);
    });

  window.__env.enableDebug = true;
})(this);
