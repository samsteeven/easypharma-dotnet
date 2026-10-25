import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    constructor(private authService: AuthService) { }

    // ========== SUPER_ADMIN PERMISSIONS ==========
    canManageUsers(): boolean {
        return this.authService.isSuperAdmin();
    }

    canApprovePharmacies(): boolean {
        return this.authService.isSuperAdmin();
    }

    // ========== PHARMACY_ADMIN PERMISSIONS ==========
    canManageInventory(): boolean {
        return this.authService.isPharmacyAdmin();
    }

    canManageEmployees(): boolean {
        return this.authService.isPharmacyAdmin();
    }

    canCreatePharmacy(): boolean {
        return this.authService.isPharmacyAdmin();
    }

    canManagePharmacySettings(): boolean {
        return this.authService.isPharmacyAdmin();
    }

    // ========== PHARMACY STAFF PERMISSIONS (ADMIN + EMPLOYEE) ==========
    canProcessOrders(): boolean {
        return this.authService.isPharmacyStaff();
    }

    canManageDeliveries(): boolean {
        return this.authService.isPharmacyStaff();
    }

    canViewPharmacyDashboard(): boolean {
        return this.authService.isPharmacyStaff();
    }
}
