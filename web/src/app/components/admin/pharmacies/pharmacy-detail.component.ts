import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PharmacyService } from '../../../services/pharmacy.service';
import { AdminService } from '../../../services/admin.service';
import { Pharmacy, PharmacyStatus } from '../../../models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6" *ngIf="pharmacy; else loading">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ pharmacy.name }}</h1>
          <div class="mt-1 flex items-center space-x-2">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  [ngClass]="getStatusClass(pharmacy.status)">
              {{ getStatusLabel(pharmacy.status) }}
            </span>
            <span class="text-sm text-gray-500">Inscrit le {{ pharmacy.createdAt | date:'mediumDate' }}</span>
          </div>
        </div>
        <div class="flex gap-3">
          <!-- Approval Actions -->
          <button *ngIf="pharmacy.status === 'PENDING'" (click)="updateStatus('APPROVED')"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <i class="fas fa-check mr-2"></i> Approuver
          </button>
          
          <button *ngIf="pharmacy.status === 'PENDING'" (click)="updateStatus('REJECTED')"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <i class="fas fa-times mr-2"></i> Rejeter
          </button>

          <button *ngIf="pharmacy.status === 'APPROVED'" (click)="updateStatus('SUSPENDED')"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            <i class="fas fa-ban mr-2"></i> Suspendre
          </button>

          <button *ngIf="pharmacy.status === 'SUSPENDED'" (click)="updateStatus('APPROVED')"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <i class="fas fa-check mr-2"></i> Réactiver
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Info Card -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Informations Légales</h3>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Propriétaire</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ getOwnerFullName() }}</dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Numéro de Licence</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ pharmacy.licenseNumber || 'Non renseigné' }}</dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Document de Licence</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a *ngIf="pharmacy.licenseDocumentUrl; else noDoc" [href]="pharmacy.licenseDocumentUrl" target="_blank" class="text-blue-600 hover:text-blue-500">
                    <i class="fas fa-file-pdf mr-1"></i> Voir le document
                  </a>
                  <ng-template #noDoc>
                    <span class="text-gray-400 italic">Aucun document joint</span>
                  </ng-template>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Contact Card -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Coordonnées</h3>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Adresse</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ pharmacy.address }}</dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Ville</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ pharmacy.city }}</dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ pharmacy.phone }}</dd>
              </div>
              <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ pharmacy.ownerEmail || 'Non renseigné' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>


      <!-- Reviews Section (Feature 8.3) -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Avis & Modération</h3>
        </div>
        <ul class="divide-y divide-gray-200">
          <li *ngFor="let review of reviews" class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ review.reviewerName || 'Anonyme' }}</p>
                <div class="flex items-center mt-1">
                  <!-- Star Rating Mockup -->
                  <span class="text-yellow-400 text-sm">
                    <i class="fas fa-star" *ngFor="let i of [1,2,3,4,5]" [ngClass]="{'text-gray-300': i > review.rating}"></i>
                  </span>
                  <span class="ml-2 text-sm text-gray-500">{{ review.createdAt | date:'mediumDate' }}</span>
                </div>
                <p class="mt-2 text-sm text-gray-600">{{ review.comment }}</p>
              </div>
              <div class="flex items-center space-x-2">
                 <span [ngClass]="getReviewStatusClass(review.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                   {{ review.status }}
                 </span>
                 <button *ngIf="review.status === 'PENDING'" (click)="moderateReview(review.id, 'APPROVED')" 
                         class="text-green-600 hover:text-green-900 p-1" title="Approuver">
                   <i class="fas fa-check-circle text-xl"></i>
                 </button>
                 <button *ngIf="review.status === 'PENDING'" (click)="moderateReview(review.id, 'REJECTED')" 
                         class="text-red-600 hover:text-red-900 p-1" title="Rejeter">
                   <i class="fas fa-times-circle text-xl"></i>
                 </button>
              </div>
            </div>
          </li>
          <li *ngIf="reviews.length === 0" class="px-4 py-8 text-center text-gray-500">
            Aucun avis pour cette pharmacie.
          </li>
        </ul>
      </div>

    </div>

    <ng-template #loading>
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </ng-template>
  `
})
export class PharmacyDetailComponent implements OnInit {
  pharmacy: Pharmacy | null = null;
  reviews: any[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private pharmacyService: PharmacyService,
    private adminService: AdminService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPharmacy(id);
      this.loadReviews(id);
    }
  }

  loadPharmacy(id: string): void {
    this.isLoading = true;
    this.pharmacyService.getById(id).subscribe({
      next: (data) => {
        this.pharmacy = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.isLoading = false;
        // Gérer 404
      }
    });
  }

  loadReviews(id: string): void {
    this.adminService.getPharmacyReviews(id).subscribe({
      next: (data) => this.reviews = data,
      error: (err) => console.error('Error loading reviews', err)
    });
  }

  moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED'): void {
    if (!confirm(`Confirmer l'action : ${status} ?`)) return;

    this.adminService.moderateReview(reviewId, status).subscribe({
      next: () => {
        // Optimistic update
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) review.status = status;
        alert('Avis modéré avec succès.');
      },
      error: (err) => alert('Erreur lors de la modération')
    });
  }

  getReviewStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getOwnerFullName(): string {
    if (!this.pharmacy) return 'Propriétaire inconnu';
    if (this.pharmacy.ownerFirstName && this.pharmacy.ownerLastName) {
      return `${this.pharmacy.ownerFirstName} ${this.pharmacy.ownerLastName}`;
    }
    return 'Propriétaire inconnu';
  }

  updateStatus(status: PharmacyStatus): void {
    if (!this.pharmacy) return;

    // Pour REJECTED, idéalement ouvrir un modal pour la raison. Pour l'instant simple confirm.
    if (!confirm(`Confirmez-vous le changement de statut vers : ${status} ?`)) return;

    this.pharmacyService.updateStatus(this.pharmacy.id, status).subscribe({
      next: (updatedPharmacy) => {
        this.pharmacy = updatedPharmacy;
        alert('Statut mis à jour avec succès');
      },
      error: (err) => alert('Erreur lors de la mise à jour')
    });
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
