export enum DeliveryStatus {
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    RETURNED = 'RETURNED'
}

export interface Delivery {
    id: string;
    orderId: string;
    pharmacyId: string;
    courierId?: string; // User ID of the delivery person
    courierName?: string;
    deliveryAddress: string;
    customerName?: string;
    customerPhone?: string;
    status: DeliveryStatus;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
