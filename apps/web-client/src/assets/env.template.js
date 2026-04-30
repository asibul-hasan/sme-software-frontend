(function (window) {
  window.__env = window.__env || {};

  // Base API URL
  window.__env.apiUrl = '${API_URL}';

  // Specific ERP Service URLs
  window.__env.erpUrls = {
    adminApiUrl: '${ADMIN_API_URL}',
    coreApiUrl: '${CORE_API_URL}',
    authApiUrl: '${AUTH_API_URL}',
    sysApiUrl: '${SYS_API_URL}',
    finApiUrl: '${FIN_API_URL}',
    hrApiUrl: '${HR_API_URL}',
    invApiUrl: '${INV_API_URL}',
    purApiUrl: '${PUR_API_URL}',
    salApiUrl: '${SAL_API_URL}',
    rptApiUrl: '${RPT_API_URL}',
  };
})(this);
