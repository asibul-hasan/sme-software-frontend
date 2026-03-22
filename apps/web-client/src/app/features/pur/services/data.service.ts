import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurDataService {
  private apiUrl = `${environment.apiUrl}/pur`;

  constructor(private http: HttpClient) { }

  // Add module-specific API calls here
}
