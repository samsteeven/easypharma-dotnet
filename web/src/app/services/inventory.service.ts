import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Medication {
    id: string;
    name: string;
    description: string;
    manufacturer: string;
    price: number;
    stock: number;
    expiryDate: string;
    imageUrl?: string;
    category?: string;
}

export interface PharmacyMedication {
    id: string;
    medication: {
        id: string;
        name: string;
        description: string;
        category: string;
        requiresPrescription: boolean;
    };
    price: number;
    stockQuantity: number;
    isAvailable: boolean;
    expiryDate?: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private apiUrl = '/api/v1/pharmacies';

    constructor(private http: HttpClient) { }

    /**
     * Get inventory for a specific pharmacy
     */
    getInventory(pharmacyId: string): Observable<Medication[]> {
        return this.http.get<PharmacyMedication[]>(`${this.apiUrl}/${pharmacyId}/medications`)
            .pipe(
                map(pharmacyMeds => pharmacyMeds.map(pm => ({
                    id: pm.medication.id,
                    name: pm.medication.name,
                    description: pm.medication.description,
                    manufacturer: '', // Not provided by backend
                    price: pm.price,
                    stock: pm.stockQuantity,
                    expiryDate: pm.expiryDate || '',
                    category: pm.medication.category,
                    imageUrl: undefined
                })))
            );
    }

    /**
     * Add medication to pharmacy inventory
     * POST /api/v1/pharmacies/{pharmacyId}/medications?medicationId={medicationId}&price={price}&stock={stock}
     */
    addMedication(pharmacyId: string, medicationId: string, price: number, stock: number, expiryDate?: string): Observable<PharmacyMedication> {
        let params = new HttpParams()
            .set('medicationId', medicationId)
            .set('price', price.toString())
            .set('stock', stock.toString());

        if (expiryDate) {
            params = params.set('expiryDate', expiryDate);
        }

        return this.http.post<PharmacyMedication>(
            `${this.apiUrl}/${pharmacyId}/medications`,
            null,
            { params }
        );
    }

    /**
     * Update medication stock
     * PATCH /api/v1/pharmacies/{pharmacyId}/medications/{medicationId}/stock?quantity={quantity}
     */
    updateStock(pharmacyId: string, medicationId: string, quantity: number): Observable<PharmacyMedication> {
        const params = new HttpParams().set('quantity', quantity.toString());
        return this.http.patch<PharmacyMedication>(
            `${this.apiUrl}/${pharmacyId}/medications/${medicationId}/stock`,
            null,
            { params }
        );
    }

    /**
     * Update medication price
     * PATCH /api/v1/pharmacies/{pharmacyId}/medications/{medicationId}/price?price={price}
     */
    updatePrice(pharmacyId: string, medicationId: string, price: number): Observable<PharmacyMedication> {
        const params = new HttpParams().set('price', price.toString());
        return this.http.patch<PharmacyMedication>(
            `${this.apiUrl}/${pharmacyId}/medications/${medicationId}/price`,
            null,
            { params }
        );
    }

    /**
     * Update medication expiry date
     * PATCH /api/v1/pharmacies/{pharmacyId}/medications/{medicationId}/expiry?expiryDate={expiryDate}
     */
    updateExpiryDate(pharmacyId: string, medicationId: string, expiryDate: string): Observable<PharmacyMedication> {
        const params = new HttpParams().set('expiryDate', expiryDate);
        return this.http.patch<PharmacyMedication>(
            `${this.apiUrl}/${pharmacyId}/medications/${medicationId}/expiry`,
            null,
            { params }
        );
    }

    /**
     * Update full medication (for compatibility with existing component)
     */
    updateMedication(pharmacyId: string, medicationId: string, medication: Partial<Medication>): Observable<Medication> {
        const updates: Observable<any>[] = [];

        if (medication.stock !== undefined) {
            updates.push(this.updateStock(pharmacyId, medicationId, medication.stock));
        }

        if (medication.price !== undefined) {
            updates.push(this.updatePrice(pharmacyId, medicationId, medication.price));
        }

        if (medication.expiryDate !== undefined) {
            updates.push(this.updateExpiryDate(pharmacyId, medicationId, medication.expiryDate));
        }

        if (updates.length === 0) {
            return this.getInventory(pharmacyId).pipe(
                map(meds => meds.find(m => m.id === medicationId)!)
            );
        }

        return forkJoin(updates).pipe(
            map(results => {
                // Return the last result mapped to Medication
                const lastResult = results[results.length - 1] as PharmacyMedication;
                return this.mapToMedication(lastResult);
            })
        );
    }

    /**
     * Delete medication from pharmacy inventory
     * DELETE /api/v1/pharmacies/{pharmacyId}/medications/{medicationId}
     */
    deleteMedication(pharmacyId: string, medicationId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${pharmacyId}/medications/${medicationId}`);
    }

    /**
     * Upload medication image (if supported by backend)
     */
    uploadMedicationImage(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>('/api/v1/files/upload', formData);
    }

    /**
     * Helper to map PharmacyMedication to Medication
     */
    private mapToMedication(pm: PharmacyMedication): Medication {
        return {
            id: pm.medication.id,
            name: pm.medication.name,
            description: pm.medication.description,
            manufacturer: '',
            price: pm.price,
            stock: pm.stockQuantity,
            expiryDate: pm.expiryDate || '',
            category: pm.medication.category,
            imageUrl: undefined
        };
    }
}
