import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PatientMedicationSearchResult } from './medication-catalog.service';

export interface CartItem {
    medication: PatientMedicationSearchResult;
    quantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = new BehaviorSubject<CartItem[]>([]);
    cartItems$ = this.cartItems.asObservable();

    constructor() {
        // Load from local storage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cartItems.next(JSON.parse(savedCart));
        }
    }

    addToCart(medication: PatientMedicationSearchResult, quantity: number = 1): void {
        const currentItems = this.cartItems.value;
        const existingItem = currentItems.find(item => item.medication.medicationId === medication.medicationId);

        if (existingItem) {
            existingItem.quantity += quantity;
            this.cartItems.next([...currentItems]);
        } else {
            this.cartItems.next([...currentItems, { medication, quantity }]);
        }
        this.saveToStorage();
    }

    removeFromCart(medicationId: string): void {
        const currentItems = this.cartItems.value.filter(item => item.medication.medicationId !== medicationId);
        this.cartItems.next(currentItems);
        this.saveToStorage();
    }

    updateQuantity(medicationId: string, quantity: number): void {
        const currentItems = this.cartItems.value;
        const item = currentItems.find(i => i.medication.medicationId === medicationId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeFromCart(medicationId);
            } else {
                this.cartItems.next([...currentItems]);
                this.saveToStorage();
            }
        }
    }

    clearCart(): void {
        this.cartItems.next([]);
        this.saveToStorage();
    }

    getTotalPrice(): number {
        return this.cartItems.value.reduce((total, item) => total + (item.medication.price * item.quantity), 0);
    }

    private saveToStorage(): void {
        localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
    }
}
