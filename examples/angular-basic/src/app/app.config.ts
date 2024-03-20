import { ApplicationConfig, NgZone, ɵNoopNgZone } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: NgZone,
      useClass: ɵNoopNgZone,
    },
  ],
};
