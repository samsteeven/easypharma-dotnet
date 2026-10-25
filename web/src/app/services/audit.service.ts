import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuditLogResponse, AuditLog } from '../models/audit.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
    private apiUrl = '/api/v1/audit';

    constructor(private http: HttpClient) { }

    /**
     * Get all audit logs (Super Admin only)
     */
    getAllLogs(page: number = 0, size: number = 20): Observable<AuditLogResponse> {
        return this.http.get<ApiResponse<AuditLogResponse>>(`${this.apiUrl}/all`, {
            params: new HttpParams()
                .set('page', page.toString())
                .set('size', size.toString())
        }).pipe(map(response => response.data));
    }

    /**
     * Get audit logs for a specific pharmacy (Pharmacy Admin)
     */
    getPharmacyLogs(pharmacyId: string, page: number = 0, size: number = 20): Observable<AuditLogResponse> {
        return this.http.get<ApiResponse<AuditLogResponse>>(`${this.apiUrl}/pharmacy/${pharmacyId}`, {
            params: new HttpParams()
                .set('page', page.toString())
                .set('size', size.toString())
        }).pipe(map(response => response.data));
    }

    /**
     * Get audit logs for a specific user
     */
    getUserLogs(userId: string, page: number = 0, size: number = 20): Observable<AuditLogResponse> {
        return this.http.get<ApiResponse<AuditLogResponse>>(`${this.apiUrl}/user/${userId}`, {
            params: new HttpParams()
                .set('page', page.toString())
                .set('size', size.toString())
        }).pipe(map(response => response.data));
    }

    /**
     * Get audit logs by action type
     */
    getLogsByAction(action: string, page: number = 0, size: number = 20): Observable<AuditLogResponse> {
        return this.http.get<ApiResponse<AuditLogResponse>>(`${this.apiUrl}/action/${action}`, {
            params: new HttpParams()
                .set('page', page.toString())
                .set('size', size.toString())
        }).pipe(map(response => response.data));
    }

    /**
     * Get audit logs for a pharmacy within a date range
     */
    getPharmacyLogsByDateRange(pharmacyId: string, startDate: string, endDate: string, page: number = 0, size: number = 20): Observable<AuditLogResponse> {
        return this.http.get<ApiResponse<AuditLogResponse>>(`${this.apiUrl}/pharmacy/${pharmacyId}/date-range`, {
            params: new HttpParams()
                .set('startDate', startDate)
                .set('endDate', endDate)
                .set('page', page.toString())
                .set('size', size.toString())
        }).pipe(map(response => response.data));
    }
}
