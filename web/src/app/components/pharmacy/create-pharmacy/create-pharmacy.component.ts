import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PharmacyService } from '../../../services/pharmacy.service';
import { AuthService } from '../../../services/auth.service';
import { FileUploadService } from '../../../services/file-upload.service';

@Component({
  selector: 'app-create-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center text-green-600">
          <i class="fas fa-plus-circle text-5xl"></i>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Enregistrez votre Pharmacie
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Dernière étape avant d'accéder à votre tableau de bord.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="pharmacyForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Nom de la pharmacie -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Nom de la pharmacie</label>
              <div class="mt-1">
                <input id="name" type="text" formControlName="name"
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
              <p *ngIf="pharmacyForm.get('name')?.touched && pharmacyForm.get('name')?.invalid" class="mt-1 text-sm text-red-600">
                Le nom est requis.
              </p>
            </div>

            <!-- Adresse -->
            <div>
              <label for="address" class="block text-sm font-medium text-gray-700">Adresse complète</label>
              <div class="mt-1">
                <input id="address" type="text" formControlName="address"
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>

            <!-- Ville -->
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700">Ville</label>
              <div class="mt-1">
                <input id="city" type="text" formControlName="city"
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>

            <!-- Téléphone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Téléphone</label>
              <div class="mt-1">
                <input id="phone" type="tel" formControlName="phone"
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>

            <!-- Licence Number -->
            <div>
              <label for="licenseNumber" class="block text-sm font-medium text-gray-700">Numéro de Licence / Agrément</label>
              <div class="mt-1">
                <input id="licenseNumber" type="text" formControlName="licenseNumber"
                       class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              </div>
            </div>

            <!-- Licence Document Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Document de Licence (PDF/Image)</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md" 
                   [ngClass]="{'border-green-500 bg-green-50': licenseFile}">
                <div class="space-y-1 text-center">
                  
                  <div *ngIf="!licenseFile">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-gray-600 justify-center">
                      <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                        <span>Sélectionner un fichier</span>
                        <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".pdf,image/*">
                      </label>
                    </div>
                    <p class="text-xs text-gray-500">PNG, JPG, PDF jusqu'à 5MB</p>
                  </div>

                  <div *ngIf="licenseFile" class="text-green-600">
                    <i class="fas fa-file-alt text-3xl"></i>
                    <p class="mt-2 text-sm font-medium">{{ licenseFile.name }}</p>
                    <button type="button" (click)="licenseFile = null" class="text-xs text-red-500 hover:underline mt-1">Supprimer</button>
                  </div>

                </div>
              </div>
              <p *ngIf="!licenseFile && pharmacyForm.touched" class="mt-1 text-sm text-red-600">
                Le document de licence est interne.
              </p>
            </div>

            <!-- Submit Button -->
            <div>
              <button type="submit" [disabled]="pharmacyForm.invalid || isLoading"
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                <span *ngIf="isLoading"><i class="fas fa-spinner fa-spin mr-2"></i> Création...</span>
                <span *ngIf="!isLoading">Enregistrer la pharmacie</span>
              </button>
            </div>

            <div *ngIf="errorMessage" class="rounded-md bg-red-50 p-4 mt-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">{{ errorMessage }}</h3>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  `
})
export class CreatePharmacyComponent implements OnInit {
  licenseFile: File | null = null;
  pharmacyForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private pharmacyService: PharmacyService,
    private authService: AuthService,
    private router: Router,
    private fileUploadService: FileUploadService
  ) {
    this.pharmacyForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      latitude: [0],
      longitude: [0]
    });
  }

  ngOnInit(): void {
    // Prevent duplicate pharmacy creation
    if (this.authService.hasPharmacy()) {
      this.router.navigate(['/pharmacy-admin/dashboard']);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const validation = this.fileUploadService.validateFile(file);
      if (!validation.valid) {
        this.errorMessage = validation.error || 'Fichier invalide';
        this.licenseFile = null;
        // Reset input
        event.target.value = '';
        return;
      }
      this.errorMessage = null;
      this.licenseFile = file;
    }
  }

  onSubmit(): void {
    if (this.pharmacyForm.valid && this.licenseFile) {
      this.isLoading = true;
      this.errorMessage = null;

      const formData = new FormData();

      // 1. Ajouter le JSON en tant que Blob stringifié (backend requirement)
      formData.append('pharmacy', new Blob([JSON.stringify(this.pharmacyForm.value)], { type: 'application/json' }));

      // 2. Ajouter le fichier avec la clé exacte 'licenseDocument'
      formData.append('licenseDocument', this.licenseFile);

      this.pharmacyService.create(formData).subscribe({
        next: (pharmacy) => {
          this.isLoading = false;
          this.authService.getProfile().subscribe({
            next: () => this.router.navigate(['/pharmacy/dashboard']),
            error: () => this.router.navigate(['/pharmacy/dashboard'])
          });
        },
        error: (err) => {
          console.error('Erreur création pharmacie', err);
          this.isLoading = false;
          this.errorMessage = "Une erreur est survenue lors de la création.";
        }
      });
    } else {
      this.pharmacyForm.markAllAsTouched();
      if (!this.licenseFile) {
        this.errorMessage = "Le document de licence est requis.";
      }
    }
  }
}
