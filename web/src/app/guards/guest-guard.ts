import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);

    if (authService.isAuthenticated()) {
        // If user is already logged in, redirect them to their dashboard
        authService.redirectBasedOnRole();
        return false;
    }

    return true;
};
