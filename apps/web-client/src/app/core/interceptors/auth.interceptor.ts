import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpInterceptorFn, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthContextService } from '../services/auth-context.service';
import { Router } from '@angular/router';
import { IRawMenuForm } from '../models/permission.model';

/**
 * HTTP interceptor responsible for the access-token lifecycle on every
 * outgoing request:
 *
 *  1. **Pre-flight expiry check.** If the access token is already expired
 *     locally (by decoding its `exp` claim), refresh BEFORE sending —
 *     don't waste a backend round-trip + DB lookup just to receive a 401.
 *
 *  2. **Header attachment.** Adds `Authorization` and tenant identity
 *     headers to authenticated requests.
 *
 *  3. **Reactive 401 handling.** If the server still returns 401 despite
 *     our local checks (e.g. token revoked server-side), attempt a single
 *     refresh and replay the request.
 *
 *  4. **Single-flight refresh.** Concurrent bursts share one refresh call;
 *     queued requests resume with the new token once it arrives.
 *
 *  5. **Hard failure → logout.** If the refresh itself fails (refresh
 *     token expired or backend unreachable), force a logout so the user
 *     lands on the login screen instead of spamming the server.
 */
@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly authContext = inject(AuthContextService);
  private readonly router = inject(Router);

  /** True while a `/auth/refresh` round-trip is in flight. */
  private isRefreshing = false;

  /**
   * Emits the new access token when refresh succeeds, or `null` to signal
   * a fresh attempt is starting. Used by queued requests to wait their turn.
   */
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Auth endpoints must NEVER recurse through this interceptor's
    // refresh logic — otherwise an expired refresh token would loop forever.
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    // Unauthenticated request (no token at all) — let it through unmodified.
    if (!token) {
      return next.handle(req).pipe(catchError(err => throwError(() => err)));
    }

    // Pre-flight: token already expired? Refresh before sending.
    if (this.authContext.isTokenExpired(token)) {
      return this.refreshAndSend(req, next);
    }

    // Happy path: fresh token, fire and only fall through to refresh
    // if the server still says 401 (e.g. token was revoked).
    return next.handle(this.addAuthHeaders(req, token)).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.refreshAndSend(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  // ─── Refresh-and-replay (single-flight) ────────────────────────────────

  private refreshAndSend(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    // If a refresh is already running, queue until it emits a new token
    // (or null = failed, which is mapped to a logout below).
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(t => t !== null),
        take(1),
        switchMap(t => next.handle(this.addAuthHeaders(request, t as string)))
      );
    }

    // No refresh in flight — start one.
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      switchMap(newToken => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(newToken);
        return next.handle(this.addAuthHeaders(request, newToken));
      }),
      catchError(err => {
        // Refresh failed → session is unrecoverable. Log out so the user
        // doesn't keep firing failing requests at the backend.
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
        this.authService.logout();
        return throwError(() => err);
      })
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private addAuthHeaders(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    const user = this.authService.user();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    if (user) {
      if (user.company_no) headers['X-Company-No'] = user.company_no.toString();
      if (user.branch_no)  headers['X-Branch-No']  = user.branch_no.toString();
      if (user.user_no)    headers['X-User-No']    = user.user_no.toString();
    }

    const formId = this.resolveActiveFormId();
    if (formId) headers['X-Form-Id'] = formId;

    return request.clone({ setHeaders: headers });
  }

  private isAuthEndpoint(url: string): boolean {
    return (
      url.includes('/auth/login')   ||
      url.includes('/auth/config')  ||
      url.includes('/auth/contexts') ||
      url.includes('/auth/refresh')
    );
  }

  private resolveActiveFormId(): string | null {
    const currentUrl = (this.router.url || '').split('?')[0];
    const menu = (this.authContext.menu() as IRawMenuForm[]) ?? [];
    const match = menu.find(item => {
      const route = item.route?.startsWith('/') ? item.route : item.route ? `/${item.route}` : '';
      return !!route && (currentUrl === route || currentUrl.endsWith(route));
    });
    return match?.form_id ?? null;
  }
}

/**
 * Functional wrapper around `AuthInterceptor` for use with `withInterceptors()`.
 *
 * The class-based `AuthInterceptor` encapsulates the single-flight refresh
 * queue (instance state), so we delegate to it via DI rather than inlining
 * the logic into a bare function.
 */
export const AuthInterceptorFn: HttpInterceptorFn = (req, next) => {
  const interceptor = inject(AuthInterceptor);
  return interceptor.intercept(req, { handle: next });
};

