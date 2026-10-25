import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'ORDER' | 'DELIVERY' | 'INVENTORY' | 'SYSTEM';
    timestamp: Date;
    read: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications: Notification[] = [];
    private notificationSubject = new Subject<Notification>();

    getNotifications$(): Observable<Notification> {
        return this.notificationSubject.asObservable();
    }

    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.notificationSubject.next(newNotification);

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
    }

    getAllNotifications(): Notification[] {
        return this.notifications;
    }

    markAsRead(id: string): void {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    clearAll(): void {
        this.notifications = [];
    }
}
