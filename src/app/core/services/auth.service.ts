import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { BASE_URL } from '../api';
import { KeycloakService } from 'keycloak-angular';
import * as AuthActions from '../store/auth/auth.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../store';
import { OAuthService } from 'angular-oauth2-oidc';
import { USER_KEY } from '../../shared/utils/AuthUtils';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = BASE_URL;
  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private store: Store<AppState>,
    private oauthService: OAuthService,
    private router: Router
  ) { }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/v1/login/`, {
      username,
      password,
    });
  }

  userDetailFromToken(accessToken: string, refreshToken: string, idToken: string): Observable<User> {

    console.log('id token : ', idToken);

    const requestBody = {
      username: '',
      password: '',
      is_oauth: true,
      provider: 'bpk',
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken
    };

    return this.http.post<User>(`${this.baseUrl}/v1/login/`, requestBody);
  }

  logout(): void {
    const token = localStorage.getItem(USER_KEY);

    // Call backend logout API
    this.http.post<any>(`${this.baseUrl}/v1/logout/`, {}).subscribe({
      next: (res) => {
        console.log('Logout API success', res);

        // Clear state first
        this.store.dispatch(AuthActions.logout());
        localStorage.removeItem(USER_KEY);
        sessionStorage.clear();

        // Redirect to backend-provided URL
        if (res?.redirect_url) {
          window.location.href = res.redirect_url;
          return;
        }

        // fallback
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        console.error('Logout API failed', err);

        // Fallback logout (important!)
        this.store.dispatch(AuthActions.logout());
        localStorage.removeItem(USER_KEY);
        sessionStorage.clear();

        this.router.navigateByUrl('/login');
      }
    });
  }
}
