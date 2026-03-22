import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HrDataService {
  private apiUrl = `${environment.apiUrl}/hr`;

  constructor(private http: HttpClient) { }

  // Add module-specific API calls here
}
