import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Prescription {
    id: string;
    photoUrl: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    pharmacistComment?: string;
    createdAt: string;
    orderId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PrescriptionService {
    private apiUrl = '/api/v1/prescriptions';

    constructor(private http: HttpClient) { }

    uploadPrescription(file: File): Observable<Prescription> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Prescription>(this.apiUrl, formData);
    }

    getMyPrescriptions(): Observable<Prescription[]> {
        return this.http.get<Prescription[]>(`${this.apiUrl}/my-prescriptions`);
    }
}
