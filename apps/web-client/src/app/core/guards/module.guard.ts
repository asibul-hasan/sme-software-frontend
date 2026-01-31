import { Injectable } from '@angular/core'; 
import { CanLoad } from '@angular/router';
@Injectable({ providedIn: 'root' })
export class ModuleGuard implements CanLoad {
  canLoad(): boolean { return true; }
}