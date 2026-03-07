import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { ModuleEnum, FormEnum, ActionEnum } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredModule = route.data['module'] as ModuleEnum;
    
    // If no module required, allow access
    if (!requiredModule) {
      return true;
    }

    const requiredForm = route.data['form'] as FormEnum;
    const requiredAction = route.data['action'] as ActionEnum;

    // Check specific permission if form/action defined
    if (requiredForm && requiredAction) {
      if (this.permissionService.hasPermission(requiredModule, requiredForm, requiredAction)) {
        return true;
      }
    } 
    // Otherwise check module access
    else if (this.permissionService.hasModule(requiredModule)) {
      return true;
    }

    // Redirect to dashboard or unauthorized page
    this.router.navigate(['/dashboard']);
    return false;
  }
}