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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = BASE_URL;
  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private store: Store<AppState>,
    private oauthService: OAuthService
  ) { }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/v1/login/`, {
      username,
      password,
    });
  }

  userDetailFromToken(accessToken: string, refreshToken: string): Observable<User> {

    const requestBody = {
      username: '',
      password: '',
      is_oauth: true,
      provider: 'bpk',
      access_token: accessToken,
      refresh_token: refreshToken,
    };

    return this.http.post<User>(`${this.baseUrl}/v1/login/`, requestBody);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());

    window.localStorage.removeItem(USER_KEY);

    if (this.oauthService.hasValidAccessToken()) {
      this.oauthService.logOut();
      localStorage.clear();
      sessionStorage.clear();
      return;
    }

    this.keycloakService.logout(window.location.origin);
  }
}
