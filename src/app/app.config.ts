import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zone.js isn't in package.json at all (see zoneless_scheduling_impl.ts: without a global
    // `Zone`, Angular already schedules change detection itself), but we call this explicitly
    // so the intent is documented and ngDevMode warns loudly if zone.js ever sneaks back in.
    provideZonelessChangeDetection(),
  ],
};
