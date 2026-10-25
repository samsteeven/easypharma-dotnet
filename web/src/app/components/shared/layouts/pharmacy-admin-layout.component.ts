import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@services';
import { PharmacyService } from '../../../services/pharmacy.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPrescriptionBottleAlt,
  faBars,
  faTimes,
  faHome,
  faSearch,
  faPlusCircle,
  faBoxes,
  faUserNurse,
  faShoppingCart,
  faTruck,
  faCog,
  faSignOutAlt,
  faChevronRight,
  faStoreAlt,
  faHistory
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pharmacy-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule, NotificationBellComponent],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      
      <!-- Mobile Header -->
      <div class="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-5 flex items-center justify-between sticky top-0 z-40 transition-all">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <fa-icon [icon]="faPrescriptionBottleAlt" class="text-lg"></fa-icon>
          </div>
          <span class="text-lg font-bold tracking-tighter text-slate-900">{{ currentUser?.pharmacyName || 'Terminal' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <app-notification-bell></app-notification-bell>
          <button (click)="toggleSidebar()" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 transition-all border border-slate-100">
            <fa-icon [icon]="isSidebarOpen ? faTimes : faBars"></fa-icon>
          </button>
        </div>
      </div>

      <!-- Private Sidebar Backdrop -->
      <div *ngIf="isSidebarOpen" (click)="toggleSidebar()" 
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-fadeIn"></div>

      <!-- Professional Sidebar -->
      <aside [ngClass]="{'translate-x-0 shadow-2xl': isSidebarOpen, '-translate-x-full': !isSidebarOpen}"
             class="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transition-all duration-500 md:translate-x-0">
        
        <!-- Premium Logo Area -->
        <div class="h-24 flex items-center px-8 border-b border-slate-50 justify-between">
          <div class="flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
              <fa-icon [icon]="faPrescriptionBottleAlt" class="text-xl"></fa-icon>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">Medicam Hub</span>
              <span class="text-sm font-bold text-slate-900 tracking-tighter leading-none truncate max-w-[140px]">{{ pharmacyName || 'Pharmacy' }}</span>
            </div>
          </div>
          <app-notification-bell position="left" class="hidden md:block"></app-notification-bell>
        </div>

        <!-- Semantic Navigation -->
        <nav class="flex-1 px-5 py-8 space-y-8 overflow-y-auto overflow-x-hidden">
          
          <div class="space-y-1">
            <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Dashboard</p>
            
            <ng-container *ngIf="currentUser?.role === 'PHARMACY_ADMIN'">
              <a routerLink="/pharmacy-admin/dashboard" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faHome" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Pilotage Global</span>
                <fa-icon [icon]="faChevronRight" class="ml-auto text-[8px] opacity-0 group-hover:opacity-100 transition-all transform translate-x-1"></fa-icon>
              </a>
              <a routerLink="/pharmacy-admin/global-search" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faSearch" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Recherche Smart</span>
              </a>
            </ng-container>

            <ng-container *ngIf="currentUser?.role === 'PHARMACY_EMPLOYEE'">
              <a routerLink="/pharmacy/dashboard" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faHome" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Terminal Vendeur</span>
              </a>
            </ng-container>
          </div>

          <div class="space-y-1">
            <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Opérations</p>

            <ng-container *ngIf="currentUser?.role === 'PHARMACY_ADMIN'">
              <a *ngIf="!currentUser?.pharmacyId" routerLink="/pharmacy-admin/create-pharmacy" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faPlusCircle" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Initier Pharmacie</span>
              </a>

              <a *ngIf="currentUser?.pharmacyId" routerLink="/pharmacy-admin/inventory" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faBoxes" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Stock & Inventaire</span>
              </a>

              <a *ngIf="currentUser?.pharmacyId" routerLink="/pharmacy-admin/employees" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
                 class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
                <fa-icon [icon]="faUserNurse" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
                <span>Équipe Médicale</span>
              </a>
            </ng-container>

            <a [routerLink]="currentUser?.role === 'PHARMACY_ADMIN' ? '/pharmacy-admin/orders' : '/pharmacy/orders'" 
               routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
               class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
              <fa-icon [icon]="faShoppingCart" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
              <span>Flux Commandes</span>
            </a>

            <a *ngIf="currentUser?.role === 'PHARMACY_EMPLOYEE' || currentUser?.role === 'DELIVERY'" 
               routerLink="/pharmacy/deliveries" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
               class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
               <fa-icon [icon]="faTruck" class="w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
               <span>Logistique Urbaine</span>
            </a>
          </div>

          <div class="space-y-1" *ngIf="currentUser?.role === 'PHARMACY_ADMIN'">
            <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Système</p>
            <a routerLink="/pharmacy-admin/audit-logs" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
               class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
              <fa-icon [icon]="faHistory" class="sidebar-icon w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
              <span>Logs d'Audit</span>
            </a>
            <a routerLink="/pharmacy-admin/settings" routerLinkActive="bg-indigo-50/50 text-indigo-600 shadow-sm shadow-indigo-100/50" (click)="closeSidebar()"
               class="flex items-center px-4 py-3 text-xs font-bold text-slate-500 rounded-2xl transition-all duration-300 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 group">
              <fa-icon [icon]="faCog" class="sidebar-icon w-5 h-5 mr-4 text-slate-300 group-hover:text-indigo-500 transition-colors"></fa-icon>
              <span>Paramétrage</span>
            </a>
          </div>
        </nav>

        <!-- Identity Section -->
        <div class="p-6 border-t border-slate-50 bg-slate-50/30">
          <div class="auth-card !p-4 !border-none !shadow-sm flex items-center gap-4 mb-4 hover:shadow-md transition-all cursor-pointer"
               [routerLink]="currentUser?.role === 'PHARMACY_ADMIN' ? '/pharmacy-admin/profile' : '/pharmacy/profile'" (click)="closeSidebar()">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
              {{ currentUser?.firstName?.charAt(0) }}{{ currentUser?.lastName?.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-900 tracking-tight truncate">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</p>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5 truncate">{{ currentUser?.role?.replace('PHARMACY_', '') }}</p>
            </div>
          </div>
          
          <button (click)="logout()" class="w-full h-12 flex items-center justify-center gap-3 px-4 rounded-2xl text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700 transition-all border border-rose-100/50">
            <fa-icon [icon]="faSignOutAlt" class="text-xs"></fa-icon>
            Déconnexion
          </button>
        </div>
      </aside>

      <!-- Dynamic Content Injection -->
      <main class="md:ml-72 min-h-screen transition-all duration-500 ease-in-out">
        <div class="max-w-[1600px] mx-auto min-h-screen border-l border-slate-50 bg-white">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class PharmacyAdminLayoutComponent implements OnInit {
  faPrescriptionBottleAlt = faPrescriptionBottleAlt;
  faBars = faBars;
  faTimes = faTimes;
  faHome = faHome;
  faSearch = faSearch;
  faPlusCircle = faPlusCircle;
  faBoxes = faBoxes;
  faUserNurse = faUserNurse;
  faShoppingCart = faShoppingCart;
  faTruck = faTruck;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;
  faChevronRight = faChevronRight;
  faStoreAlt = faStoreAlt;
  faHistory = faHistory;

  isSidebarOpen = false;
  currentUser: any = null;
  pharmacyName: string = '';

  constructor(
    private authService: AuthService,
    private pharmacyService: PharmacyService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadPharmacyName();
  }

  loadPharmacyName(): void {
    const pharmacyId = this.authService.getUserPharmacyId();
    if (pharmacyId) {
      this.pharmacyService.getById(pharmacyId).subscribe({
        next: (pharmacy) => {
          this.pharmacyName = pharmacy.name;
        },
        error: (err: any) => {
          console.error('Error loading pharmacy name', err);
          this.pharmacyName = 'Ma Pharmacie';
        }
      });
    }
  }

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
