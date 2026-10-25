import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService, CreateOrderRequest, OrderItemRequest } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { PaymentMethod } from '../../../models/payment.model';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
    checkoutForm: FormGroup;
    isSubmitting = false;
    totalPrice = 0;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private cartService: CartService,
        private orderService: OrderService,
        private paymentService: PaymentService,
        private router: Router
    ) {
        this.checkoutForm = this.fb.group({
            address: ['', [Validators.required, Validators.minLength(5)]],
            latitude: [null],
            longitude: [null],
            paymentMethod: ['MOBILE_MONEY', Validators.required],
            phoneNumber: ['', [Validators.required, Validators.pattern(/^6[0-9]{8}$/)]] // Cameroun phone regex
        });
    }

    ngOnInit(): void {
        this.totalPrice = this.cartService.getTotalPrice();
        // Use geolocation if available (Simple implementation)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.checkoutForm.patchValue({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            });
        }
    }

    onSubmit(): void {
        if (this.checkoutForm.invalid) {
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const cartItems = this.cartService['cartItems'].value;
        if (cartItems.length === 0) {
            this.errorMessage = "Votre panier est vide.";
            this.isSubmitting = false;
            return;
        }

        // Group items by Pharmacy
        const itemsByPharmacy = new Map<string, OrderItemRequest[]>();
        cartItems.forEach(item => {
            const pharmId = item.medication.pharmacy.id;
            if (!itemsByPharmacy.has(pharmId)) {
                itemsByPharmacy.set(pharmId, []);
            }
            itemsByPharmacy.get(pharmId)?.push({
                medicationId: item.medication.medicationId,
                quantity: item.quantity
            });
        });

        const orderRequests = Array.from(itemsByPharmacy.entries()).map(([pharmacyId, items]) => {
            const req: CreateOrderRequest = {
                pharmacyId: pharmacyId,
                items: items,
                deliveryAddress: this.checkoutForm.get('address')?.value,
                deliveryLatitude: this.checkoutForm.get('latitude')?.value,
                deliveryLongitude: this.checkoutForm.get('longitude')?.value
            };
            return this.orderService.createOrder(req).toPromise();
        });

        Promise.all(orderRequests)
            .then(orders => {
                const createdOrders = orders.filter(o => o !== undefined) as any[]; // Handle potential undefined if strict

                // If Payment Method is Mobile Money, initiate payment
                const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;

                if (paymentMethod === PaymentMethod.MOBILE_MONEY) {
                    const orderIds = createdOrders.map(o => o.id);
                    const totalAmount = createdOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const phoneNumber = this.checkoutForm.get('phoneNumber')?.value;

                    this.paymentService.processPayment({
                        orderIds: orderIds,
                        amount: totalAmount,
                        method: PaymentMethod.MOBILE_MONEY,
                        phoneNumber: phoneNumber
                    }).subscribe({
                        next: (receipt) => {
                            this.finishCheckout('Commande et paiement réussis !');
                        },
                        error: (err) => {
                            console.error('Payment error', err);
                            // Orders are created but payment failed.
                            // Ideally, redirect to a "Pay Now" page for these orders.
                            this.finishCheckout('Commandes créées, mais le paiement a échoué. Veuillez réessayer depuis vos commandes.');
                        }
                    });
                } else {
                    // Cash on Delivery
                    this.finishCheckout('Commandes créées avec succès ! Paiement à la livraison.');
                }
            })
            .catch(err => {
                console.error('Checkout error', err);
                this.errorMessage = 'Une erreur est survenue lors de la commande.';
                this.isSubmitting = false;
            });
    }

    private finishCheckout(message: string) {
        this.cartService.clearCart();
        alert(message);
        this.router.navigate(['/patient/search']);
        this.isSubmitting = false;
    }
}
