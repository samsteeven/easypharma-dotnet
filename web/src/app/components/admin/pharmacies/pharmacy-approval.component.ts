import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../../services/pharmacy.service';
import { Pharmacy, PharmacyStatus } from '../../../models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-approval',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Validation des Pharmacies</h1>
          <p class="mt-1 text-sm text-gray-500">Gérez les demandes d'ouverture et les statuts des pharmacies.</p>
        </div>
        <div class="flex gap-2">
          <select (change)="filterByStatus($event)" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            <option value="ALL" selected>Tous les statuts</option>
            <option value="PENDING">En Attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="REJECTED">Rejetées</option>
            <option value="SUSPENDED">Suspendues</option>
          </select>
        </div>
      </div>

      <!-- Pharmacy List -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul *ngIf="filteredPharmacies.length > 0; else emptyState" class="divide-y divide-gray-200">
          <li *ngFor="let pharmacy of filteredPharmacies">
            <div class="block hover:bg-gray-50 transition duration-150 ease-in-out">
              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-blue-600 truncate">
                    {{ pharmacy.name }}
                  </div>
                  <div class="ml-2 flex-shrink-0 flex">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          [ngClass]="getStatusClass(pharmacy.status)">
                      {{ getStatusLabel(pharmacy.status) }}
                    </span>
                  </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                  <div class="sm:flex">
                    <p class="flex items-center text-sm text-gray-500">
                      <i class="fas fa-map-marker-alt flex-shrink-0 mr-1.5 text-gray-400"></i>
                      {{ pharmacy.city }}
                    </p>
                    <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <i class="fas fa-user flex-shrink-0 mr-1.5 text-gray-400"></i>
                      {{ getOwnerFullName(pharmacy) }}
                    </p>
                  </div>
                  <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <i class="fas fa-calendar flex-shrink-0 mr-1.5 text-gray-400"></i>
                    <p>
                      Inscrit le <time>{{ pharmacy.createdAt | date:'shortDate' }}</time>
                    </p>
                  </div>
                </div>
                <div class="mt-4 flex justify-end gap-3">
                  <a [routerLink]="['/admin/pharmacies', pharmacy.id]" 
                     class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Voir Détails
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <ng-template #emptyState>
          <div class="text-center py-12">
            <p class="text-sm text-gray-500">Aucune pharmacie trouvée pour ce filtre.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class PharmacyApprovalComponent implements OnInit {
  pharmacies: Pharmacy[] = [];
  filteredPharmacies: Pharmacy[] = [];
  currentFilter: string = 'ALL';

  constructor(private pharmacyService: PharmacyService) { }

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.pharmacyService.getAllForAdmin().subscribe({
      next: (data) => {
        this.pharmacies = data;
        this.applyFilter();
      },
      error: (err) => console.error('Erreur chargement pharmacies', err)
    });
  }

  filterByStatus(event: any): void {
    this.currentFilter = event.target.value;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.currentFilter === 'ALL') {
      this.filteredPharmacies = this.pharmacies;
    } else {
      this.filteredPharmacies = this.pharmacies.filter(p => p.status === this.currentFilter);
    }
  }

  getStatusClass(status: PharmacyStatus): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getOwnerFullName(pharmacy: Pharmacy): string {
    if (pharmacy.ownerFirstName && pharmacy.ownerLastName) {
      return `${pharmacy.ownerFirstName} ${pharmacy.ownerLastName}`;
    }
    return 'Propriétaire inconnu';
  }

  getStatusLabel(status: PharmacyStatus): string {
    switch (status) {
      case 'APPROVED': return 'Actif';
      case 'PENDING': return 'En Attente';
      case 'REJECTED': return 'Rejeté';
      case 'SUSPENDED': return 'Suspendu';
      default: return status;
    }
  }
}
