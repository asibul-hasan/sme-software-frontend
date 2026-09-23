import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { DocDoctor, DocPrescription, DocPrescriptionSetting } from '../models/doctor.models';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly api = inject(ApiService);

  getDoctors(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<DocDoctor>>> {
    return this.api.getPaged<DocDoctor>('doc/doctors', params);
  }

  getDoctorById(id: number): Observable<ApiResponse<DocDoctor>> {
    return this.api.get<DocDoctor>(`doc/doctors/${id}`);
  }

  createDoctor(doctor: Partial<DocDoctor>): Observable<ApiResponse<DocDoctor>> {
    return this.api.post<DocDoctor>('doc/doctors', doctor);
  }

  updateDoctor(id: number, doctor: Partial<DocDoctor>): Observable<ApiResponse<DocDoctor>> {
    return this.api.put<DocDoctor>(`doc/doctors/${id}`, doctor);
  }

  deleteDoctor(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`doc/doctors/${id}`);
  }

  getPrescriptions(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<DocPrescription>>> {
    return this.api.getPaged<DocPrescription>('doc/prescriptions', params);
  }

  createPrescription(prescription: Partial<DocPrescription>): Observable<ApiResponse<DocPrescription>> {
    return this.api.post<DocPrescription>('doc/prescriptions', prescription);
  }

  getPrescriptionSettings(): Observable<ApiResponse<DocPrescriptionSetting>> {
    return this.api.get<DocPrescriptionSetting>('doc/prescription-settings');
  }

  updatePrescriptionSettings(settings: Partial<DocPrescriptionSetting>): Observable<ApiResponse<DocPrescriptionSetting>> {
    return this.api.put<DocPrescriptionSetting>('doc/prescription-settings', settings);
  }
}
