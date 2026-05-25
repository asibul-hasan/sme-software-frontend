import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ModuleRow, SubmoduleRow, MenuRow, Option } from './model.service';

@Injectable()
export class Sys1201DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1201`;

  // Modules
  getModules(): Observable<ApiResponse<ModuleRow[]>> {
    return this.http.get<ApiResponse<ModuleRow[]>>(`${this.baseUrl}/modules`);
  }
  saveModule(p: Partial<ModuleRow>): Observable<ApiResponse<ModuleRow>> {
    return this.http.post<ApiResponse<ModuleRow>>(`${this.baseUrl}/modules`, p);
  }
  deleteModule(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/modules/${no}`);
  }

  // Submodules
  getModuleOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/module-options`);
  }
  getSubmodules(): Observable<ApiResponse<SubmoduleRow[]>> {
    return this.http.get<ApiResponse<SubmoduleRow[]>>(`${this.baseUrl}/submodules`);
  }
  saveSubmodule(p: Partial<SubmoduleRow>): Observable<ApiResponse<SubmoduleRow>> {
    return this.http.post<ApiResponse<SubmoduleRow>>(`${this.baseUrl}/submodules`, p);
  }
  deleteSubmodule(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/submodules/${no}`);
  }

  // Menus
  getSubmoduleOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/submodule-options`);
  }
  getMenus(): Observable<ApiResponse<MenuRow[]>> {
    return this.http.get<ApiResponse<MenuRow[]>>(`${this.baseUrl}/menus`);
  }
  saveMenu(p: Partial<MenuRow>): Observable<ApiResponse<MenuRow>> {
    return this.http.post<ApiResponse<MenuRow>>(`${this.baseUrl}/menus`, p);
  }
  deleteMenu(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/menus/${no}`);
  }
}
