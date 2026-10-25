import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus } from '../../../models/order.model';
import { DeliveryAssignmentService, Courier } from '../../../services/delivery-assignment.service';
import { EmployeePermissionService } from '../../../services/employee-permission.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch,
  faFilter,
  faEye,
  faCheck,
  faBoxOpen,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faSpinner,
  faUserTie,
  faHistory,
  faFileInvoice,
  faCalendarAlt,
  faChevronRight,
  faUser,
  faMapMarkerAlt,
  faChevronDown,
  faPrescription,
  faCapsules,
  faTimes,
  faHandPointer
} from '@fortawesome/free-solid-svg-icons';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, DragDropModule],
  template: `
    <div class="page-bg-refined p-8 space-y-8 animate-fadeInUp">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-semibold text-slate-900 tracking-tight">Flux de Commandes Kanban</h1>
          <p class="mt-1 text-slate-500 font-medium tracking-tight">Gérez l'état des commandes par glisser-déposer pour une logistique fluide.</p>
        </div>
        
        <div class="flex items-center gap-4">
            <button (click)="loadOrders()" class="btn-secondary !py-2 !px-4 flex items-center gap-2">
                <fa-icon [icon]="faHistory"></fa-icon> Rafraîchir
            </button>
            <div class="flex bg-slate-100 p-1 rounded-xl">
                 <button (click)="viewMode = 'KANBAN'" [class.bg-white]="viewMode === 'KANBAN'" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Kanban</button>
                 <button (click)="viewMode = 'LIST'" [class.bg-white]="viewMode === 'LIST'" class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Liste</button>
            </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-24">
        <div class="w-12 h-12 mb-4 animate-spin text-indigo-500">
          <fa-icon [icon]="faSpinner" class="text-4xl"></fa-icon>
        </div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Synchronisation des flux...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="auth-card !border-rose-100 !bg-rose-50/30 flex items-center gap-6 animate-shake">
        <div class="icon-container-rose w-14 h-14 !bg-white">
          <fa-icon [icon]="faTimesCircle" class="text-xl"></fa-icon>
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-rose-900 tracking-tight">Erreur de chargement</h4>
          <p class="text-rose-700 font-medium text-sm">{{ errorMessage }}</p>
        </div>
        <button (click)="loadOrders()" class="btn-primary !bg-rose-600 hover:!bg-rose-700 shadow-rose-100">
          Réessayer
        </button>
      </div>

      <!-- Kanban View -->
      <div *ngIf="!isLoading && viewMode === 'KANBAN' && !errorMessage" class="flex gap-6 overflow-x-auto pb-8 min-h-[70vh]" cdkDropListGroup>
        
        <!-- Column Template -->
        <div *ngFor="let col of kanbanColumns" class="flex-shrink-0 w-80 flex flex-col gap-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex items-center gap-2">
              <span [ngClass]="getStatusColor(col.status)" class="w-2 h-2 rounded-full"></span>
              <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{{ formatStatus(col.status) }}</h3>
            </div>
            <span class="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
          </div>

          <div 
            cdkDropList
            [cdkDropListData]="col.orders"
            (cdkDropListDropped)="drop($event, col.status)"
            class="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 min-h-[500px] transition-colors hover:bg-slate-100/30">
            
            <div *ngFor="let order of col.orders" cdkDrag class="auth-card !p-4 mb-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group">
              <div class="flex justify-between items-start mb-3">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{{ order.id.slice(0, 8) }}</span>
                <span class="text-xs font-bold text-slate-900">{{ order.totalAmount | currency:'XAF':'symbol':'1.0-0' }}</span>
              </div>
              
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px]">
                    <fa-icon [icon]="faCapsules"></fa-icon>
                </div>
                <span class="text-[11px] font-semibold text-slate-700 truncate">{{ order.items[0]?.medicationName || 'Médicament' }}</span>
              </div>

              <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                 <div class="flex items-center gap-2">
                    <fa-icon [icon]="faClock" class="text-slate-300 text-[9px]"></fa-icon>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">{{ order.createdAt | date:'HH:mm' }}</span>
                 </div>
                 <button *ngIf="col.status === 'READY' && canAssignDeliveries" (click)="$event.stopPropagation(); openAssignModal(order)" 
                         class="text-[8px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md">
                    Assigner <fa-icon [icon]="faTruck" class="text-[7px]"></fa-icon>
                 </button>
              </div>

              <!-- Drag Preview -->
              <div *cdkDragPlaceholder class="bg-indigo-50 border-2 border-dashed border-indigo-200 h-24 rounded-2xl mb-4"></div>
            </div>
            
            <!-- Empty state in col -->
            <div *ngIf="col.orders.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-300">
                <fa-icon [icon]="faHandPointer" class="text-xl mb-2 opacity-20"></fa-icon>
                <p class="text-[8px] font-bold uppercase tracking-widest opacity-40">Déposer ici</p>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div *ngIf="!isLoading && viewMode === 'LIST' && !errorMessage" class="space-y-6">
         <div class="auth-card !py-24 flex flex-col items-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Mode Liste Standard en cours d'optimisation...</p>
         </div>
      </div>

      <!-- Delivery Assignment Modal -->
      <div *ngIf="showAssignModal" class="fixed inset-0 z-[100] overflow-y-auto">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" (click)="closeAssignModal()"></div>

        <div class="flex min-h-screen items-center justify-center p-4">
          <div class="auth-card !p-0 w-full max-w-md overflow-hidden animate-fadeInUp shadow-2xl">
            <div class="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="icon-container-indigo w-12 h-12">
                  <fa-icon [icon]="faUserTie" class="text-xl"></fa-icon>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-slate-900 tracking-tight">Logistique Livraison</h3>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Commande #{{ selectedOrder?.id?.slice(0, 8) }}</p>
                </div>
              </div>
              <button (click)="closeAssignModal()" class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <fa-icon [icon]="faTimes"></fa-icon>
              </button>
            </div>

            <div class="p-8">
              <div *ngIf="availableCouriers.length === 0" class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <fa-icon [icon]="faUserTie" class="text-4xl text-slate-200 mb-4"></fa-icon>
                <p class="text-slate-500 font-semibold text-sm tracking-tight">Aucun livreur disponible</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 px-4">Activez des livreurs dans la gestion des employés.</p>
              </div>

              <div *ngIf="availableCouriers.length > 0" class="space-y-4">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Livreurs en service</label>
                <div *ngFor="let courier of availableCouriers" 
                     (click)="selectedCourierId = courier.id"
                     [ngClass]="{
                       'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-sm': selectedCourierId === courier.id,
                       'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50': selectedCourierId !== courier.id
                     }"
                     class="group border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex items-center gap-4">
                  
                  <div class="icon-container-blue w-12 h-12 shrink-0 group-hover:bg-white transition-colors">
                    <fa-icon [icon]="faUser" class="text-sm"></fa-icon>
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-slate-900 tracking-tight transition-colors" [class.text-indigo-600]="selectedCourierId === courier.id">{{ courier.firstName }} {{ courier.lastName }}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ courier.phone }}</p>
                  </div>
                  <div *ngIf="selectedCourierId === courier.id" class="text-indigo-600 animate-fadeInUp">
                    <fa-icon [icon]="faCheckCircle" class="text-xl"></fa-icon>
                  </div>
                </div>
              </div>

              <div class="mt-10 flex gap-4 pt-8 border-t border-slate-100">
                <button (click)="closeAssignModal()" 
                        [disabled]="isAssigning"
                        class="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                  Conserver
                </button>
                <button (click)="assignDelivery()" 
                        [disabled]="!selectedCourierId || isAssigning"
                        class="flex-[2] btn-primary !py-4 shadow-lg shadow-indigo-100">
                  <span *ngIf="!isAssigning" class="flex items-center justify-center gap-2">
                    Lancer la livraison <fa-icon [icon]="faTruck"></fa-icon>
                  </span>
                  <span *ngIf="isAssigning" class="flex items-center justify-center gap-3">
                    <fa-icon [icon]="faSpinner" animation="spin"></fa-icon> Flux Logistique...
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderManagementComponent implements OnInit {
  // Icons
  faSearch = faSearch;
  faFilter = faFilter;
  faEye = faEye;
  faCheck = faCheck;
  faBoxOpen = faBoxOpen;
  faTruck = faTruck;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faClock = faClock;
  faSpinner = faSpinner;
  faUserTie = faUserTie;
  faHistory = faHistory;
  faFileInvoice = faFileInvoice;
  faCalendarAlt = faCalendarAlt;
  faChevronRight = faChevronRight;
  faUser = faUser;
  faMapMarkerAlt = faMapMarkerAlt;
  faChevronDown = faChevronDown;
  faPrescription = faPrescription;
  faCapsules = faCapsules;
  faTimes = faTimes;
  faHandPointer = faHandPointer;

  viewMode: 'KANBAN' | 'LIST' = 'KANBAN';
  kanbanColumns: { status: string, orders: Order[] }[] = [];

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  isUpdating: string | null = null;
  errorMessage: string | null = null;

  currentFilter: string = 'ALL';
  filterStatuses = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

  // Delivery Assignment
  showAssignModal = false;
  selectedOrder: Order | null = null;
  availableCouriers: Courier[] = [];
  selectedCourierId: string = '';
  isAssigning = false;
  canAssignDeliveries = true;
  canPrepareOrders = true;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private deliveryService: DeliveryAssignmentService,
    private permissionService: EmployeePermissionService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
    this.checkPermissions();
  }

  checkPermissions(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (currentUser.role === 'PHARMACY_ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      this.canAssignDeliveries = true;
      this.canPrepareOrders = true;
      return;
    }

    this.permissionService.getPermissions(currentUser.id).subscribe({
      next: (perms) => {
        this.canAssignDeliveries = perms.canAssignDeliveries;
        this.canPrepareOrders = perms.canPrepareOrders;
      },
      error: (err) => console.error('Error checking permissions', err)
    });
  }

  loadOrders(): void {
    const pharmacyId = this.authService.getUserPharmacyId();
    if (!pharmacyId) {
      this.errorMessage = "Identifiant de pharmacie non trouvé.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.orderService.getPharmacyOrders(pharmacyId).subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        this.applyFilter();
        this.generateKanbanColumns();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading orders', err);
        this.errorMessage = "Impossible de charger les commandes.";
        this.isLoading = false;
      }
    });
  }

  generateKanbanColumns(): void {
    const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
    this.kanbanColumns = statuses.map(status => ({
      status,
      orders: this.orders.filter(o => o.status === status)
    }));
  }

  drop(event: CdkDragDrop<Order[]>, newStatus: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const order = event.previousContainer.data[event.previousIndex];

      // Optmistic UI Update
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Backend Update
      this.updateStatus(order, newStatus);
    }
  }

  applyFilter(): void {
    if (this.currentFilter === 'ALL') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
    }
    // Sort by Date DESC
    this.filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateStatus(order: Order, newStatus: string): void {
    const statusEnum = newStatus as OrderStatus;
    this.isUpdating = order.id;

    this.orderService.updateStatus(order.id, statusEnum).subscribe({
      next: (updatedOrder: Order) => {
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        this.applyFilter();
        this.generateKanbanColumns(); // Refresh columns
        this.isUpdating = null;
      },
      error: (err: any) => {
        console.error('Update failed', err);
        alert("Échec de la mise à jour du statut.");
        this.isUpdating = null;
        this.loadOrders(); // Rollback on error
      }
    });
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'ALL': return 'Tout';
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'PREPARING': return 'En préparation';
      case 'READY': return 'Prête';
      case 'DELIVERING': return 'En livraison';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'CONFIRMED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PREPARING': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'READY': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DELIVERING': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'DELIVERED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  openAssignModal(order: Order): void {
    this.selectedOrder = order;
    this.showAssignModal = true;
    this.selectedCourierId = '';
    this.loadCouriers();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedOrder = null;
    this.selectedCourierId = '';
  }

  loadCouriers(): void {
    const pharmacyId = this.authService.getUserPharmacyId();
    if (!pharmacyId) return;

    this.deliveryService.getAvailableCouriers(pharmacyId).subscribe({
      next: (couriers) => {
        this.availableCouriers = couriers.filter(c => c.isActive);
      },
      error: (err) => {
        console.error('Error loading couriers', err);
        alert('Impossible de charger la liste des livreurs.');
      }
    });
  }

  assignDelivery(): void {
    if (!this.selectedOrder || !this.selectedCourierId) return;

    this.isAssigning = true;
    this.deliveryService.assignDelivery(this.selectedOrder.id, this.selectedCourierId).subscribe({
      next: () => {
        alert('Livreur assigné avec succès !');
        this.closeAssignModal();
        this.loadOrders();
        this.isAssigning = false;
      },
      error: (err) => {
        console.error('Assignment failed', err);
        alert('Échec de l\'assignation du livreur.');
        this.isAssigning = false;
      }
    });
  }
}
