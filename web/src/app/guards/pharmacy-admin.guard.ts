import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const pharmacyAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
        });
    }

    // Check if user is pharmacy admin
    if (authService.isPharmacyAdmin()) {
        return true;
    }

    // Redirect based on user role
    if (authService.isSuperAdmin()) {
        return router.createUrlTree(['/admin/dashboard']);
    } else if (authService.isPharmacyEmployee()) {
        return router.createUrlTree(['/pharmacy/dashboard']);
    }

    return router.createUrlTree(['/login']);
};
