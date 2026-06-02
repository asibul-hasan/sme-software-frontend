import { Injectable, computed, inject } from '@angular/core';
import { MenuItem } from '../models/menu.model';
import { ModuleEnum } from '../../../../core/models/permission.model';
import { AuthContextService } from '../../../../core/services/auth-context.service';

/**
 * Raw menu form as received from the backend `LoginResponse.menu` array.
 * Mirrors `MenuItemDto` after Jackson SNAKE_CASE serialisation.
 */
export interface RawMenuForm {
  form_id: string;
  type: string;
  form_name: string;
  icon?: string;
  route?: string;
  module: string;
  code: string;
  sub_module?: string;
  module_icon?: string;
  sub_module_icon?: string;
  module_serial?: number;
  can_insert?: boolean;
  can_update?: boolean;
  can_view?: boolean;
  can_delete?: boolean;
}

/**
 * Builds the hierarchical sidebar menu (module → submodule → form) from
 * the flat list returned by the backend in `LoginResponse.menu`.
 *
 * The data source is the `AuthContextService.menu()` signal, populated at
 * login (and on storage rehydration) from the `/auth/login` response.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly authContext = inject(AuthContextService);

  /**
   * Reactive menu tree. Recomputes whenever the auth context's flat menu
   * signal changes (login, branch switch, logout).
   */
  readonly tree = computed<MenuItem[]>(() => {
    const flat = (this.authContext.menu() as RawMenuForm[]) ?? [];
    return this.buildMenu(flat);
  });

  buildMenu(forms: RawMenuForm[]): MenuItem[] {
    interface SubModuleMap {
      formId: string;
      formName: string;
      icon: string;
      children: MenuItem[];
    }
    interface ModuleMap {
      formId: string;
      formName: string;
      icon: string;
      expanded: boolean;
      module_serial: number;
      children: Record<string, SubModuleMap>;
    }

    const moduleMap: Record<string, ModuleMap> = {};

    for (const form of forms) {
      const moduleKey = form.module || 'Unknown';

      if (!moduleMap[moduleKey]) {
        moduleMap[moduleKey] = {
          formId: moduleKey,
          formName: this.toCamelCaseRoute(moduleKey),
          icon: form.module_icon || 'folder',
          expanded: false,
          module_serial: form.module_serial ?? 999,
          children: {},
        };
      }

      const module = moduleMap[moduleKey];
      const subModuleKey = form.sub_module || 'General';

      if (!module.children[subModuleKey]) {
        module.children[subModuleKey] = {
          formId: subModuleKey,
          formName: this.toCamelCaseRoute(subModuleKey),
          icon: form.sub_module_icon || 'folder_open',
          children: [],
        };
      }

      module.children[subModuleKey].children.push({
        formId: form.form_id,
        formName: this.toCamelCaseRoute(form.form_name),
        icon: form.icon || 'description',
        route: this.buildRoute(form),
        code: form.code,
        type: form.type as 'form' | 'report',
        module: moduleKey as ModuleEnum,
        subModule: this.toCamelCaseRoute(subModuleKey),
      });
    }

    return Object.values(moduleMap)
      .map((m) => {
        // Sort forms within each submodule by formId
        const subModules = Object.values(m.children).map((sub) => {
          sub.children.sort((a, b) => a.formId.localeCompare(b.formId));
          return sub;
        });

        // Sort submodules by the formId of their first child
        subModules.sort((a, b) => {
          const aFirstId = a.children[0]?.formId || '';
          const bFirstId = b.children[0]?.formId || '';
          return aFirstId.localeCompare(bFirstId);
        });

        return {
          ...m,
          children: subModules,
        } as MenuItem;
      })
      .sort((a, b) => (a.module_serial ?? 999) - (b.module_serial ?? 999));
  }

  /**
   * Uses the backend `route` field when available; otherwise falls back to
   * building a route from code/type/form-name-slug.
   */
  private buildRoute(form: RawMenuForm): string {
    if (form.route) {
      return form.route;
    }

    const code = (form.code || 'unknown').toLowerCase();
    const type = (form.type || 'general').toLowerCase();
    const slug = (form.form_name || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    return `/${code}/${type}/${slug}`;
  }

  private toCamelCaseRoute(value: string): string {
    if (!value) return '';
    return value
      .replace(/&/g, 'and')
      .replace(/\//g, 'or')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')
      .filter(Boolean)
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join('');
  }
}
