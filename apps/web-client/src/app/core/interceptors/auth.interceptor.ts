import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoginResponse } from '../../features/auth/services/data.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const user = this.authService.user();
    
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (user) {
      if (user.company_id) headers['X-Company-No'] = user.company_id.toString();
      if (user.branch_id) headers['X-Branch-No'] = user.branch_id.toString();
      if (user.id) headers['X-User-No'] = user.id.toString();
    }
    
    const authReq = req.clone({ setHeaders: headers });
    
    return next.handle(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/login')) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string) {
    const user = this.authService.user();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    if (user) {
      if (user.company_id) headers['X-Company-No'] = user.company_id.toString();
      if (user.branch_id) headers['X-Branch-No'] = user.branch_id.toString();
      if (user.id) headers['X-User-No'] = user.id.toString();
    }

    return request.clone({ setHeaders: headers });
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: LoginResponse | null) => {
          this.isRefreshing = false;
          const accessToken = response?.accessToken || '';
          this.refreshTokenSubject.next(accessToken);
          return next.handle(this.addToken(request, accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request, jwt as string));
        })
      );
    }
  }
}