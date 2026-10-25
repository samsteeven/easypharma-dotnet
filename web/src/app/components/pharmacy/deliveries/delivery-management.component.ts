import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { DeliveryService } from '../../../services/delivery.service';
import { Delivery, DeliveryStatus } from '../../../models/delivery.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTruck,
  faBoxOpen,
  faCheck,
  faMapMarkerAlt,
  faClock,
  faSpinner,
  faUser,
  faExclamationCircle,
  faChevronRight,
  faCalendarAlt,
  faCheckCircle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-delivery-management',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="page-bg-refined p-8 space-y-8 animate-fadeInUp min-h-screen">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 tracking-tight">Gestion Logistique</h1>
          <p class="mt-1 text-slate-500 font-medium tracking-tight">Flux de distribution et suivi des assignations en temps réel.</p>
        </div>
        
        <!-- Tabbed Navigation -->
        <div class="auth-card !p-1 flex bg-slate-100/50 gap-1 overflow-x-auto max-w-full">
          <button 
            (click)="activeTab = 'AVAILABLE'"
            [class.bg-white]="activeTab === 'AVAILABLE'"
            [class.shadow-sm]="activeTab === 'AVAILABLE'"
            [class.text-indigo-600]="activeTab === 'AVAILABLE'"
            [class.text-slate-500]="activeTab !== 'AVAILABLE'"
            class="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap hover:text-indigo-500 flex items-center gap-2">
            <fa-icon [icon]="faBoxOpen" class="text-[10px]"></fa-icon>
            Disponibles
          </button>
          <button 
            (click)="activeTab = 'MY_DELIVERIES'"
            [class.bg-white]="activeTab === 'MY_DELIVERIES'"
            [class.shadow-sm]="activeTab === 'MY_DELIVERIES'"
            [class.text-indigo-600]="activeTab === 'MY_DELIVERIES'"
            [class.text-slate-500]="activeTab !== 'MY_DELIVERIES'"
            class="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap hover:text-indigo-500 flex items-center gap-2">
            <fa-icon [icon]="faTruck" class="text-[10px]"></fa-icon>
            Mes Livraisons
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-24">
        <div class="w-12 h-12 mb-4 animate-spin flex items-center justify-center text-indigo-500">
          <fa-icon [icon]="faSpinner" class="text-4xl"></fa-icon>
        </div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose text-center">Synchronisation des flux logistiques...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="auth-card !border-rose-100 !bg-rose-50/30 flex items-center gap-6 animate-shake">
        <div class="icon-container-rose w-14 h-14 !bg-white">
          <fa-icon [icon]="faExclamationCircle" class="text-xl"></fa-icon>
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-rose-900 tracking-tight">Anomalie de Synchronisation</h4>
          <p class="text-rose-700 font-medium text-sm">{{ errorMessage }}</p>
        </div>
        <button (click)="loadData()" class="btn-primary !bg-rose-600 hover:!bg-rose-700 shadow-rose-100">
          Réessayer
        </button>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !errorMessage" class="space-y-8">
        
        <!-- Tab 1: Available Deliveries -->
        <div *ngIf="activeTab === 'AVAILABLE'">
          <div *ngIf="availableDeliveries.length === 0" class="auth-card !py-24 flex flex-col items-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
            <div class="icon-container-blue w-20 h-20 mb-6 !bg-slate-50 !text-slate-300">
              <fa-icon [icon]="faBoxOpen" class="text-4xl"></fa-icon>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 tracking-tight">Aucun flux disponible</h3>
            <p class="mt-2 text-slate-500 font-medium text-center max-w-sm">Toutes les vagues de livraison ont été absorbées par le réseau.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let delivery of availableDeliveries" class="auth-card !p-0 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <div class="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <span class="inline-flex px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Flux Prêt
                    </span>
                    <h3 class="text-lg font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">Ref #{{ delivery.orderId.slice(0, 8) }}</h3>
                </div>
                <div class="icon-container-blue w-12 h-12 !bg-white">
                    <fa-icon [icon]="faBoxOpen" class="text-sm"></fa-icon>
                </div>
              </div>
              
              <div class="p-6 space-y-4">
                  <div class="flex items-center gap-4 group/item">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                        <fa-icon [icon]="faUser" class="text-xs"></fa-icon>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-600 tracking-tight">{{ delivery.customerName || 'Client' }}</span>
                  </div>
                  <div class="flex items-center gap-4 group/item">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                        <fa-icon [icon]="faMapMarkerAlt" class="text-xs"></fa-icon>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-600 tracking-tight truncate flex-1">{{ delivery.deliveryAddress }}</span>
                  </div>
                  <div class="flex items-center gap-4 group/item">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                        <fa-icon [icon]="faCalendarAlt" class="text-xs"></fa-icon>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-600 tracking-tight">{{ delivery.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  </div>
              </div>

              <div class="p-6 border-t border-slate-100">
                  <button (click)="acceptDelivery(delivery)" 
                          [disabled]="isActionLoading === delivery.id"
                          class="w-full btn-primary !py-4 shadow-lg shadow-indigo-100 flex justify-center items-center gap-3">
                    <fa-icon [icon]="isActionLoading === delivery.id ? faSpinner : faCheck" [animation]="isActionLoading === delivery.id ? 'spin' : undefined"></fa-icon>
                    <span class="text-[10px] font-bold uppercase tracking-widest">Activer la prise en charge</span>
                  </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: My Deliveries -->
        <div *ngIf="activeTab === 'MY_DELIVERIES'">
          <div *ngIf="myDeliveries.length === 0" class="auth-card !py-24 flex flex-col items-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
            <div class="icon-container-blue w-20 h-20 mb-6 !bg-slate-50 !text-slate-300">
              <fa-icon [icon]="faTruck" class="text-4xl"></fa-icon>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 tracking-tight">Mission Logistique Vide</h3>
            <p class="mt-2 text-slate-500 font-medium text-center max-w-sm">Vous n'avez actuellement aucune course active sous votre responsabilité.</p>
          </div>

          <div class="grid grid-cols-1 gap-6">
            <div *ngFor="let delivery of myDeliveries" class="auth-card !p-0 overflow-hidden hover:shadow-xl transition-all border-transparent hover:border-indigo-50">
              <div class="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-4 mb-4">
                    <h3 class="text-2xl font-bold text-slate-900 tracking-tighter truncate">
                      Flux #{{ delivery.orderId.slice(0, 8) }}
                    </h3>
                    <span [ngClass]="getStatusColor(delivery.status)"
                          class="inline-flex px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border">
                      {{ formatStatus(delivery.status) }}
                    </span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                       <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <fa-icon [icon]="faUser" class="text-xs"></fa-icon>
                       </div>
                       <span class="text-sm font-semibold text-slate-600 tracking-tight">{{ delivery.customerName || 'Client' }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                       <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <fa-icon [icon]="faMapMarkerAlt" class="text-xs"></fa-icon>
                       </div>
                       <span class="text-sm font-semibold text-slate-600 tracking-tight truncate">{{ delivery.deliveryAddress }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                   <button *ngIf="delivery.status === 'ASSIGNED'" 
                           (click)="updateStatus(delivery, 'IN_TRANSIT')"
                           [disabled]="isActionLoading === delivery.id"
                           class="btn-primary !px-8 !py-4 shadow-xl shadow-indigo-100 flex items-center gap-3">
                     <fa-icon [icon]="isActionLoading === delivery.id ? faSpinner : faTruck" [animation]="isActionLoading === delivery.id ? 'spin' : undefined"></fa-icon>
                     <span class="text-[10px] font-bold uppercase tracking-widest">Enclencher transit</span>
                   </button>

                   <button *ngIf="delivery.status === 'IN_TRANSIT'" 
                           (click)="updateStatus(delivery, 'DELIVERED')"
                           [disabled]="isActionLoading === delivery.id"
                           class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-8 py-4 flex items-center gap-3 transition-all shadow-xl shadow-emerald-100">
                     <fa-icon [icon]="isActionLoading === delivery.id ? faSpinner : faCheck" [animation]="isActionLoading === delivery.id ? 'spin' : undefined"></fa-icon>
                     <span class="text-[10px] font-bold uppercase tracking-widest">Validation Finale</span>
                   </button>
                   
                   <div *ngIf="delivery.status === 'DELIVERED'" class="flex items-center gap-4 bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">
                      <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <fa-icon [icon]="faCheckCircle" class="text-xs"></fa-icon>
                      </div>
                      <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Mission Terminée</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DeliveryManagementComponent implements OnInit {
  // Icons
  faTruck = faTruck;
  faBoxOpen = faBoxOpen;
  faCheck = faCheck;
  faMapMarkerAlt = faMapMarkerAlt;
  faClock = faClock;
  faSpinner = faSpinner;
  faUser = faUser;
  faExclamationCircle = faExclamationCircle;
  faChevronRight = faChevronRight;
  faCalendarAlt = faCalendarAlt;
  faCheckCircle = faCheckCircle;
  faArrowLeft = faArrowLeft;

  activeTab: 'AVAILABLE' | 'MY_DELIVERIES' = 'AVAILABLE';
  availableDeliveries: Delivery[] = [];
  myDeliveries: Delivery[] = [];

  isLoading = false;
  isActionLoading: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Load both lists
    const pharmacyId = this.authService.getUserPharmacyId();

    // In a real app we might combine these or load only active tab
    // For simplicity, we load 'my deliveries' first as it works for everyone
    this.deliveryService.getMyDeliveries().subscribe({
      next: (myRes) => {
        this.myDeliveries = myRes;

        if (pharmacyId) {
          this.deliveryService.getAvailableDeliveries(pharmacyId).subscribe({
            next: (availRes) => {
              this.availableDeliveries = availRes;
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Failed to load available deliveries locally', err);
              // Might just be empty if endpoint fails differently
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load my deliveries', err);
        this.errorMessage = "Impossible de charger les livraisons.";
        this.isLoading = false;
      }
    });
  }

  acceptDelivery(delivery: Delivery): void {
    this.isActionLoading = delivery.id;
    this.deliveryService.acceptDelivery(delivery.id).subscribe({
      next: (updated) => {
        // Move from available to mine
        this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== delivery.id);
        this.myDeliveries.unshift(updated);
        this.activeTab = 'MY_DELIVERIES';
        this.isActionLoading = null;
      },
      error: (err) => {
        alert("Erreur lors de l'acceptation.");
        this.isActionLoading = null;
      }
    });
  }

  updateStatus(delivery: Delivery, statusStr: string): void {
    const status = statusStr as DeliveryStatus;
    this.isActionLoading = delivery.id;
    this.deliveryService.updateStatus(delivery.id, status).subscribe({
      next: (updated) => {
        // Update local list
        const index = this.myDeliveries.findIndex(d => d.id === delivery.id);
        if (index !== -1) {
          this.myDeliveries[index] = updated;
        }
        this.isActionLoading = null;
      },
      error: (err) => {
        alert("Erreur lors de la mise à jour.");
        this.isActionLoading = null;
      }
    });
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'ASSIGNED': return 'Assigné';
      case 'IN_TRANSIT': return 'En transit';
      case 'DELIVERED': return 'Livré';
      case 'RETURNED': return 'Retourné';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ASSIGNED': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'IN_TRANSIT': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }
}
