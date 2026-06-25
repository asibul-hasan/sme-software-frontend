/**
 * Application-wide constant keys and defaults.
 *
 * NOTE: Do not add a "current user" getter here. The current user lives in
 * {@link AuthContextService.user} as a signal — read it reactively from
 * components/services rather than re-parsing localStorage on every access.
 */
export const globalConstants = {
  /**
   * Storage keys. Per the SYS re-plan §4.5, the auth token + active context live in
   * configured auth storage (sessionStorage by default, so two tabs can hold
   * different branches). Keep these stable; renaming invalidates every active session.
   */
  storageKeys: {
    accessToken:        'access_token',
    refreshToken:       'refresh_token',
    userData:           'user_data',
    userPermissions:    'user_permissions',
    userMenu:           'user_menu',
    availableBranches:  'sme_available_branches',
    sidebarCollapsed:   'sme_sidebar_collapsed',
    sidebarExpanded:    'sme_sidebar_expanded',
    // Login "remember last" hints use the same auth storage scope.
    lastUserId:         'sme_last_user_id',
    lastCompanyNo:      'sme_last_company_no',
    lastBranchNo:       'sme_last_branch_no',
  },

  authStorageScope: 'session',

  pagination: {
    defaultPageSize: 10,
    defaultPage:     1,
  },
} as const;
