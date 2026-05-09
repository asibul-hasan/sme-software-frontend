import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor that:
 *  1. Attaches the access token + tenant headers to every outgoing request.
 *  2. On a 401 response, calls {@code POST /auth/refresh} with the stored
 *     refresh token, stores the rotated token pair, and retries the
 *     original request — at most once per concurrent burst.
 *  3. If the refresh also fails the user is logged out.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token   = this.authService.getToken();
    const authReq = token ? this.addAuthHeaders(req, token) : req;

    return next.handle(authReq).pipe(
      catchError(error => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !req.url.includes('/auth/login') &&
          !req.url.includes('/auth/refresh')
        ) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addAuthHeaders(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    const user = this.authService.user();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    if (user) {
      if (user.company_no) headers['X-Company-No'] = user.company_no.toString();
      if (user.branch_no)  headers['X-Branch-No']  = user.branch_no.toString();
      if (user.user_no)    headers['X-User-No']     = user.user_no.toString();
    }

    return request.clone({ setHeaders: headers });
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((newAccessToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newAccessToken);
          return next.handle(this.addAuthHeaders(request, newAccessToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }

    // Another request is already refreshing — queue until new token is ready
    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next.handle(this.addAuthHeaders(request, token)))
    );
  }
}
