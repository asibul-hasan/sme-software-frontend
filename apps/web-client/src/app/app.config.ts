import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import {
  TranslateHttpLoader,
  TRANSLATE_HTTP_LOADER_CONFIG,
} from '@ngx-translate/http-loader';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { AuthInterceptorFn } from './core/interceptors/auth.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { AuthService } from './core/services/auth.service';
import { SessionManagerService } from './core/services/session-manager.service';
import { AppBootstrapService } from './core/services/app-bootstrap.service';
import { provideErpGrid } from './shared/ag-grid';

export function HttpLoaderFactory() {
  return new TranslateHttpLoader();
}

export function initApp(
  auth:      AuthService,
  session:   SessionManagerService,
  bootstrap: AppBootstrapService,
) {
  return () =>
    new Promise((resolve) => {
      auth.initialize().subscribe({
        next: (result) => {
          if (result) {
            bootstrap.loadFromStorage();
          }
          session.init();
          resolve(true);
        },
        error: () => {
          session.init();
          resolve(true);
        },
      });
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideErpGrid(),
    provideToastr({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    provideHttpClient(
      withInterceptors([
        AuthInterceptorFn,
        loaderInterceptor,
      ]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthService, SessionManagerService, AppBootstrapService],
      multi: true,
    },
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: './assets/i18n/',
        suffix: '.json',
      },
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
        },
      }),
    ),
  ],
};
