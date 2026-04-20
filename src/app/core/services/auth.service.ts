import { Injectable } from '@angular/core';
import { finalize, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    const userData = localStorage.getItem(USER_KEY);
    const token = userData ? JSON.parse(userData)?.token : null;

    const headers = new HttpHeaders(
      token ? { Authorization: `Token ${token}` } : {}
    );

    this.http.post(`${this.baseUrl}/v1/logout/`, {}, { headers }).pipe(
      finalize(() => {
        this.store.dispatch(AuthActions.logout());
        localStorage.removeItem(USER_KEY);
        sessionStorage.clear();

        if (this.oauthService.hasValidAccessToken()) {
          this.oauthService.logOut();
          localStorage.clear();
          return;
        }

        this.router.navigateByUrl('/login');
      })
    ).subscribe();
  }
}
