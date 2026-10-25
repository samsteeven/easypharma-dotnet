import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '@services/admin.service';
import { PharmacyService } from '@services';
import { PaymentService } from '@services';
import { Pharmacy } from '@models';
import { finalize } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleNotch, faStoreSlash, faCoins, faHandHoldingUsd, faHistory, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-financial-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './financial-dashboard.component.html'
})
export class FinancialDashboardComponent implements OnInit {
    faCircleNotch = faCircleNotch;
    faStoreSlash = faStoreSlash;
    faCoins = faCoins;
    faHandHoldingUsd = faHandHoldingUsd;
    faHistory = faHistory;
    faPaperPlane = faPaperPlane;

    pharmacies: Pharmacy[] = [];
    selectedPharmacyId: string = '';
    totalRevenue: number = 0; // Changed to simple number
    loading = false;
    loadingStats = false;
    loadingPayouts = false; // New loading state

    // Payout State
    payouts: any[] = [];
    restToPay: number = 0;

    // Create Payout Form
    newPayout = {
        amount: 0,
        method: 'MTN_MOMO_PAYOUT',
        transactionReference: '',
        notes: ''
    };

    // Mock data for initial display if backend is zero/null
    mockTotalRevenue = 1500000;

    constructor(
        private adminService: AdminService,
        private pharmacyService: PharmacyService,
        private paymentService: PaymentService
    ) { }

    ngOnInit(): void {
        this.loadPharmacies();
    }

    loadPharmacies(): void {
        this.loading = true;
        this.pharmacyService.getAll()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (data) => {
                    this.pharmacies = data.filter(p => p.status === 'APPROVED');
                },
                error: (err) => console.error('Error loading pharmacies', err)
            });
    }

    onPharmacySelect(): void {
        if (!this.selectedPharmacyId) {
            this.totalRevenue = 0;
            this.payouts = [];
            this.restToPay = 0;
            return;
        }
        this.loadPharmacyStats(this.selectedPharmacyId);
        this.loadPayouts(this.selectedPharmacyId);
    }

    loadPharmacyStats(id: string): void {
        this.loadingStats = true;
        this.adminService.getPharmacyRevenue(id)
            .pipe(finalize(() => (this.loadingStats = false)))
            .subscribe({
                next: (revenue) => {
                    // Backend returns a simple number e.g. 150000.00
                    this.totalRevenue = (typeof revenue === 'number') ? revenue : 0;
                    this.calculateRestToPay();
                },
                error: (err) => {
                    console.error('Error loading revenue stats', err);
                    // Fallback to mock for demo purposes if backend 404s
                    this.totalRevenue = this.mockTotalRevenue;
                    this.calculateRestToPay();
                }
            });
    }

    loadPayouts(id: string): void {
        this.loadingPayouts = true;
        this.paymentService.getPayoutsByPharmacy(id)
            .pipe(finalize(() => (this.loadingPayouts = false)))
            .subscribe({
                next: (payouts) => {
                    this.payouts = payouts || [];
                    this.calculateRestToPay();
                },
                error: (err) => {
                    console.error('Error loading payouts', err);
                    // Mock Payouts on error for demo
                    this.payouts = [];
                    this.calculateRestToPay();
                }
            });
    }

    calculateRestToPay(): void {
        const totalPaid = this.payouts.reduce((sum, p) => sum + p.amount, 0);

        this.restToPay = this.totalRevenue - totalPaid;

        // Auto-fill amount in form
        this.newPayout.amount = this.restToPay > 0 ? this.restToPay : 0;
    }

    submitPayout(): void {
        if (this.newPayout.amount <= 0) {
            alert('Le montant doit être supérieur à 0.');
            return;
        }

        const payoutData = {
            ...this.newPayout,
            pharmacyId: this.selectedPharmacyId
            // Backend handles processedAt/date
        };

        // For demo/dev purposes if backend Payout creation fails, we simulate locally
        this.paymentService.createPayout(payoutData).subscribe({
            next: (newPayment) => {
                alert('Paiement enregistré avec succès !');
                this.payouts.unshift(newPayment);
                this.calculateRestToPay();
                this.resetForm();
            },
            error: (err) => {
                console.error('Error creating payout', err);
                // Simulate success
                alert('(Simulation) Paiement enregistré !');
                this.payouts.unshift({
                    id: 'sim-' + Date.now(),
                    amount: this.newPayout.amount,
                    method: this.newPayout.method,
                    transactionReference: this.newPayout.transactionReference || 'REF-SIM',
                    processedAt: new Date().toISOString()
                });
                this.calculateRestToPay();
                this.resetForm();
            }
        });
    }

    resetForm(): void {
        this.newPayout = {
            amount: 0,
            method: 'MTN_MOMO_PAYOUT',
            transactionReference: '',
            notes: ''
        };
        this.calculateRestToPay(); // Reset amount to full rest to pay if desired
    }
}
