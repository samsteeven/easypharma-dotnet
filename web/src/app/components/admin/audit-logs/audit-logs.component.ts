import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AuditService } from '../../../services/audit.service';
import { AuditLog } from '../../../models/audit.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHistory,
  faSearch,
  faFilter,
  faUser,
  faCalendarAlt,
  faInfoCircle,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      <!-- Header Area -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-2">
            <div class="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <fa-icon [icon]="faHistory" class="text-xl"></fa-icon>
            </div>
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Logs d'Audit</h1>
                <p class="text-slate-500 text-sm">Traçabilité complète des actions critiques sur la plateforme.</p>
            </div>
        </div>
      </div>

      <!-- Filters & Controls -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <fa-icon [icon]="faFilter"></fa-icon> Filtrer par Action
            </label>
            <select [(ngModel)]="filterAction" (change)="loadLogs()" 
                    class="block w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none appearance-none">
              <option value="">Toutes les actions</option>
              <option value="UPDATE_ORDER_STATUS">Statut Commande</option>
              <option value="ASSIGN_DELIVERY">Assignation Livraison</option>
              <option value="UPDATE_INVENTORY">Mise à jour Stock</option>
              <option value="DELETE_MEDICATION">Suppression Médicament</option>
              <option value="LOGIN">Connexion</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <fa-icon [icon]="faUser"></fa-icon> ID Utilisateur
            </label>
            <div class="relative">
                <input type="text" [(ngModel)]="filterUserId" (keyup.enter)="loadLogs()"
                       class="block w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all outline-none"
                       placeholder="Rechercher par ID...">
                <fa-icon [icon]="faSearch" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></fa-icon>
            </div>
          </div>

          <div class="flex items-end">
            <button (click)="loadLogs()" 
                    class="w-full bg-slate-900 text-white rounded-2xl px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                Actualiser la liste
            </button>
          </div>
        </div>
      </div>

      <!-- Logs Content -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-24">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-indigo-600 mb-4"></div>
            <p class="text-slate-400 font-medium animate-pulse">Chargement de l'historique...</p>
        </div>

        <div *ngIf="!isLoading" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="py-5 pl-8 pr-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Horodatage</th>
                <th class="px-3 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Utilisateur</th>
                <th class="px-3 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Opération</th>
                <th class="px-3 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Détails</th>
                <th class="px-3 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Origine IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let log of logs" class="hover:bg-slate-50/50 transition-colors group">
                <td class="whitespace-nowrap py-5 pl-8 pr-3">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-900">{{ log.timestamp | date:'dd/MM/yyyy' }}</span>
                        <span class="text-[11px] font-medium text-slate-400">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                    </div>
                </td>
                <td class="whitespace-nowrap px-3 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                            {{ log.username.charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-semibold text-slate-700">{{ log.username }}</span>
                            <span class="text-[10px] text-slate-400 font-mono">{{ log.userId.substring(0, 8) }}...</span>
                        </div>
                    </div>
                </td>
                <td class="whitespace-nowrap px-3 py-5">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="getActionClass(log.action)">
                    {{ log.action.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-3 py-5">
                    <div class="max-w-xs xl:max-w-md bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-white transition-colors">
                        <p class="text-xs text-slate-600 leading-relaxed italic line-clamp-2">"{{ log.details }}"</p>
                    </div>
                </td>
                <td class="whitespace-nowrap px-3 py-5">
                    <div class="flex items-center gap-2 text-slate-400">
                        <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span class="text-xs font-mono font-medium">{{ log.ipAddress }}</span>
                    </div>
                </td>
              </tr>
              <tr *ngIf="logs.length === 0">
                <td colspan="5" class="px-8 py-32 text-center">
                  <div class="flex flex-col items-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                        <fa-icon [icon]="faInfoCircle" class="text-4xl"></fa-icon>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900">Aucun log enregistré</h3>
                    <p class="text-slate-500 max-w-xs mt-2">Aucune activité correspondant à vos critères n'a été trouvée dans les registres.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
           <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page {{ currentPage + 1 }} sur {{ totalPages }}
           </p>
           <div class="flex gap-2">
              <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0"
                      class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white transition-all disabled:opacity-30">
                <fa-icon [icon]="faChevronLeft"></fa-icon>
              </button>
              <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages - 1"
                      class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white transition-all disabled:opacity-30">
                <fa-icon [icon]="faChevronRight"></fa-icon>
              </button>
           </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  faHistory = faHistory;
  faSearch = faSearch;
  faFilter = faFilter;
  faUser = faUser;
  faCalendarAlt = faCalendarAlt;
  faInfoCircle = faInfoCircle;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  logs: AuditLog[] = [];
  isLoading = false;
  filterAction = '';
  filterUserId = '';
  currentPage = 0;
  totalPages = 0;
  pageSize = 15;

  constructor(
    private auditService: AuditService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    const pharmacyId = this.authService.getUserPharmacyId();
    const isSuperAdmin = this.authService.isSuperAdmin();

    if (this.filterUserId) {
      this.auditService.getUserLogs(this.filterUserId, this.currentPage, this.pageSize).subscribe({
        next: (data) => this.handleResponse(data),
        error: () => this.isLoading = false
      });
    } else if (this.filterAction) {
      this.auditService.getLogsByAction(this.filterAction, this.currentPage, this.pageSize).subscribe({
        next: (data) => this.handleResponse(data),
        error: () => this.isLoading = false
      });
    } else if (isSuperAdmin) {
      this.auditService.getAllLogs(this.currentPage, this.pageSize).subscribe({
        next: (data) => this.handleResponse(data),
        error: () => this.isLoading = false
      });
    } else if (pharmacyId) {
      this.auditService.getPharmacyLogs(pharmacyId, this.currentPage, this.pageSize).subscribe({
        next: (data) => this.handleResponse(data),
        error: () => this.isLoading = false
      });
    } else {
      this.isLoading = false;
    }
  }

  private handleResponse(data: any): void {
    this.logs = data.content;
    this.totalPages = data.totalPages;
    this.isLoading = false;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      'UPDATE_ORDER_STATUS': 'bg-blue-50 text-blue-600 border border-blue-100',
      'ASSIGN_DELIVERY': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'UPDATE_INVENTORY': 'bg-amber-50 text-amber-600 border border-amber-100',
      'DELETE_MEDICATION': 'bg-rose-50 text-rose-600 border border-rose-100',
      'LOGIN': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      'LOGOUT': 'bg-slate-50 text-slate-600 border border-slate-100'
    };
    return classes[action] || 'bg-slate-50 text-slate-600 border border-slate-100';
  }
}

