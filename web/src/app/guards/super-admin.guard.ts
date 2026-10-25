import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
        });
    }

    // Check if user is super admin
    if (authService.isSuperAdmin()) {
        return true;
    }

    // Redirect based on user role
    const role = authService.getCurrentRole();

    if (authService.isPharmacyStaff()) {
        return router.createUrlTree(['/pharmacy/dashboard']);
    }

    return router.createUrlTree(['/login']);
};
