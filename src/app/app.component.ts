import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { IdleService } from './core/services/idle.service';
import { AppState } from './core/store';
import { selectAuthState } from './core/store/auth/auth.selectors';
import * as AuthActions from './core/store/auth/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();

  constructor(
    private idleService: IdleService,
    private store: Store<AppState>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.store.select(selectAuthState)
        .pipe(filter(state => !!state.user)) // ✅ FIX HERE
        .subscribe(() => {
          console.log('User logged in → start idle watcher');

          this.idleService.startWatching(() => {
            this.handleIdleLogout();
          });
        })
    );
  }

  handleIdleLogout(): void {
    console.log('Auto logout (UP-login) due to inactivity');

    this.idleService.stopWatching();

    this.store.dispatch(AuthActions.logout());
    localStorage.removeItem('USER_KEY');
    sessionStorage.clear();

    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.idleService.stopWatching();
  }
}