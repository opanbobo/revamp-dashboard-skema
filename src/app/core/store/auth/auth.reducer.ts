import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../models/user.model';

export interface AuthState {
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export const initialState: AuthState = {
  isLoading: false,
  user: null,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => {
    return { ...state, isLoading: true };
  }),
  on(AuthActions.loginSuccess, (state, { user }) => {
    return {
      ...state,
      user,
      isLoading: false,
      error: null,
    };
  }),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isLoading: false,
    error,
  })),
  on(AuthActions.logout, () => ({
    ...initialState
  }))
);
