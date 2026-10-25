import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pharmacy } from '@models';

export interface PatientMedicationSearchResult {
    medicationId: string;
    medicationName: string;
    medicationGenericName: string;
    medicationDescription: string;
    medicationPhotoUrl?: string;
    price: number;
    isAvailable: boolean;
    expiryDate?: string;
    pharmacy: Pharmacy;
    distanceKm?: number;
}

export interface CatalogMedication {
    id: string;
    name: string;
    genericName: string;
    therapeuticClass: string;
    description: string;
    dosage: string;
    photoUrl?: string;
    noticePdfUrl?: string;
    requiresPrescription: boolean;
    createdAt: string;
    updatedAt: string;
}

interface BackendResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MedicationCatalogService {
    private apiUrl = '/api/v1/medications';

    constructor(private http: HttpClient) { }

    /**
     * Get all medications from catalog
     */
    /**
     * Get all medications from catalog
     */
    getAllMedications(): Observable<CatalogMedication[]> {
        return this.http.get<any>(this.apiUrl)
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }

    /**
     * Search medications by name or generic name
     */
    searchMedications(query: string): Observable<CatalogMedication[]> {
        const params = new HttpParams().set('query', query);
        return this.http.get<any>(`${this.apiUrl}/search`, { params })
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }

    /**
     * Filter medications with multiple criteria
     */
    filterMedications(
        name?: string,
        therapeuticClass?: string,
        requiresPrescription?: boolean
    ): Observable<CatalogMedication[]> {
        let params = new HttpParams();
        if (name) params = params.set('name', name);
        if (therapeuticClass) params = params.set('therapeuticClass', therapeuticClass);
        if (requiresPrescription !== undefined) {
            params = params.set('requiresPrescription', requiresPrescription.toString());
        }
        return this.http.get<any>(`${this.apiUrl}/filter`, { params })
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }

    /**
     * Get medication by ID
     */
    getMedicationById(id: string): Observable<CatalogMedication> {
        return this.http.get<any>(`${this.apiUrl}/${id}`)
            .pipe(map(response => response.id ? response : response.data));
    }

    /**
     * Create a new medication in the catalog (PHARMACY_ADMIN can create)
     */
    createMedication(medication: Partial<CatalogMedication>): Observable<CatalogMedication> {
        return this.http.post<any>(this.apiUrl, medication)
            .pipe(map(response => response.id ? response : response.data));
    }

    /**
     * Get medications by therapeutic class
     */
    getByTherapeuticClass(therapeuticClass: string): Observable<CatalogMedication[]> {
        return this.http.get<any>(`${this.apiUrl}/by-class/${therapeuticClass}`)
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }

    /**
     * Get medications requiring prescription
     */
    /**
     * Get medications requiring prescription
     */
    getPrescriptionRequired(): Observable<CatalogMedication[]> {
        return this.http.get<any>(`${this.apiUrl}/prescription-required`)
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }

    /**
     * Global Search (Patient Endpoint Wrapper for Admins)
     */
    searchGlobal(params: {
        query?: string,
        therapeuticClass?: string,
        sortBy?: string,
        userLat?: number,
        userLon?: number
    }): Observable<PatientMedicationSearchResult[]> {
        let httpParams = new HttpParams();
        if (params.query) httpParams = httpParams.set('query', params.query);
        if (params.therapeuticClass) httpParams = httpParams.set('therapeuticClass', params.therapeuticClass);
        if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
        if (params.userLat) httpParams = httpParams.set('userLat', params.userLat.toString());
        if (params.userLon) httpParams = httpParams.set('userLon', params.userLon.toString());

        return this.http.get<any>('/api/v1/patient/search', { params: httpParams })
            .pipe(map(response => {
                if (Array.isArray(response)) return response;
                return response.data || [];
            }));
    }
}
