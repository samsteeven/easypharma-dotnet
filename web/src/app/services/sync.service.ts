import { Injectable } from '@angular/core';

interface PendingSync {
    id: string;
    type: 'ORDER' | 'INVENTORY' | 'DELIVERY';
    data: any;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class SyncService {
    private pendingSync: PendingSync[] = [];

    addToSyncQueue(type: 'ORDER' | 'INVENTORY' | 'DELIVERY', data: any): void {
        const syncItem: PendingSync = {
            id: Date.now().toString(),
            type,
            data,
            timestamp: new Date()
        };

        this.pendingSync.push(syncItem);
        this.saveToPersistence();
    }

    async syncAll(): Promise<void> {
        if (this.pendingSync.length === 0) return;

        console.log(`Synchronisation de ${this.pendingSync.length} éléments...`);

        // TODO: Implement actual sync logic
        // For now, just clear the queue
        this.pendingSync = [];
        this.saveToPersistence();
    }

    getPendingCount(): number {
        return this.pendingSync.length;
    }

    private saveToPersistence(): void {
        localStorage.setItem('pendingSync', JSON.stringify(this.pendingSync));
    }

    private loadFromPersistence(): void {
        const stored = localStorage.getItem('pendingSync');
        if (stored) {
            this.pendingSync = JSON.parse(stored);
        }
    }
}
