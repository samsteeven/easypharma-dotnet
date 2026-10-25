import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faShoppingCart, faTruck, faBoxes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="relative">
      <button (click)="toggleDropdown()" class="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
        <fa-icon [icon]="faBell" class="text-xl"></fa-icon>
        <span *ngIf="unreadCount > 0" 
              class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {{ unreadCount }}
        </span>
      </button>

      <div *ngIf="isOpen" 
           [ngClass]="position === 'right' ? 'right-0' : 'left-0 ml-2'"
           class="absolute mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        <div class="p-4 border-b">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">Notifications</h3>
            <button (click)="clearAll()" class="text-sm text-indigo-600 hover:text-indigo-800">
              Tout effacer
            </button>
          </div>
        </div>

        <div *ngIf="notifications.length === 0" class="p-4 text-center text-gray-500">
          Aucune notification
        </div>

        <div *ngFor="let notification of notifications" 
             (click)="markAsRead(notification)"
             [class.bg-indigo-50]="!notification.read"
             class="p-4 border-b hover:bg-gray-50 cursor-pointer">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <fa-icon [icon]="getIcon(notification.type)" class="text-lg" [ngClass]="getIconColor(notification.type)"></fa-icon>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
              <p class="text-sm text-gray-500">{{ notification.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ notification.timestamp | date:'short' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationBellComponent implements OnInit {
  @Input() position: 'left' | 'right' = 'right';
  faBell = faBell;
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.notifications = this.notificationService.getAllNotifications();
    this.updateUnreadCount();

    this.notificationService.getNotifications$().subscribe(notification => {
      this.notifications = this.notificationService.getAllNotifications();
      this.updateUnreadCount();
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.notificationService.clearAll();
    this.notifications = [];
    this.updateUnreadCount();
    this.isOpen = false;
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notificationService.getUnreadCount();
  }

  getIcon(type: string): any {
    const icons: Record<string, any> = {
      'ORDER': faShoppingCart,
      'DELIVERY': faTruck,
      'INVENTORY': faBoxes,
      'SYSTEM': faInfoCircle
    };
    return icons[type] || faInfoCircle;
  }

  getIconColor(type: string): string {
    const colors: Record<string, string> = {
      'ORDER': 'text-blue-600',
      'DELIVERY': 'text-green-600',
      'INVENTORY': 'text-yellow-600',
      'SYSTEM': 'text-slate-400'
    };
    return colors[type] || 'text-slate-400';
  }
}
