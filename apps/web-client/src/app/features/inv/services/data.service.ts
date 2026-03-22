import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvDataService {
  private apiUrl = `${environment.apiUrl}/inv`;

  constructor(private http: HttpClient) { }

  // Add module-specific API calls here
}
