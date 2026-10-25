import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PharmacyService } from '../../../services/pharmacy.service';
import { Pharmacy } from '../../../models/pharmacy.model';

@Component({
    selector: 'app-pharmacy-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pharmacy-settings.component.html'
})
export class PharmacySettingsComponent implements OnInit {
    settingsForm: FormGroup;
    pharmacyId: string | undefined;
    isLoading = false;
    isSaving = false;
    successMessage = '';
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private pharmacyService: PharmacyService,
        private router: Router
    ) {
        this.settingsForm = this.fb.group({
            name: [{ value: '', disabled: true }], // Read-only
            description: ['', [Validators.maxLength(500)]],
            openingHours: ['', [Validators.required, Validators.maxLength(100)]],
            phone: ['', [Validators.required, Validators.pattern('^[0-9+() -]{8,20}$')]], // More flexible pattern
            address: [{ value: '', disabled: true }], // Read-only
            city: [{ value: '', disabled: true }] // Read-only
        });
    }

    ngOnInit(): void {
        this.pharmacyId = this.authService.getUserPharmacyId();
        if (this.pharmacyId) {
            this.loadPharmacyDetails(this.pharmacyId);
        } else {
            this.errorMessage = 'Impossible de récupérer l\'identifiant de votre pharmacie.';
        }
    }

    loadPharmacyDetails(id: string): void {
        this.isLoading = true;
        this.pharmacyService.getById(id).subscribe({
            next: (pharmacy) => {
                this.settingsForm.patchValue({
                    name: pharmacy.name,
                    description: pharmacy.description || '',
                    openingHours: pharmacy.openingHours || '',
                    phone: pharmacy.phone,
                    address: pharmacy.address,
                    city: pharmacy.city
                });
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading pharmacy details:', err);
                this.errorMessage = 'Erreur lors du chargement des informations de la pharmacie.';
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.settingsForm.invalid || !this.pharmacyId) {
            console.warn('Form invalid or no pharmacy ID', {
                invalid: this.settingsForm.invalid,
                pharmacyId: this.pharmacyId,
                errors: this.settingsForm.errors
            });
            return;
        }

        this.isSaving = true;
        this.successMessage = '';
        this.errorMessage = '';

        const updateData: Partial<Pharmacy> = {
            description: this.settingsForm.get('description')?.value,
            openingHours: this.settingsForm.get('openingHours')?.value,
            phone: this.settingsForm.get('phone')?.value
        };

        console.log('Updating pharmacy with data:', updateData);
        console.log('Pharmacy ID:', this.pharmacyId);

        this.pharmacyService.update(this.pharmacyId, updateData).subscribe({
            next: (updatedPharmacy) => {
                console.log('Pharmacy updated successfully:', updatedPharmacy);
                this.successMessage = 'Paramètres mis à jour avec succès !';
                this.isSaving = false;
                // Optionally update the form with new values/confirm via reload
                this.settingsForm.patchValue(updatedPharmacy);

                // Hide success message after 3 seconds
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (err) => {
                console.error('Error updating pharmacy:', err);
                console.error('Error details:', {
                    status: err.status,
                    message: err.message,
                    error: err.error
                });
                this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la mise à jour.';
                this.isSaving = false;
            }
        });
    }
}
