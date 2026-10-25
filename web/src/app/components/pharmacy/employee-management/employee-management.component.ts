import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PharmacyService } from '../../../services/pharmacy.service';
import { AuthService } from '../../../services/auth.service';
import { EmployeePermissionService, EmployeePermission } from '../../../services/employee-permission.service';
import { User, RegisterRequest } from '../../../models/user.model';

@Component({
    selector: 'app-employee-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './employee-management.component.html'
})
export class EmployeeManagementComponent implements OnInit {
    employees: User[] = [];
    isLoading = false;
    isSaving = false;
    errorMessage: string | null = null;

    // Add Modal State
    isAddModalOpen = false;
    addForm: FormGroup;

    // Delete Modal State
    employeeToDelete: User | null = null;
    isDeleteModalOpen = false;

    // Permission Modal State
    isPermissionModalOpen = false;
    selectedEmployee: User | null = null;
    employeePermissions: EmployeePermission | null = null;
    isLoadingPermissions = false;

    constructor(
        private pharmacyService: PharmacyService,
        private authService: AuthService,
        private permissionService: EmployeePermissionService,
        private fb: FormBuilder
    ) {
        this.addForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['PHARMACY_EMPLOYEE', Validators.required],
            phone: ['']
        });
    }

    ngOnInit(): void {
        this.loadEmployees();
    }

    loadEmployees(): void {
        const pharmacyId = this.authService.getUserPharmacyId();
        if (!pharmacyId) {
            this.errorMessage = "Identifiant de pharmacie non trouvé.";
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;

        this.pharmacyService.getEmployees(pharmacyId).subscribe({
            next: (response: any) => {
                // Handle both array and paginated response structure if backend varies
                if (Array.isArray(response)) {
                    this.employees = response;
                } else if (response && Array.isArray(response.content)) {
                    this.employees = response.content;
                } else if (response && response.data && Array.isArray(response.data)) {
                    this.employees = response.data;
                } else {
                    this.employees = [];
                }
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error loading employees', err);
                this.errorMessage = "Impossible de charger la liste des employés.";
                this.isLoading = false;
            }
        });
    }

    // Add Employee Methods
    openAddModal(): void {
        this.isAddModalOpen = true;
        this.addForm.reset({ role: 'PHARMACY_EMPLOYEE' });
    }

    closeAddModal(): void {
        this.isAddModalOpen = false;
        this.addForm.reset();
    }

    onAddEmployee(): void {
        if (this.addForm.valid) {
            this.isSaving = true;
            const pharmacyId = this.authService.getUserPharmacyId();

            if (!pharmacyId) {
                alert("Erreur: Impossible de récupérer l'ID de votre pharmacie.");
                this.isSaving = false;
                return;
            }

            const employeeData = this.addForm.value;

            this.pharmacyService.addEmployee(pharmacyId, employeeData).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.closeAddModal();
                    this.loadEmployees();
                    alert('Employé ajouté avec succès !');
                },
                error: (err: any) => {
                    console.error('Error creating employee', err);
                    this.isSaving = false;
                    alert('Erreur lors de la création de l\'employé. ' + (err?.error?.message || ''));
                }
            });
        }
    }

    // Delete Methods
    confirmDelete(employee: User): void {
        this.employeeToDelete = employee;
        this.isDeleteModalOpen = true;
    }

    cancelDelete(): void {
        this.employeeToDelete = null;
        this.isDeleteModalOpen = false;
    }

    performDelete(): void {
        if (this.employeeToDelete) {
            const pharmacyId = this.authService.getUserPharmacyId();
            if (!pharmacyId) return;

            this.isSaving = true;
            this.pharmacyService.removeEmployee(pharmacyId, this.employeeToDelete.id).subscribe({
                next: () => {
                    this.loadEmployees();
                    this.isSaving = false;
                    this.cancelDelete();
                },
                error: (err: any) => {
                    console.error('Error deleting employee', err);
                    this.isSaving = false;
                    alert("Erreur lors de la suppression.");
                    this.cancelDelete();
                }
            });
        }
    }

    // Permission Management Methods
    openPermissionModal(employee: User): void {
        this.selectedEmployee = employee;
        this.isPermissionModalOpen = true;
        this.isLoadingPermissions = true;

        this.permissionService.getPermissions(employee.id).subscribe({
            next: (permissions) => {
                this.employeePermissions = permissions;
                this.isLoadingPermissions = false;
            },
            error: (err) => {
                console.error('Error loading permissions', err);
                this.isLoadingPermissions = false;
                alert('Erreur lors du chargement des permissions');
            }
        });
    }

    closePermissionModal(): void {
        this.isPermissionModalOpen = false;
        this.selectedEmployee = null;
        this.employeePermissions = null;
    }

    savePermissions(): void {
        if (!this.selectedEmployee || !this.employeePermissions) return;

        this.isSaving = true;
        this.permissionService.updatePermissions(this.selectedEmployee.id, this.employeePermissions).subscribe({
            next: () => {
                this.isSaving = false;
                this.closePermissionModal();
                alert('Permissions mises à jour avec succès !');
            },
            error: (err) => {
                console.error('Error updating permissions', err);
                this.isSaving = false;
                alert('Erreur lors de la mise à jour des permissions');
            }
        });
    }
}
