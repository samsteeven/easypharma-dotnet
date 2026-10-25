import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../../services/offline.service';
import { SyncService } from '../../../services/sync.service';

@Component({
    selector: 'app-offline-banner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="isOffline" class="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg">
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-wifi-slash mr-3"></i>
          <span class="font-semibold">Mode hors ligne</span>
          <span class="ml-2 text-sm">{{ pendingSync }} modifications en attente de synchronisation</span>
        </div>
        <button *ngIf="pendingSync > 0" (click)="syncNow()" 
                class="bg-white text-yellow-600 px-4 py-1 rounded font-semibold hover:bg-yellow-50">
          Synchroniser
        </button>
      </div>
    </div>
  `
})
export class OfflineBannerComponent implements OnInit {
    isOffline = false;
    pendingSync = 0;

    constructor(
        private offlineService: OfflineService,
        private syncService: SyncService
    ) { }

    ngOnInit(): void {
        this.checkOnlineStatus();
        setInterval(() => this.checkOnlineStatus(), 5000);
    }

    checkOnlineStatus(): void {
        this.isOffline = this.offlineService.isOffline();
        this.pendingSync = this.syncService.getPendingCount();
    }

    async syncNow(): Promise<void> {
        if (!this.isOffline) {
            await this.syncService.syncAll();
            this.pendingSync = 0;
        }
    }
}
