import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService, Medication } from '../../../services/inventory.service';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch, faBookMedical, faEdit, faTrash,
  faPlus, faTimes, faChevronDown, faCircleNotch,
  faBoxOpen, faCheckCircle, faExclamationCircle,
  faFlask, faBoxes, faTag, faCalendarAlt, faFileUpload,
  faFileCsv
} from '@fortawesome/free-solid-svg-icons';
import { PharmacyService } from '../../../services/pharmacy.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="page-bg-refined p-8 space-y-8 animate-fadeInUp">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion de l'Inventaire</h1>
          <p class="mt-1 text-slate-500 font-medium">Contrôlez vos stocks, ajustez vos prix et gérez vos produits.</p>
        </div>
        <div class="flex flex-wrap gap-4">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".csv" class="hidden">
          <button type="button" (click)="fileInput.click()" [disabled]="isImporting"
                  class="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 hover:shadow-sm active:scale-95 transition-all duration-200">
            <fa-icon [icon]="isImporting ? faCircleNotch : faFileUpload" [animation]="isImporting ? 'spin' : undefined" class="mr-2 text-emerald-500"></fa-icon> 
            {{ isImporting ? 'Importation...' : 'Import CSV' }}
          </button>
          <a routerLink="/pharmacy-admin/catalog"
             class="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 hover:shadow-sm active:scale-95 transition-all duration-200">
            <fa-icon [icon]="faBookMedical" class="mr-2 text-indigo-500"></fa-icon> Catalogue Global
          </a>
          <button type="button" (click)="openModal()"
                  class="btn-primary shadow-lg shadow-indigo-100">
            <fa-icon [icon]="faEdit" class="mr-2"></fa-icon> Ajuster Stock/Prix
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="auth-card !p-6 flex flex-col md:flex-row items-center gap-6">
        <div class="flex-1 w-full relative group">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
            <fa-icon [icon]="faSearch" class="text-slate-400 group-focus-within:text-indigo-500 text-sm"></fa-icon>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()"
                 class="form-input !pl-11 !py-3"
                 placeholder="Rechercher un médicament par son nom ou fabricant...">
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
             <fa-icon [icon]="faBoxes" class="text-slate-400"></fa-icon>
             <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">{{ medications.length }} Produits</span>
        </div>
      </div>

      <!-- Notifications -->
      <div *ngIf="notification" 
           [ngClass]="{
             'bg-emerald-50 text-emerald-800 border-emerald-100': notification.type === 'success',
             'bg-rose-50 text-rose-800 border-rose-100': notification.type === 'error'
           }" 
           class="flex items-center gap-4 px-6 py-4 rounded-2xl border animate-fadeInUp shadow-sm">
          <div [ngClass]="{
            'icon-container-emerald': notification.type === 'success',
            'icon-container-rose': notification.type === 'error'
          }" class="w-10 h-10 !bg-white/50">
              <fa-icon [icon]="notification.type === 'success' ? faCheckCircle : faExclamationCircle" class="text-lg"></fa-icon>
          </div>
          <p class="text-sm font-bold tracking-tight">{{ notification.message }}</p>
      </div>

      <!-- Inventory Table -->
      <div class="auth-card !p-0 overflow-hidden shadow-xl shadow-slate-200/50">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-100">
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Produit & Labo</th>
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Classe</th>
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Prix de vente</th>
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Niveau de Stock</th>
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Expiration</th>
                <th class="p-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let med of medications" class="hover:bg-slate-50/50 transition-colors group">
                <td class="p-6">
                  <div class="flex items-center gap-4">
                    <div class="icon-container-blue w-11 h-11 shrink-0 rounded-xl">
                      <fa-icon [icon]="faFlask" class="text-sm"></fa-icon>
                    </div>
                    <div>
                      <div class="text-base font-extrabold text-slate-900 leading-tight">{{ med.name }}</div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ med.manufacturer }}</div>
                    </div>
                  </div>
                </td>
                <td class="p-6 text-center">
                  <span class="inline-flex px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
                    {{ med.category || 'Général' }}
                  </span>
                </td>
                <td class="p-6">
                  <div class="text-lg font-black text-indigo-600 tracking-tight">
                    {{ med.price | currency:'XAF':'symbol':'1.0-0' }}
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div [ngClass]="{
                        'bg-emerald-500': med.stock > 10,
                        'bg-amber-500': med.stock <= 10 && med.stock > 0,
                        'bg-rose-500': med.stock === 0
                      }" class="h-full transition-all duration-1000" [style.width.%]="(med.stock / 50) * 100 > 100 ? 100 : (med.stock / 50) * 100"></div>
                    </div>
                    <span [ngClass]="{
                      'text-emerald-600': med.stock > 10,
                      'text-amber-600': med.stock <= 10 && med.stock > 0,
                      'text-rose-600': med.stock === 0
                    }" class="text-[10px] font-black uppercase tracking-widest">
                      {{ med.stock }} en stock
                    </span>
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <fa-icon [icon]="faCalendarAlt" class="text-slate-300 text-xs"></fa-icon>
                    {{ med.expiryDate | date:'mediumDate' }}
                  </div>
                </td>
                <td class="p-6 text-right">
                  <div class="flex justify-end items-center gap-2">
                    <button (click)="editMedication(med)" 
                            class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center">
                      <fa-icon [icon]="faEdit" class="text-sm"></fa-icon>
                    </button>
                    <button (click)="deleteMedication(med)" 
                            class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center">
                      <fa-icon [icon]="faTrash" class="text-sm"></fa-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="medications.length === 0 && !isLoading">
                  <td colspan="6" class="p-20 text-center">
                    <div class="icon-container-blue w-20 h-20 mb-6 mx-auto !bg-slate-50 !text-slate-300">
                        <fa-icon [icon]="faBoxOpen" class="text-3xl"></fa-icon>
                    </div>
                    <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Stock vide</h3>
                    <p class="text-slate-500 font-medium mt-2">Commencez par ajouter des produits depuis le catalogue.</p>
                  </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="p-20 flex flex-col items-center">
             <div class="w-12 h-12 mb-4 animate-spin flex items-center justify-center text-indigo-500">
                <fa-icon [icon]="faCircleNotch" class="text-4xl"></fa-icon>
             </div>
             <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronisation du stock...</p>
        </div>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-[100] overflow-y-auto">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" (click)="closeModal()"></div>

        <div class="flex min-h-screen items-center justify-center p-4">
          <div class="auth-card !p-0 w-full max-w-lg overflow-hidden animate-fadeInUp shadow-2xl">
            <div class="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="icon-container-indigo w-12 h-12">
                  <fa-icon [icon]="faTag" class="text-xl"></fa-icon>
                </div>
                <div>
                  <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Mise à jour Stock</h3>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Édition des paramètres produits</p>
                </div>
              </div>
              <button (click)="closeModal()" class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <fa-icon [icon]="faTimes"></fa-icon>
              </button>
            </div>

            <div class="p-8">
              <form [formGroup]="inventoryForm" (ngSubmit)="onSubmit()" class="space-y-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nom du produit</label>
                  <input type="text" formControlName="name" readonly class="form-input !py-3 font-bold bg-slate-50 cursor-not-allowed" placeholder="Nom du médicament">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Fabricant / Laboratoire</label>
                  <input type="text" formControlName="manufacturer" readonly class="form-input !py-3 font-bold bg-slate-50 cursor-not-allowed" placeholder="Labo">
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Prix (XAF)</label>
                    <input type="number" formControlName="price" class="form-input !py-3 font-black text-indigo-600 text-lg">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Quantité Stock</label>
                    <input type="number" formControlName="stock" class="form-input !py-3 font-black text-lg">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Date d'expiration</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                      <fa-icon [icon]="faCalendarAlt" class="text-slate-400 group-focus-within:text-indigo-500 text-sm"></fa-icon>
                    </div>
                    <input type="date" formControlName="expiryDate" class="form-input !pl-11 !py-3 font-bold">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Description</label>
                  <textarea formControlName="description" rows="3" class="form-input" placeholder="Notes..."></textarea>
                </div>

                <div class="mt-10 flex gap-4 border-t border-slate-100 pt-8">
                  <button type="button" (click)="closeModal()" class="flex-1 px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    Annuler
                  </button>
                  <button type="submit" [disabled]="inventoryForm.invalid || isSaving" 
                          class="flex-[2] btn-primary !py-3.5 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span *ngIf="!isSaving">Enregistrer les modifications</span>
                    <span *ngIf="isSaving" class="flex items-center gap-2">
                      <fa-icon [icon]="faCircleNotch" animation="spin"></fa-icon> En cours...
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryManagementComponent implements OnInit {
  faSearch = faSearch;
  faBookMedical = faBookMedical;
  faEdit = faEdit;
  faTrash = faTrash;
  faPlus = faPlus;
  faTimes = faTimes;
  faChevronDown = faChevronDown;
  faCircleNotch = faCircleNotch;
  faBoxOpen = faBoxOpen;
  faCheckCircle = faCheckCircle;
  faExclamationCircle = faExclamationCircle;
  faFlask = faFlask;
  faBoxes = faBoxes;
  faTag = faTag;
  faCalendarAlt = faCalendarAlt;
  faFileUpload = faFileUpload;
  faFileCsv = faFileCsv;

  medications: Medication[] = [];
  isLoading = false;
  isImporting = false;
  searchTerm = '';
  pharmacyId: string = '';

  showModal = false;
  isEditing = false;
  isSaving = false;
  selectedMedication: Medication | null = null;
  inventoryForm: FormGroup;
  notification: { type: 'success' | 'error', message: string } | null = null;

  constructor(
    private inventoryService: InventoryService,
    private pharmacyService: PharmacyService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.inventoryForm = this.fb.group({
      name: [''],
      manufacturer: [''],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      expiryDate: [''],
      category: ['']
    });
  }

  ngOnInit(): void {
    // Get pharmacyId from current user
    const pharmacyId = this.authService.getUserPharmacyId();
    if (!pharmacyId) {
      this.showNotification('error', 'Aucune pharmacie associée à votre compte');
      return;
    }
    this.pharmacyId = pharmacyId;
    this.loadInventory();
  }

  loadInventory(): void {
    if (!this.pharmacyId) return;

    this.isLoading = true;
    this.inventoryService.getInventory(this.pharmacyId).subscribe({
      next: (medications) => {
        this.medications = medications;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading inventory', err);
        this.isLoading = false;
        this.showNotification('error', 'Erreur lors du chargement de l\'inventaire');
      }
    });
  }

  onSearch(): void {
    this.loadInventory();
  }

  openModal(): void {
    this.isEditing = false;
    this.selectedMedication = null;
    this.inventoryForm.reset({ price: 0, stock: 0 });
    this.showModal = true;
  }

  editMedication(med: Medication): void {
    this.isEditing = true;
    this.selectedMedication = med;
    this.inventoryForm.patchValue({
      name: med.name,
      manufacturer: med.manufacturer,
      description: med.description,
      price: med.price,
      stock: med.stock,
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split('T')[0] : '',
      category: med.category
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.notification = null;
  }

  onSubmit(): void {
    console.log('Submit clicked. Form valid:', this.inventoryForm.valid, 'Form value:', this.inventoryForm.value);

    if (this.inventoryForm.valid) {
      this.isSaving = true;
      const formValue = this.inventoryForm.value;

      if (this.isEditing && this.selectedMedication) {
        console.log('Attempting update for medicationId:', this.selectedMedication.id);
        this.inventoryService.updateMedication(this.pharmacyId, this.selectedMedication.id, formValue).subscribe({
          next: (updatedMed) => {
            this.isSaving = false;
            this.showModal = false;
            this.loadInventory();
            this.showNotification('success', 'Médicament mis à jour avec succès');
          },
          error: (err) => {
            this.isSaving = false;
            this.showNotification('error', 'Erreur lors de la mise à jour');
          }
        });
      } else {
        // For adding new medication, redirect to catalog
        this.showNotification('error', 'Veuillez utiliser le catalogue pour ajouter un médicament');
        this.isSaving = false;
        this.showModal = false;
      }
    }
  }

  deleteMedication(med: Medication): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${med.name} ?`)) {
      this.inventoryService.deleteMedication(this.pharmacyId, med.id).subscribe({
        next: () => {
          this.loadInventory();
          this.showNotification('success', 'Médicament supprimé');
        },
        error: (err) => {
          this.showNotification('error', 'Impossible de supprimer ce médicament');
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.csv')) {
        this.importCsv(file);
      } else {
        this.showNotification('error', 'Veuillez sélectionner un fichier CSV.');
      }
    }
  }

  private importCsv(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csvContent = e.target.result;
      this.isImporting = true;
      this.pharmacyService.importMedications(this.pharmacyId, csvContent).subscribe({
        next: (count) => {
          this.isImporting = false;
          this.showNotification('success', `${count} médicaments importés avec succès.`);
          this.loadInventory();
        },
        error: (err) => {
          this.isImporting = false;
          console.error('Import failed', err);
          this.showNotification('error', 'Échec de l\'importation. Vérifiez le format du fichier.');
        }
      });
    };
    reader.readAsText(file);
  }

  showNotification(type: 'success' | 'error', message: string): void {
    this.notification = { type, message };
    setTimeout(() => this.notification = null, 3000);
  }
}
