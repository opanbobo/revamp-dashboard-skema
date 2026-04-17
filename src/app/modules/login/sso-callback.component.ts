import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../core/services/auth.service';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../core/store/auth/auth.actions';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs';
import { authCodeFlowConfig } from './auth.config';

@Component({
  selector: 'app-sso-callback',
  standalone: true,
  imports: [ButtonModule, ProgressSpinnerModule, CommonModule, ToastModule],
  providers: [AuthService, MessageService],
  templateUrl: './sso-callback.component.html',
  styleUrl: './sso-callback.component.scss'
})
export class SsoCallbackComponent {

  constructor(
    private router: Router,
    private keycloakService: KeycloakService,
    private authService: AuthService,
    private store: Store,
    private messageService: MessageService,
    private oauthService: OAuthService
  ) { }

  ngOnInit() {
    this.oauth2();
  }

  keycloak() {
    console.log('sso-callback.component: ngOnInit called');
    const refereshToken = this.keycloakService.getKeycloakInstance().refreshToken;
    const accessToken = this.keycloakService.getKeycloakInstance().token;
    const accessToken2 = this.keycloakService.getToken();
    const idToken = this.keycloakService.getKeycloakInstance().idToken;

    console.log('accesstoken', accessToken);
    console.log('accesstoken2', accessToken2);
    console.log('refereshtoken', refereshToken);

    this.authService.userDetailFromToken(accessToken!, refereshToken!, idToken!).subscribe({
      next: (user) => {
        console.log('user', user);

        if (user.code === 401) {
          this.messageService.add({
            severity: 'error',
            summary: 'Unauthorized',
            detail: user.message || 'Access denied',
            life: 3000
          });

          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            this.keycloakService.clearToken();
            this.keycloakService.logout(window.location.origin + '/#/login');
          }, 2000);

          this.store.dispatch(AuthActions.loginFailure({ error: user.message }));
          return;
        }

        this.store.dispatch(AuthActions.loginSuccess({ user: user }));
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error getting user data:', error);

        this.store.dispatch(AuthActions.loginFailure({ error: error.message || 'Unknown error' }));
        this.router.navigate(['/login']);
      },
      complete: () => {
        console.log("observable completed");
      }
    });
  }

  async oauth2() {
    try {
      this.oauthService.configure(authCodeFlowConfig); // ✅ must be first

      await this.oauthService.loadDiscoveryDocumentAndTryLogin(); // Combines discovery & code flow

      const accessToken = this.oauthService.getAccessToken();
      const refreshToken = this.oauthService.getRefreshToken();
      const idToken = this.oauthService.getIdToken(); 

      // console.log('✅ Access Token:', accessToken);
      // console.log('🪪 ID Token:', this.oauthService.getIdToken());

      // const profile = await this.oauthService.loadUserProfile();
      // console.log('👤 User Profile:', profile);

      if (!this.oauthService.hasValidAccessToken()) {
        console.warn('❌ No valid access token after login');
        return;
      }

      this.authService.userDetailFromToken(accessToken!, refreshToken!, idToken!).subscribe({
        next: (user) => {
          console.log('user', user);

          if (user.code === 401) {
            this.messageService.add({
              severity: 'error',
              summary: 'Unauthorized',
              detail: user.message || 'Access denied',
              life: 3000
            });

            this.store.dispatch(AuthActions.loginFailure({ error: user.message }));
            return;
          }

          this.store.dispatch(AuthActions.loginSuccess({ user }));
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error getting user data:', error);
          this.store.dispatch(AuthActions.loginFailure({ error: error.message || 'Unknown error' }));
          this.router.navigate(['/login']);
        },
        complete: () => {
          console.log("✅ User detail observable completed");
        }
      });

    } catch (err) {
      console.error('🔴 Error during login flow:', err);
    }

    this.oauthService.events
      .pipe(filter((e) => e.type === 'token_received'))
      .subscribe(() => {
        console.log('✅ Token received');
      });
  }

}
