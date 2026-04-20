import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IdleService implements OnDestroy {

  private timeout = 1 * 60 * 1000;
  private activitySubscription!: Subscription;
  private timerSubscription!: Subscription;

  constructor(private ngZone: NgZone) {}

  startWatching(onTimeout: () => void) {
    this.ngZone.runOutsideAngular(() => {
      const activityEvents$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart')
      );

      this.activitySubscription = activityEvents$.subscribe(() => {
        this.resetTimer(onTimeout);
      });

      this.resetTimer(onTimeout);
    });
  }

  private resetTimer(onTimeout: () => void) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timerSubscription = timer(this.timeout).subscribe(() => {
      this.ngZone.run(() => {
        onTimeout();
      });
    });
  }

  stopWatching() {
    this.activitySubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}