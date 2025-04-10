import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../core/services/auth.service';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../core/store/auth/auth.actions';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sso-callback',
  standalone: true,
  imports: [ButtonModule, ProgressSpinnerModule, CommonModule],
  providers: [AuthService],
  templateUrl: './sso-callback.component.html',
  styleUrl: './sso-callback.component.scss'
})
export class SsoCallbackComponent {

  constructor(
    private router: Router,
    private keycloakService: KeycloakService,
    private authService: AuthService,
    private store: Store
  ) { }

  ngOnInit() {
    console.log('sso-callback.component: ngOnInit called');
    const refereshToken = this.keycloakService.getKeycloakInstance().refreshToken;
    const accessToken = this.keycloakService.getKeycloakInstance().token;
    const accessToken2 = this.keycloakService.getToken();

    console.log('accesstoken', accessToken);
    console.log('accesstoken2', accessToken2);
    console.log('refereshtoken', refereshToken);

    this.authService.userDetailFromToken(accessToken!, refereshToken!).subscribe({
      next: (user) => {
        console.log('user', user);

        // Dispatch the loginSuccess action with the retrieved user data
        this.store.dispatch(AuthActions.loginSuccess({ user: user }));

        // Optionally, navigate to another route after successful login
        this.router.navigate(['/dashboard']); // Or your desired route
      },
      error: (error) => {
        console.error('Error getting user data:', error);

        // Dispatch the loginFailure action with the error message
        this.store.dispatch(AuthActions.loginFailure({ error: error.message || 'Unknown error' }));

        // Optionally, navigate to the login page or display an error message
        this.router.navigate(['/login']); // Or your desired error handling
      },
      complete: () => {
        console.log("observable completed");
      }
    });
  }

}
