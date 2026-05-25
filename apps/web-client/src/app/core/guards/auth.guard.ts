import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that protects authenticated routes.
 *
 * Checks `AuthService.isAuthenticated()` — if the user has a valid
 * access token (and optionally a loaded profile) the route activates.
 * Otherwise the user is redirected to `/auth/login` with a `returnUrl`
 * query param so they can be sent back after a successful login.
 *
 * Usage:
 * ```ts
 * { path: '...', canActivate: [authGuard] }
 * ```
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
