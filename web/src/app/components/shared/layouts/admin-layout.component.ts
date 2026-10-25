import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@services';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  template: `
    <div class="min-h-screen bg-gray-100">
      
      <!-- Mobile Header -->
      <div class="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-2 text-blue-600">
          <i class="fas fa-heartbeat text-2xl"></i>
          <span class="text-xl font-bold tracking-tight text-gray-900">EasyPharma</span>
        </div>
        <div class="flex items-center gap-4">
          <app-notification-bell></app-notification-bell>
          <button (click)="toggleSidebar()" class="text-gray-500 hover:text-gray-700 focus:outline-none">
            <i class="fas" [ngClass]="isSidebarOpen ? 'fa-times' : 'fa-bars'"></i>
          </button>
        </div>
      </div>

      <!-- Sidebar Backdrop (Mobile) -->
      <div *ngIf="isSidebarOpen" (click)="toggleSidebar()" 
           class="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

      <!-- Sidebar -->
      <aside [ngClass]="{'translate-x-0': isSidebarOpen, '-translate-x-full': !isSidebarOpen}"
             class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0">
        
        <!-- Logo (Desktop) -->
        <div class="hidden md:flex h-16 items-center px-6 border-b border-gray-200 justify-between">
          <div class="flex items-center gap-2 text-blue-600">
            <i class="fas fa-heartbeat text-2xl"></i>
            <span class="text-xl font-bold tracking-tight text-gray-900">EasyPharma</span>
          </div>
          <app-notification-bell position="left"></app-notification-bell>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Principal</p>
          
          <a routerLink="/admin/dashboard" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-home w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Tableau de bord
          </a>

          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Gestion</p>

          <a routerLink="/admin/users" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-users w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Utilisateurs
          </a>

          <a routerLink="/admin/global-search" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-search w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Recherche Globale
          </a>

          <a routerLink="/admin/pharmacies" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-clinic-medical w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Pharmacies
          </a>

          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Finance</p>

          <a routerLink="/admin/financial" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-coins w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Revenus & Règlements
          </a>

          <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Sécurité</p>

          <a routerLink="/admin/audit-logs" routerLinkActive="bg-blue-50 text-blue-600" (click)="closeSidebar()"
             class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors group">
            <i class="fas fa-history w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 group-[.text-blue-600]:text-blue-600 transition-colors"></i>
            Logs d'Audit
          </a>
        </nav>

        <!-- User Profile & Logout -->
        <div class="border-t border-gray-200 p-4 bg-gray-50">
          <a routerLink="/profile" (click)="closeSidebar()" class="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              A
            </div>
            <div>
              <p class="font-medium text-sm text-gray-900">Admin</p>
              <p class="text-xs text-gray-500">Super Admin</p>
            </div>
          </a>
          
          <button (click)="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <i class="fas fa-sign-out-alt text-gray-500"></i>
            Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="md:ml-64 min-h-screen p-4 md:p-8 transition-all duration-300">
        <div class="max-w-7xl mx-auto">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  isSidebarOpen = false;

  constructor(private authService: AuthService) { }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }
}