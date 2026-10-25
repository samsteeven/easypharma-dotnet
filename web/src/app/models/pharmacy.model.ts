export type PharmacyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Pharmacy {
    id: string;
    userId: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    ownerEmail?: string;
    name: string;
    licenseNumber: string;
    address: string;
    city: string;
    phone: string;
    latitude: number;
    longitude: number;
    description?: string;
    openingHours?: string;
    averageRating?: number;
    ratingCount?: number;
    status: PharmacyStatus;
    licenseDocumentUrl?: string;
    validatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PharmacyMedicationDTO {
    medicationId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    expiryDate?: string;
    imageUrl?: string;
}
