import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthDataService } from '../../features/auth/services/data.service';
import { AuthContextService } from './auth-context.service';
import { isSuccess } from '../models/response.model';
import { IRawMenuForm } from '../models/permission.model';

/**
 * Resolved per-form CRUD flags for the currently authenticated user.
 * Field names mirror the backend {@code FormPermissionResponse} after
 * Jackson SNAKE_CASE serialisation.
 */
export interface FormPermission {
  form_id:    string;
  form_name?: string;
  can_view:    boolean;
  can_insert:  boolean;
  can_update:  boolean;
  can_delete:  boolean;
}

const EMPTY: FormPermission = {
  form_id:    '',
  can_view:    false,
  can_insert:  false,
  can_update:  false,
  can_delete:  false,
};

/**
 * Per-form permission state for the active form screen.
 *
 * Loaded by each form component on init via {@link loadPermissions}; the
 * resulting flags drive button visibility (Save / Delete / Approve / etc.).
 *
 * Backed by {@code GET /api/auth/permissions/check?formId=}.
 */
@Injectable({ providedIn: 'root' })
export class FormPermissionService {
  private readonly auth        = inject(AuthDataService);
  private readonly authContext = inject(AuthContextService);

  private readonly _permission = signal<FormPermission>(EMPTY);
  readonly permission = this._permission.asReadonly();

  // Convenience computed signals for templates.
  readonly canView   = computed(() => this._permission().can_view);
  readonly canInsert = computed(() => this._permission().can_insert);
  readonly canUpdate = computed(() => this._permission().can_update);
  readonly canDelete = computed(() => this._permission().can_delete);

  /**
   * Loads the permission row for {@code formId} from the backend.
   * @deprecated Use useLocalPermissions() instead to avoid redundant API calls.
   */
  loadPermissions(formId: string): Observable<FormPermission> {
    return this.auth.checkFormPermission(formId).pipe(
      map((res) => {
        if (!isSuccess(res) || !res.data) {
          this._permission.set({ ...EMPTY, form_id: formId });
          return this._permission();
        }
        const next: FormPermission = {
          form_id:   res.data.form_id   ?? formId,
          form_name: res.data.form_name,
          can_view:    !!res.data.can_view,
          can_insert:  !!res.data.can_insert,
          can_update:  !!res.data.can_update,
          can_delete:  !!res.data.can_delete,
        };
        this._permission.set(next);
        return next;
      }),
      catchError((err) => {
        console.error(`Failed to load permissions for ${formId}`, err);
        this._permission.set({ ...EMPTY, form_id: formId });
        return of(this._permission());
      }),
    );
  }

  /**
   * Synchronously sets permissions for the given formId using the menu data
   * already available in the AuthContext. This avoids a separate API call.
   */
  useLocalPermissions(formId: string): void {
    const menu = this.authContext.menu() as IRawMenuForm[];
    // Find matching formId in the flat menu list
    const form = menu.find(m => m.form_id?.toUpperCase() === formId.toUpperCase());

    if (form) {
      this._permission.set({
        form_id:   form.form_id,
        form_name: form.form_name,
        can_view:    !!form.can_view,
        can_insert:  !!form.can_insert,
        can_update:  !!form.can_update,
        can_delete:  !!form.can_delete,
      });
    } else {
      // If not found in menu, default to no permissions (Fail-closed)
      this._permission.set({ ...EMPTY, form_id: formId });
    }
  }

  hasPermission(action: 'view' | 'insert' | 'update' | 'delete'): boolean {
    const perm = this._permission();
    switch (action) {
      case 'view':   return perm.can_view;
      case 'insert': return perm.can_insert;
      case 'update': return perm.can_update;
      case 'delete': return perm.can_delete;
    }
  }

  clear(): void {
    this._permission.set(EMPTY);
  }
}
