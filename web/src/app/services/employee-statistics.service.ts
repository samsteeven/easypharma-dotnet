import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeStatistics {
    employeeId: string;
    ordersProcessedToday: number;
    ordersProcessedWeek: number;
    ordersProcessedMonth: number;
    deliveriesAssignedToday: number;
    deliveriesAssignedWeek: number;
    deliveriesAssignedMonth: number;
    averageProcessingTime: number;
}

@Injectable({
    providedIn: 'root'
})
export class EmployeeStatisticsService {
    private apiUrl = '/api/v1/employees';

    constructor(private http: HttpClient) { }

    getStatistics(employeeId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${employeeId}/statistics`);
    }
}
