import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequestDTO, PaymentReceipt } from '@models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private apiUrl = '/api/v1/payments';

    constructor(private http: HttpClient) { }

    processPayment(payment: PaymentRequestDTO): Observable<PaymentReceipt> {
        return this.http.post<PaymentReceipt>(`${this.apiUrl}/process`, payment);
    }

    downloadReceipt(paymentId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${paymentId}/receipt`, { responseType: 'blob' });
    }

    // Payout Management
    getPayoutsByPharmacy(pharmacyId: string): Observable<any[]> {
        return this.http.get<any[]>(`/api/v1/payouts/pharmacy/${pharmacyId}`);
    }

    createPayout(payoutData: any): Observable<any> {
        return this.http.post<any>(`/api/v1/payouts`, payoutData);
    }
}
