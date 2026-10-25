import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { PharmacyService } from './pharmacy.service';

@Injectable({ providedIn: 'root' })
export class AdminService {

    constructor(
        private userService: UserService,
        private pharmacyService: PharmacyService,
        private http: HttpClient
    ) { }

    getDashboardStats(): Observable<any> {
        return forkJoin({
            usersData: this.userService.getAllUsers(0, 1), // Get page 0, size 1 just to read 'totalElements'
            pharmacies: this.pharmacyService.getAll()
        }).pipe(
            map(({ usersData, pharmacies }) => {
                return {
                    totalUsers: usersData.totalElements,
                    totalPharmacies: pharmacies.filter(p => p.status === 'APPROVED').length,
                    pendingPharmacies: pharmacies.filter(p => p.status === 'PENDING').length
                };
            })
        );
    }

    getPharmacyRevenue(pharmacyId: string): Observable<any> {
        return this.http.get<any>(`/api/v1/orders/pharmacy-stats/${pharmacyId}`);
    }

    // Feature 8.1: Global Stats
    getGlobalStats(): Observable<any> {
        return this.http.get<any>(`/api/v1/admin/dashboard/stats`);
    }

    // Feature 8.2: Analytics
    getTopSoldMedications(): Observable<any[]> {
        return this.http.get<any[]>(`/api/v1/admin/dashboard/top-medications/sold`);
    }

    getTopSearchTrends(): Observable<any[]> {
        return this.http.get<any[]>(`/api/v1/admin/dashboard/top-medications/searched`);
    }

    // Feature 8.3: Review Moderation
    getPharmacyReviews(pharmacyId: string): Observable<any[]> {
        return this.http.get<any[]>(`/api/v1/reviews/pharmacy/${pharmacyId}`);
    }

    moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED'): Observable<any> {
        return this.http.patch<any>(`/api/v1/reviews/${reviewId}/status?status=${status}`, {});
    }

    exportGlobalReport(): Observable<Blob> {
        return this.http.get(`/api/v1/admin/dashboard/report`, {
            responseType: 'blob'
        });
    }
}
