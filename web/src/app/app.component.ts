import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, Event } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule for *ngIf
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
  title = 'medi-find';
  isAuthPage = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfAuthPage(event.url);
    });
  }

  private checkIfAuthPage(url: string): void {
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    this.isAuthPage = authRoutes.some(route => url.includes(route));
  }
}