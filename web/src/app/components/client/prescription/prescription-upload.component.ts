import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService, FileValidationResult } from '../../../services/file-upload.service';
import { PrescriptionService, Prescription } from '../../../services/prescription.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-prescription-upload',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Envoyer une ordonnance</h2>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Photo de l'ordonnance</label>
        
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
             [ngClass]="{'border-red-500': errorMessage, 'border-green-500': selectedFile}">
          
          <input type="file" id="file" (change)="onFileSelected($event)" class="hidden" accept="image/*,.pdf">
          <label for="file" class="cursor-pointer">
            <div *ngIf="!selectedFile">
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-500">Cliquez pour sélectionner un fichier</p>
              <p class="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 5MB)</p>
            </div>
            
            <div *ngIf="selectedFile">
              <i class="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
              <p class="text-green-600 font-medium">{{ selectedFile.name }}</p>
              <p class="text-xs text-gray-400 mt-1">Cliquez pour changer</p>
            </div>
          </label>
        </div>

        <p *ngIf="errorMessage" class="mt-2 text-sm text-red-600">
          <i class="fas fa-exclamation-circle mr-1"></i> {{ errorMessage }}
        </p>
      </div>

      <button (click)="upload()" 
              [disabled]="!selectedFile || isUploading"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center">
        <span *ngIf="isUploading">
          <i class="fas fa-spinner fa-spin mr-2"></i> Envoi en cours...
        </span>
        <span *ngIf="!isUploading">Envoyer l'ordonnance</span>
      </button>

      <!-- History Section -->
      <div class="mt-10 border-t pt-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-700">Historique récent</h3>
        <div *ngIf="recentPrescriptions.length === 0" class="text-gray-500 text-sm italic">
          Aucune ordonnance envoyée.
        </div>
        <div class="space-y-3">
          <div *ngFor="let p of recentPrescriptions" class="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div>
              <p class="text-sm font-medium text-gray-800">Ordonnance du {{ p.createdAt | date:'shortDate' }}</p>
              <p class="text-xs" [ngClass]="{
                'text-yellow-600': p.status === 'PENDING',
                'text-green-600': p.status === 'APPROVED',
                'text-red-600': p.status === 'REJECTED'
              }">{{ p.status }}</p>
            </div>
            <a [href]="p.photoUrl" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
              <i class="fas fa-external-link-alt"></i> Voir
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrescriptionUploadComponent {
    selectedFile: File | null = null;
    errorMessage: string | null = null;
    isUploading = false;
    recentPrescriptions: Prescription[] = [];

    constructor(
        private fileUploadService: FileUploadService,
        private prescriptionService: PrescriptionService,
        private router: Router
    ) {
        this.loadHistory();
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const validation: FileValidationResult = this.fileUploadService.validateFile(file);
            if (!validation.valid) {
                this.errorMessage = validation.error || 'Fichier invalide';
                this.selectedFile = null;
                event.target.value = ''; // Reset input
                return;
            }
            this.errorMessage = null;
            this.selectedFile = file;
        }
    }

    upload() {
        if (!this.selectedFile) return;

        this.isUploading = true;
        this.prescriptionService.uploadPrescription(this.selectedFile).subscribe({
            next: (prescription) => {
                this.isUploading = false;
                this.selectedFile = null;
                this.loadHistory(); // Refresh list
                // Could also navigate or show success toast
            },
            error: (err) => {
                this.isUploading = false;
                this.errorMessage = "Échec de l'envoi. Veuillez réessayer.";
                console.error(err);
            }
        });
    }

    loadHistory() {
        this.prescriptionService.getMyPrescriptions().subscribe({
            next: (data) => this.recentPrescriptions = data,
            error: (err) => console.error("Could not load history", err)
        });
    }
}
