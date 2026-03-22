import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RptDataService {
  private apiUrl = `${environment.apiUrl}/rpt`;

  constructor(private http: HttpClient) { }

  // Add module-specific API calls here
}
