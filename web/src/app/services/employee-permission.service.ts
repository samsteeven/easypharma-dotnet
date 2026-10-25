import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EmployeePermission {
    id?: string;
    employeeId: string;
    canPrepareOrders: boolean;
    canAssignDeliveries: boolean;
    canViewStatistics: boolean;
    canManageInventory: boolean;
    canViewCustomerInfo: boolean;
    canProcessPayments: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeePermissionService {
    private apiUrl = '/api/v1/employees';

    constructor(private http: HttpClient) { }

    /**
     * Get permissions for an employee
     */
    getPermissions(employeeId: string): Observable<EmployeePermission> {
        return this.http.get<ApiResponse<EmployeePermission>>(`${this.apiUrl}/${employeeId}/permissions`)
            .pipe(map(response => response.data));
    }

    /**
     * Update permissions for an employee (Admin only)
     */
    updatePermissions(employeeId: string, permissions: EmployeePermission): Observable<EmployeePermission> {
        return this.http.put<ApiResponse<EmployeePermission>>(`${this.apiUrl}/${employeeId}/permissions`, permissions)
            .pipe(map(response => response.data));
    }

    /**
     * Check if an employee has a specific permission
     */
    checkPermission(employeeId: string, permissionType: string): Observable<boolean> {
        return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/${employeeId}/permissions/check`, {
            params: { permissionType }
        }).pipe(map(response => response.data));
    }

    /**
     * Get statistics for an employee
     */
    getStatistics(employeeId: string): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${employeeId}/statistics`)
            .pipe(map(response => response.data));
    }

    /**
     * Export employee report as CSV
     */
    exportReport(employeeId: string, startDate: string, endDate: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${employeeId}/report`, {
            params: { startDate, endDate },
            responseType: 'blob'
        });
    }
}
