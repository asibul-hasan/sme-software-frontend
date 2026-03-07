import { Injectable, signal } from '@angular/core';
import { ModuleEnum, FormEnum, ActionEnum, IPermissionConfig } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissions = signal<IPermissionConfig | null>(null);

  setPermissions(config: IPermissionConfig) {
    this.permissions.set(config);
  }

  clearPermissions() {
    this.permissions.set(null);
  }

  hasModule(module: ModuleEnum): boolean {
    const config = this.permissions();
    if (!config) return false;
    
    const modulePerm = config.modules.find(m => m.module === module);
    return modulePerm ? modulePerm.enabled : false;
  }

  hasPermission(module: ModuleEnum, form: FormEnum = FormEnum.DEFAULT, action: ActionEnum = ActionEnum.READ): boolean {
    const config = this.permissions();
    if (!config) return false;

    const modulePerm = config.modules.find(m => m.module === module);
    if (!modulePerm || !modulePerm.enabled) return false;

    const formPerm = modulePerm.forms?.[form];
    if (!formPerm) return false;

    return formPerm[action] === true;
  }
}