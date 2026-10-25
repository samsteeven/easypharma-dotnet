import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Delivery {
    id: string;
    orderId: string;
    courierId: string;
    status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    assignedAt: string;
    deliveredAt?: string;
    proofPhotoUrl?: string;
    currentLatitude?: number;
    currentLongitude?: number;
}

export interface Courier {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
    // Add other relevant fields
}

@Injectable({
    providedIn: 'root'
})
export class DeliveryAssignmentService {
    private apiUrl = '/api/v1/deliveries';

    constructor(private http: HttpClient) { }

    /**
     * Assign a delivery to a courier
     * POST /api/v1/deliveries/assign?orderId={orderId}&courierId={courierId}
     */
    assignDelivery(orderId: string, courierId: string): Observable<Delivery> {
        const params = new HttpParams()
            .set('orderId', orderId)
            .set('courierId', courierId);

        return this.http.post<Delivery>(`${this.apiUrl}/assign`, null, { params });
    }

    /**
     * Get available couriers (employees with DELIVERY role)
     * This might use PharmacyService.getEmployeesByRole or a dedicated endpoint
     */
    getAvailableCouriers(pharmacyId: string): Observable<Courier[]> {
        // Using pharmacy service endpoint to get delivery employees
        return this.http.get<Courier[]>(`/api/v1/pharmacies/${pharmacyId}/employees/role/DELIVERY`);
    }
}
