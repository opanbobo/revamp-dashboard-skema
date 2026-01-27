import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import * as AuthActions from '../../core/store/auth/auth.actions';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../core/store';
import { Observable, Subscription } from 'rxjs';
import { AuthState } from '../../core/store/auth/auth.reducer';
import { selectAuthState } from '../../core/store/auth/auth.selectors';
import { getUserFromLocalStorage } from '../../shared/utils/AuthUtils';
import { setFilter } from '../../core/store/filter/filter.actions';
import { initialState } from '../../core/store/filter/filter.reducer';
import { KeycloakService } from 'keycloak-angular';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from './auth.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterOutlet,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm = new FormGroup({
    username: new FormControl<string | null>(null, Validators.required),
    password: new FormControl<string | null>(null, Validators.required),
  });

  isLoading = false;
  authState$: Observable<AuthState>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store<AppState>,
    private messageService: MessageService,
    private keycloakService: KeycloakService,
    private oauthService: OAuthService
  ) {
    this.authState$ = this.store.select(selectAuthState);

    // Dark mode handling (UI-only concern)
    const data = localStorage.getItem('useDarkMode');
    if (data) {
      document.body.classList.toggle('dark', JSON.parse(data));
    }
  }

  ngOnInit(): void {
    // React ONLY to UI-relevant auth state
    this.subscriptions.add(
      this.authState$.subscribe((state) => {
        this.isLoading = state.isLoading;

        if (state.error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: state.error,
          });
        }
      })
    );

    // OAuth initialization (safe)
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();

    this.store.dispatch(setFilter({ filter: initialState }));
    this.store.dispatch(
      AuthActions.login({
        username: username!,
        password: password!,
      })
    );
  }

  loginWithSSO(): void {
    this.keycloakService.login();
  }

  loginWithOAuth(): void {
    this.oauthService.initLoginFlow();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
