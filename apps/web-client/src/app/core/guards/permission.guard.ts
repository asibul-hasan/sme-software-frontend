import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { ActionEnum, ModuleEnum } from '../models/permission.model';

/**
 * Functional route guard for permission-gated routes.
 *
 * Configure on a route via `data`:
 * ```ts
 * { path: '...', canActivate: [permissionGuard],
 *   data: { module: ModuleEnum.SYS, formId: 'SYS_1001', action: ActionEnum.VIEW } }
 * ```
 *
 * - Without `formId`: only checks that the user is enrolled in the module.
 * - With `formId` + `action`: checks the per-form action flag.
 * On denial, redirects to `/dashboard`.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const permissions = inject(PermissionService);
  const router      = inject(Router);

  const requiredModule = route.data['module'] as ModuleEnum | undefined;
  const requiredForm   = route.data['formId'] as string      | undefined;
  const requiredAction = route.data['action'] as ActionEnum  | undefined;

  if (!requiredModule) return true;

  const allowed = requiredForm
    ? permissions.hasPermission(requiredModule, requiredForm, requiredAction ?? ActionEnum.VIEW)
    : permissions.hasModule(requiredModule);

  if (allowed) return true;

  router.navigate(['/dashboard']);
  return false;
};
