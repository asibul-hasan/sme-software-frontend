/**
 * Application-wide constant keys and defaults.
 *
 * NOTE: Do not add a "current user" getter here. The current user lives in
 * {@link AuthContextService.user} as a signal — read it reactively from
 * components/services rather than re-parsing localStorage on every access.
 */
export const globalConstants = {
  /**
   * Storage keys. The auth token + active context live in the configured auth storage.
   * Keep these stable; renaming invalidates every active session.
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

  /**
   * Where the token, user, permissions, menu and active context are kept.
   *
   * `local` — survives closing the tab and the browser, so a refresh or a reopened
   * window resumes the session instead of bouncing to the login page.
   *
   * The trade-off of moving off `session`: localStorage is shared by every tab on the
   * origin, so all tabs now share one active company/branch — switching branch in one
   * tab changes it in the others. Two tabs can no longer sit on different branches.
   */
  authStorageScope: 'local',

  pagination: {
    defaultPageSize: 10,
    defaultPage:     1,
  },
} as const;
