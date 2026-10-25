import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

export interface OrderItemRequest {
    medicationId: string;
    quantity: number;
}

export interface CreateOrderRequest {
    pharmacyId: string; // Grouping by pharmacy is usually required or one order per pharmacy
    items: OrderItemRequest[];
    deliveryAddress: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = '/api/v1/orders';

    constructor(private http: HttpClient) { }

    /**
     * Create a new order
     * POST /api/v1/orders
     */
    createOrder(order: CreateOrderRequest): Observable<Order> {
        return this.http.post<Order>(this.apiUrl, order);
    }

    /**
     * Get current user's orders
     * GET /api/v1/orders/me
     */
    getMyOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(`${this.apiUrl}/me`);
    }

    /**
     * Get orders for a specific pharmacy
     * GET /api/v1/orders/pharmacy-orders/{pharmacyId}
     */
    getPharmacyOrders(pharmacyId: string): Observable<Order[]> {
        return this.http.get<Order[]>(`${this.apiUrl}/pharmacy-orders/${pharmacyId}`);
    }

    /**
     * Update order status
     * PATCH /api/v1/orders/{orderId}/status
     */
    updateStatus(orderId: string, status: string): Observable<Order> {
        return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status });
    }
}
