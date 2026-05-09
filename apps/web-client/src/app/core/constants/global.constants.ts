/**
 * Application-wide constant keys and defaults.
 *
 * NOTE: Do not add a "current user" getter here. The current user lives in
 * {@link AuthContextService.user} as a signal — read it reactively from
 * components/services rather than re-parsing localStorage on every access.
 */
export const globalConstants = {
  /** LocalStorage keys — keep stable; renaming invalidates every active session. */
  storageKeys: {
    accessToken:        'access_token',
    refreshToken:       'refresh_token',
    userData:           'user_data',
    userPermissions:    'user_permissions',
    userMenu:           'user_menu',
    availableBranches:  'sme_available_branches',
    sidebarCollapsed:   'sme_sidebar_collapsed',
    sidebarExpanded:    'sme_sidebar_expanded',
  },

  pagination: {
    defaultPageSize: 10,
    defaultPage:     1,
  },
} as const;
