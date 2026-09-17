import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './core/services/idle.service';
import { AuthService } from './core/services/auth.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  filter: any;

  constructor(
    private idleService: IdleService,
    private authService: AuthService 
  ) { }

  ngOnInit(): void {
    this.idleService.startWatching(() => {
      this.logout();
    });
  }

  logout(): void {
    console.log('Auto logout due to inactivity');
    this.authService.logout();
  }

  ngOnDestroy() {
    this.filter?.unsubscribe?.();
  }
}
