import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Allow requests to opt-out via custom header
  if (req.headers.has('X-Skip-Loader')) {
    const headers = req.headers.delete('X-Skip-Loader');
    return next(req.clone({ headers }));
  }

  const loader = inject(LoadingService);
  loader.startLoading();

  return next(req).pipe(
    finalize(() => {
      loader.stopLoading();
    })
  );
};
