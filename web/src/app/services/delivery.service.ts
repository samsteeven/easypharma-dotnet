import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Delivery, DeliveryStatus } from '../models/delivery.model';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryService {
    private apiUrl = '/api/v1/deliveries';

    constructor(private http: HttpClient) { }

    // Get deliveries for a specific pharmacy (Admin view)
    getPharmacyDeliveries(pharmacyId: string): Observable<Delivery[]> {
        return this.http.get<Delivery[]>(`${this.apiUrl}/pharmacy/${pharmacyId}`);
    }

    // Get available deliveries (Ready orders waiting for courier)
    getAvailableDeliveries(pharmacyId: string): Observable<any[]> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/available?pharmacyId=${pharmacyId}`)
            .pipe(
                map(response => response.data || [])
            );
    }

    // Get deliveries assigned to the current user (Courier view)
    getMyDeliveries(): Observable<Delivery[]> {
        return this.http.get<ApiResponse<Delivery[]>>(`${this.apiUrl}/my-deliveries`)
            .pipe(
                map(response => response.data || [])
            );
    }

    // Assign a delivery to the current user
    acceptDelivery(deliveryId: string): Observable<Delivery> {
        return this.http.post<ApiResponse<Delivery>>(`${this.apiUrl}/${deliveryId}/accept`, {})
            .pipe(
                map(response => response.data)
            );
    }

    // Update delivery status
    updateStatus(id: string, status: DeliveryStatus): Observable<Delivery> {
        return this.http.patch<ApiResponse<Delivery>>(`${this.apiUrl}/${id}/status?status=${status}`, {})
            .pipe(
                map(response => response.data)
            );
    }
}
