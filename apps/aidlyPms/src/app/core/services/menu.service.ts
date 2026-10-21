import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/common.models';
import { SysMenu } from '../models/menu.models';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly api = inject(ApiService);

  getMenus(activeOnly = false): Observable<ApiResponse<SysMenu[]>> {
    return this.api.get<SysMenu[]>(`menus?activeOnly=${activeOnly}`);
  }

  getMenuTree(): Observable<ApiResponse<SysMenu[]>> {
    return this.api.get<SysMenu[]>('menus/tree');
  }

  getMenuById(id: number): Observable<ApiResponse<SysMenu>> {
    return this.api.get<SysMenu>(`menus/${id}`);
  }

  createMenu(menu: Partial<SysMenu>): Observable<ApiResponse<SysMenu>> {
    return this.api.post<SysMenu>('menus', menu);
  }

  updateMenu(id: number, menu: Partial<SysMenu>): Observable<ApiResponse<SysMenu>> {
    return this.api.put<SysMenu>(`menus/${id}`, menu);
  }

  deleteMenu(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`menus/${id}`);
  }
}
