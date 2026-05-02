import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

export interface BranchListResponse {
  success: boolean;
  message: string;
  data: any[];
}

export interface BranchDetailResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private get apiUrl() { return `${this.config.apiUrl}/sys/branch`; }

  constructor(private http: HttpClient, private config: AppConfigService) {}

  listBranches(): Observable<BranchListResponse> {
    return this.http.get<BranchListResponse>(`${this.apiUrl}/list`);
  }

  getBranchDetails(branchNo: number): Observable<BranchDetailResponse> {
    return this.http.get<BranchDetailResponse>(`${this.apiUrl}/detail`, { params: { branch_no: branchNo } });
  }

  createBranch(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }

  updateBranch(payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, payload);
  }

  deleteBranch(branchNo: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete`, { params: { branch_no: branchNo } });
  }
}
