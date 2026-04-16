import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { BASE_URL } from '../api';
import { KeycloakService } from 'keycloak-angular';
import * as AuthActions from '../store/auth/auth.actions';
import { USER_KEY } from '../../shared/utils/AuthUtils';
import { AppState } from '../store';
import { OAuthService } from 'angular-oauth2-oidc';
import { Store } from '@ngrx/store';
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

    // remove only auth-related data
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear();

    this.router.navigateByUrl('/login');
  }
}
