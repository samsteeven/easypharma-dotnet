import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pharmacy, PharmacyMedicationDTO } from '@models';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
    private apiUrl = '/api/v1/pharmacies';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Pharmacy[]> {
        return this.http.get<Pharmacy[]>(this.apiUrl);
    }

    getAllForAdmin(): Observable<Pharmacy[]> {
        return this.http.get<Pharmacy[]>(`${this.apiUrl}/admin/all`);
    }

    create(data: any): Observable<Pharmacy> {
        return this.http.post<Pharmacy>(this.apiUrl, data);
    }

    updateStatus(id: string, status: string): Observable<Pharmacy> {
        return this.http.patch<Pharmacy>(`${this.apiUrl}/${id}/status?status=${status}`, {});
    }

    update(id: string, data: Partial<Pharmacy>): Observable<Pharmacy> {
        return this.http.put<Pharmacy>(`${this.apiUrl}/${id}`, data);
    }

    getById(id: string): Observable<Pharmacy> {
        return this.http.get<Pharmacy>(`${this.apiUrl}/${id}`);
    }

    searchByCity(city: string): Observable<Pharmacy[]> {
        return this.http.get<Pharmacy[]>(`${this.apiUrl}/search/by-city?city=${city}`);
    }

    searchByName(name: string): Observable<Pharmacy[]> {
        return this.http.get<Pharmacy[]>(`${this.apiUrl}/search/by-name?name=${name}`);
    }

    getNearby(latitude: number, longitude: number, radiusKm: number = 5): Observable<Pharmacy[]> {
        return this.http.get<Pharmacy[]>(`${this.apiUrl}/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`);
    }

    getInventory(pharmacyId: string): Observable<PharmacyMedicationDTO[]> {
        return this.http.get<PharmacyMedicationDTO[]>(`${this.apiUrl}/${pharmacyId}/medications`);
    }

    // Employee Management
    getEmployees(pharmacyId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${pharmacyId}/employees`);
    }

    getEmployeesByRole(pharmacyId: string, role: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${pharmacyId}/employees/role/${role}`);
    }

    addEmployee(pharmacyId: string, employeeData: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${pharmacyId}/employees`, employeeData);
    }

    removeEmployee(pharmacyId: string, employeeId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${pharmacyId}/employees/${employeeId}`);
    }

    // Dashboard & Stats
    getDashboardStats(pharmacyId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${pharmacyId}/dashboard/stats`);
    }

    importMedications(pharmacyId: string, csvContent: string): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/${pharmacyId}/medications/import`, csvContent);
    }
}
