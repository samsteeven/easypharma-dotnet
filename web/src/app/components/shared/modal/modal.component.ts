import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto" [attr.aria-labelledby]="title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" (click)="onClose()"></div>

        <!-- Modal container -->
        <div class="flex min-h-full items-center justify-center p-4 text-center">
            <div [class]="'relative w-full transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100 ' + sizeClass">
                
                <!-- Header -->
                <div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                    <div class="flex items-center gap-3">
                        <div *ngIf="icon" [class]="'flex items-center justify-center h-10 w-10 rounded-full ' + iconBgClass">
                            <i [class]="'fas ' + icon + ' ' + iconColorClass"></i>
                        </div>
                        <h3 class="text-xl font-semibold leading-6 text-gray-900">{{ title }}</h3>
                    </div>
                    <button type="button" (click)="onClose()" class="text-gray-400 hover:text-gray-500 transition-colors">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>

                <!-- Content -->
                <div class="px-6 py-6">
                    <ng-content></ng-content>
                </div>

                <!-- Footer (optional) -->
                <div *ngIf="showFooter" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <button *ngIf="showCancelButton" type="button" (click)="onClose()"
                        class="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                        {{ cancelText }}
                    </button>
                    <button *ngIf="showConfirmButton" type="button" (click)="onConfirm()" [disabled]="confirmDisabled"
                        [class]="'inline-flex justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ' + confirmButtonClass">
                        <i *ngIf="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
                        {{ isLoading ? loadingText : confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title = '';
    @Input() icon?: string;
    @Input() iconBgClass = 'bg-green-100';
    @Input() iconColorClass = 'text-green-600';
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

    // Footer options
    @Input() showFooter = true;
    @Input() showCancelButton = true;
    @Input() showConfirmButton = true;
    @Input() cancelText = 'Annuler';
    @Input() confirmText = 'Confirmer';
    @Input() loadingText = 'Chargement...';
    @Input() confirmButtonClass = 'bg-green-600 hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600';
    @Input() confirmDisabled = false;
    @Input() isLoading = false;

    @Output() close = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<void>();

    get sizeClass(): string {
        const sizes = {
            'sm': 'max-w-sm',
            'md': 'max-w-lg',
            'lg': 'max-w-2xl',
            'xl': 'max-w-4xl'
        };
        return sizes[this.size];
    }

    onClose(): void {
        this.close.emit();
    }

    onConfirm(): void {
        this.confirm.emit();
    }
}
