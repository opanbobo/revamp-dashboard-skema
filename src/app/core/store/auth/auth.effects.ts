import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { setUserToLocalStoage } from '../../../shared/utils/AuthUtils';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {}

  login = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ username, password }) =>
        this.authService.login(username, password).pipe(
          map((response) => {
            if ((response as any).code === 401) {
              throw new Error((response as any).message);
            }
            return AuthActions.loginSuccess({ user: response });
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loginSuccess = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ user }) => {
          // 1️⃣ persist user
          setUserToLocalStoage(user);

          // 2️⃣ decide redirect target (SAFE)
          const target =
            user?.menu?.includes('overview')
              ? '/'
              : `/dashboard/${user?.menu?.[0]}`;

          // 3️⃣ navigate ONCE, deterministically
          this.router.navigateByUrl(target);
        })
      ),
    { dispatch: false }
  );

  logout = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigateByUrl('/login');
        })
      ),
    { dispatch: false }
  );
}
