import { HttpInterceptorFn } from '@angular/common/http';
import { getUserFromLocalStorage } from '../../shared/utils/AuthUtils';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from '../store/auth/auth.actions';

let isLoggingOut = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const store = inject(Store); // ✅ FIX: inject store

  // Skip login request
  if (req.url.includes('login')) return next(req);

  const currentUser = getUserFromLocalStorage();

  // If no user → redirect
  if (!currentUser) {
    window.location.href = '/#/login';
    return next(req);
  }

  // Attach token
  if (currentUser.token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Token ${currentUser.token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {

      if (error.status === 401 && !isLoggingOut) {
        console.warn('401 detected → force logout');

        isLoggingOut = true;

        // Dispatch logout to NgRx
        store.dispatch(AuthActions.logout());

        // Clear session (UP-login style)
        localStorage.removeItem('USER_KEY');
        sessionStorage.clear();

        // Redirect
        window.location.href = '/#/login';
      }

      return throwError(() => error);
    })
  );
};