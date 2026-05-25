import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

/**
 * Per-request opt-out token. Pass `{ context: new HttpContext().set(SKIP_LOADER, true) }`
 * to suppress the global loader for silent calls (background refresh, polling,
 * autocomplete, etc.).
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/**
 * Global loading spinner interceptor (functional).
 *
 * Shows the loader on request start, hides it when the response arrives
 * (or errors). Opt-out with `SKIP_LOADER` context token.
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) {
    return next(req);
  }

  const loader = inject(LoaderService);
  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
