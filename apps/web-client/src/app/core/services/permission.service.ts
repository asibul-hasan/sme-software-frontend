import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ActionEnum,
  IPermissionConfig,
  ModuleEnum,
} from '../models/permission.model';

/**
 * Reactive permission lookups. The permission map itself is stored here as
 * a signal so components/directives can derive `computed` access flags.
 *
 * Note: this service is loaded from the login response in {@link AuthService}.
 * It does not own persistence — that lives in {@link AuthContextService}.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly _permissions = signal<IPermissionConfig | null>(null);

  /** Read-only signal exposing the current permission map. */
  readonly permissions = this._permissions.asReadonly();

  setPermissions(config: IPermissionConfig | null): void {
    this._permissions.set(config);
  }

  clearPermissions(): void {
    this._permissions.set(null);
  }

  /** True when the user is enrolled in the given module. */
  hasModule(module: ModuleEnum | string): boolean {
    return !!this._permissions()?.modules.find(
      (m) => m.module === module && m.enabled,
    );
  }

  /**
   * True when the user holds the given action on the specified form.
   * `formId` is the canonical `sys_menu.form_id` (e.g. `'SYS_1001'`).
   */
  hasPermission(
    module: ModuleEnum | string,
    formId: string,
    action: ActionEnum = ActionEnum.VIEW,
  ): boolean {
    const modulePerm = this._permissions()?.modules.find(
      (m) => m.module === module,
    );
    if (!modulePerm?.enabled) return false;

    const formPerm = modulePerm.forms?.[formId];
    if (!formPerm) return false;

    return formPerm[action] === true;
  }

  /** Returns a `computed` signal that recomputes whenever permissions change. */
  canDo(
    module: ModuleEnum | string,
    formId: string,
    action: ActionEnum = ActionEnum.VIEW,
  ) {
    return computed(() => this.hasPermission(module, formId, action));
  }
}
