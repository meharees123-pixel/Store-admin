import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { authInterceptor } from './services/auth.interceptor';
import { loaderInterceptor } from './services/loader.interceptor';
import { toastInterceptor } from './services/toast.interceptor';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loaderInterceptor, toastInterceptor, authInterceptor])),
    importProvidersFrom(FormsModule, NgbModule),
    provideClientHydration(withEventReplay())
  ]
};
