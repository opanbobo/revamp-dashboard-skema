import { Injectable } from '@angular/core';
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
    private authService: AuthService
  ) {}

  login = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ username, password }) => {
        return this.authService.login(username, password).pipe(
          map((response) => {
            if ((response as any).code === 401) throw new Error((response as any).message);
            return AuthActions.loginSuccess({ user: response });
          }),
          catchError((error) => of(AuthActions.loginFailure({ error: error.message })))
        );
      })
    )
  );

  loginSuccess = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ user }) => {
          setUserToLocalStoage(user);
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
      })
    ),
  { dispatch: false }
);

}
