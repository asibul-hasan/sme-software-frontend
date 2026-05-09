import { Injectable, inject } from '@angular/core';
import {
  HttpContextToken,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

/**
 * Per-request opt-out token. Pass `{ context: new HttpContext().set(SKIP_LOADER, true) }`
 * to suppress the global loader for silent calls (background refresh, polling,
 * autocomplete, etc.).
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private readonly loader = inject(LoaderService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.context.get(SKIP_LOADER)) {
      return next.handle(req);
    }
    this.loader.show();
    return next.handle(req).pipe(finalize(() => this.loader.hide()));
  }
}
