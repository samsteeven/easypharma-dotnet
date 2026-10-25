import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EmployeePermissionService } from '../services/employee-permission.service';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard to check if user has specific permission
 * Usage: canActivate: [permissionGuard('PREPARE_ORDERS')]
 */
export function permissionGuard(requiredPermission: string): CanActivateFn {
    return (route, state) => {
        const permissionService = inject(EmployeePermissionService);
        const authService = inject(AuthService);
        const router = inject(Router);

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            router.navigate(['/login']);
            return false;
        }

        // Admins have all permissions
        if (currentUser.role === 'PHARMACY_ADMIN' || currentUser.role === 'SUPER_ADMIN') {
            return true;
        }

        // Check employee permission
        return permissionService.checkPermission(currentUser.id, requiredPermission).pipe(
            map(hasPermission => {
                if (!hasPermission) {
                    router.navigate(['/pharmacy/dashboard']);
                    return false;
                }
                return true;
            }),
            catchError(() => {
                router.navigate(['/pharmacy/dashboard']);
                return of(false);
            })
        );
    };
}
