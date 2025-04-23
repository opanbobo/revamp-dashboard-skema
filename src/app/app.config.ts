import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/jwt.interceptors';
import { effects, reducers } from './core/store';
import { KeycloakService } from 'keycloak-angular';
import { provideOAuthClient } from 'angular-oauth2-oidc';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'https://sso.bpk.go.id/auth',
        realm: 'Humas',
        // clientId: 'skema-fe',
        clientId: 'ca43969d-04a7-4366-baba-51cf79283c91'
      },
      initOptions: {
        checkLoginIframe: false,
        // onLoad: 'check-sso', // 'login-required' , 'check-sso',
        // redirectUri: window.location.origin + '/#/sso/callback',
        redirectUri: 'https://api.skema.co.id/sso/callback'
      },
      enableBearerInterceptor: true
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideStore(reducers),
    provideEffects(effects),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAngularSvgIcon(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    KeycloakService,
    provideOAuthClient()
  ],
};
