import { HttpInterceptorFn } from '@angular/common/http';
import { getUserFromLocalStorage, USER_KEY } from '../../shared/utils/AuthUtils';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from '../store/auth/auth.actions';
import { ConfirmationService } from 'primeng/api';

let isLoggingOut = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const store = inject(Store); // ✅ FIX: inject store
  const confirmationService = inject(ConfirmationService);

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

      if ((error.status === 401 || error.status === 403) && !isLoggingOut) {
        console.warn(`${error.status} detected → force logout`);

        isLoggingOut = true;

        if (error.status === 403) {
          confirmationService.confirm({
            header: 'Access Forbidden',
            message: 'Your session is no longer authorized. Please login again.',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'OK',
            rejectVisible: false,
            accept: () => {
              store.dispatch(AuthActions.logout());
              localStorage.removeItem(USER_KEY);
              sessionStorage.clear();
              window.location.href = '/#/login';
            },
          });
        } else {
          store.dispatch(AuthActions.logout());
          localStorage.removeItem(USER_KEY);
          sessionStorage.clear();
          window.location.href = '/#/login';
        }
      }

      return throwError(() => error);
    })
  );
};
