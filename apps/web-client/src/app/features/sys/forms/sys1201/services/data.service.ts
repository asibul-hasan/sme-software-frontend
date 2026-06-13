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
  private readonly requestOptions = { headers: { 'X-Form-Id': 'SYS_1201' } };

  // Modules
  getModules(): Observable<ApiResponse<ModuleRow[]>> {
    return this.http.get<ApiResponse<ModuleRow[]>>(`${this.baseUrl}/modules`, this.requestOptions);
  }
  saveModule(p: Partial<ModuleRow>): Observable<ApiResponse<ModuleRow>> {
    return this.http.post<ApiResponse<ModuleRow>>(`${this.baseUrl}/modules`, p, this.requestOptions);
  }
  deleteModule(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/modules/${no}`, this.requestOptions);
  }

  // Submodules
  getModuleOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/module-options`, this.requestOptions);
  }
  getSubmodules(): Observable<ApiResponse<SubmoduleRow[]>> {
    return this.http.get<ApiResponse<SubmoduleRow[]>>(`${this.baseUrl}/submodules`, this.requestOptions);
  }
  saveSubmodule(p: Partial<SubmoduleRow>): Observable<ApiResponse<SubmoduleRow>> {
    return this.http.post<ApiResponse<SubmoduleRow>>(`${this.baseUrl}/submodules`, p, this.requestOptions);
  }
  deleteSubmodule(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/submodules/${no}`, this.requestOptions);
  }

  // Menus
  getSubmoduleOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/submodule-options`, this.requestOptions);
  }
  getMenus(): Observable<ApiResponse<MenuRow[]>> {
    return this.http.get<ApiResponse<MenuRow[]>>(`${this.baseUrl}/menus`, this.requestOptions);
  }
  saveMenu(p: Partial<MenuRow>): Observable<ApiResponse<MenuRow>> {
    return this.http.post<ApiResponse<MenuRow>>(`${this.baseUrl}/menus`, p, this.requestOptions);
  }
  deleteMenu(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/menus/${no}`, this.requestOptions);
  }
}
