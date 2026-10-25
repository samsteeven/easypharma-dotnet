export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERING = 'DELIVERING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export interface OrderItem {
    medicationId: string;
    medicationName?: string;
    quantity: number;
    price?: number; // Price at time of order
}

export interface CreateOrderDTO {
    pharmacyId: string;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPhone: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    notes?: string;
}

export interface Order {
    id: string;
    pharmacyId: string;
    patientId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    deliveryAddress: string;
    createdAt: Date;
    updatedAt: Date;
}
