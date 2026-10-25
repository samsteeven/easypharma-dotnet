import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faPlus, faArrowLeft, faSearch, faFilter,
    faPrescription, faCapsules, faTimes, faChevronDown,
    faCircleNotch, faPills, faFileUpload, faFileMedical
} from '@fortawesome/free-solid-svg-icons';
import { MedicationCatalogService, CatalogMedication } from '../../services/medication-catalog.service';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-medication-catalog',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './medication-catalog.component.html'
})
export class MedicationCatalogComponent implements OnInit {
    faPlus = faPlus;
    faArrowLeft = faArrowLeft;
    faSearch = faSearch;
    faFilter = faFilter;
    faPrescription = faPrescription;
    faCapsules = faCapsules;
    faTimes = faTimes;
    faChevronDown = faChevronDown;
    faCircleNotch = faCircleNotch;
    faPills = faPills;
    faFileUpload = faFileUpload;
    faFileMedical = faFileMedical;

    medications: CatalogMedication[] = [];
    loading = false;

    // Filters
    searchQuery = '';
    selectedClass = '';
    prescriptionOnly = false;

    // Modal d'ajout à l'inventaire
    showAddModal = false;
    selectedMedication: CatalogMedication | null = null;
    addPrice = 0;
    addStock = 0;
    addExpiryDate = '';
    isAdding = false;

    // Modal de création de médicament
    showCreateModal = false;
    isCreating = false;
    newMedication = {
        name: '',
        genericName: '',
        therapeuticClass: '',
        description: '',
        dosage: '',
        requiresPrescription: false
    };

    pharmacyId = '';

    therapeuticClasses = [
        'ANTALGIQUE',
        'ANTIBIOTIQUE',
        'ANTIPALUDEEN',
        'ANTIHYPERTENSEUR',
        'ANTIINFLAMMATOIRE',
        'ANTIDIABETIQUE',
        'ANTIHISTAMINIQUE',
        'ANTIPYRETIQUE',
        'VITAMINE',
        'AUTRE'
    ];

    constructor(
        private catalogService: MedicationCatalogService,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Get pharmacyId
        const pharmacyId = this.authService.getUserPharmacyId();
        if (!pharmacyId) {
            alert('Aucune pharmacie associée à votre compte');
            this.router.navigate(['/pharmacy-admin/dashboard']);
            return;
        }
        this.pharmacyId = pharmacyId;
        this.loadMedications();
    }

    loadMedications(): void {
        this.loading = true;
        this.catalogService.getAllMedications().subscribe({
            next: (data) => {
                this.medications = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur chargement catalogue', error);
                this.loading = false;
                alert('Erreur lors du chargement du catalogue');
            }
        });
    }

    onSearch(): void {
        if (!this.searchQuery.trim()) {
            this.loadMedications();
            return;
        }

        this.loading = true;
        this.catalogService.searchMedications(this.searchQuery).subscribe({
            next: (data) => {
                this.medications = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur recherche', error);
                this.loading = false;
            }
        });
    }

    onFilter(): void {
        this.loading = true;
        this.catalogService.filterMedications(
            this.searchQuery || undefined,
            this.selectedClass || undefined,
            this.prescriptionOnly ? true : undefined
        ).subscribe({
            next: (data) => {
                this.medications = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur filtrage', error);
                this.loading = false;
            }
        });
    }

    openAddToInventoryModal(medication: CatalogMedication): void {
        this.selectedMedication = medication;
        this.addPrice = 0;
        this.addStock = 0;
        this.showAddModal = true;
    }

    closeModal(): void {
        this.showAddModal = false;
        this.selectedMedication = null;
        this.addPrice = 0;
        this.addStock = 0;
    }

    addToInventory(): void {
        if (!this.selectedMedication || !this.pharmacyId) return;

        if (this.addPrice <= 0 || this.addStock < 0) {
            alert('Veuillez saisir un prix et un stock valides');
            return;
        }

        this.isAdding = true;
        this.inventoryService.addMedication(
            this.pharmacyId,
            this.selectedMedication.id,
            this.addPrice,
            this.addStock,
            this.addExpiryDate
        ).subscribe({
            next: () => {
                alert(`${this.selectedMedication!.name} ajouté à votre inventaire !`);
                this.isAdding = false;
                this.closeModal();
            },
            error: (error) => {
                console.error('Erreur ajout inventaire', error);
                this.isAdding = false;
                alert(error.error?.message || 'Erreur lors de l\'ajout à l\'inventaire');
            }
        });
    }

    openCreateModal(): void {
        this.showCreateModal = true;
        this.newMedication = {
            name: '',
            genericName: '',
            therapeuticClass: '',
            description: '',
            dosage: '',
            requiresPrescription: false
        };
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
    }

    createMedication(): void {
        if (!this.newMedication.name || !this.newMedication.therapeuticClass) {
            alert('Veuillez remplir au minimum le nom et la classe thérapeutique');
            return;
        }

        this.isCreating = true;
        this.catalogService.createMedication(this.newMedication).subscribe({
            next: (createdMed) => {
                alert(`Médicament "${createdMed.name}" créé avec succès !`);
                this.isCreating = false;
                this.closeCreateModal();
                this.loadMedications(); // Refresh catalog
                // Optionally open add to inventory modal
                this.openAddToInventoryModal(createdMed);
            },
            error: (error) => {
                console.error('Erreur création médicament', error);
                this.isCreating = false;
                alert(error.error?.message || 'Erreur lors de la création du médicament');
            }
        });
    }

    goToInventory(): void {
        this.router.navigate(['/pharmacy-admin/inventory']);
    }
}
