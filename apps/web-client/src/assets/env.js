(function (window) {
  window.__env = window.__env || {};

  // Base API URL
  window.__env.apiUrl = 'http://localhost:5230/api';

  // Specific ERP Service URLs
  window.__env.erpUrls = {
    adminApiUrl: 'http://localhost:5230/api/admin',
    coreApiUrl: 'http://localhost:5230/api/core',
    authApiUrl: 'http://localhost:5230/api/auth',
    sysApiUrl: 'http://localhost:5230/api/sys',
    finApiUrl: 'http://localhost:5230/api/fin',
    hrApiUrl: 'http://localhost:5230/api/hr',
    invApiUrl: 'http://localhost:5230/api/inv',
    purApiUrl: 'http://localhost:5230/api/pur',
    salApiUrl: 'http://localhost:5230/api/sal',
    rptApiUrl: 'http://localhost:5230/api/rpt',
  };
})(this);
