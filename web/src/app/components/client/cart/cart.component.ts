import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
    cartItems: CartItem[] = [];
    totalPrice: number = 0;

    constructor(
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cartService.cartItems$.subscribe(items => {
            this.cartItems = items;
            this.totalPrice = this.cartService.getTotalPrice();
        });
    }

    updateQuantity(medicationId: string, quantity: number): void {
        this.cartService.updateQuantity(medicationId, quantity);
    }

    removeItem(medicationId: string): void {
        if (confirm('Voulez-vous retirer cet article du panier ?')) {
            this.cartService.removeFromCart(medicationId);
        }
    }

    clearCart(): void {
        if (confirm('Voulez-vous vider votre panier ?')) {
            this.cartService.clearCart();
        }
    }

    proceedToCheckout(): void {
        this.router.navigate(['/checkout']);
    }
}
