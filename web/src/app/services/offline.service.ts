import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private isOnline = navigator.onLine;

    constructor() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Application en ligne');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Application hors ligne');
        });
    }

    getOnlineStatus(): boolean {
        return this.isOnline;
    }

    isOffline(): boolean {
        return !this.isOnline;
    }
}
