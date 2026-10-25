import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-pharmacy-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Tableau de Bord</h2>
      
      <!-- Export Report Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Exporter Rapport d'Activité</h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input type="date" [(ngModel)]="startDate" 
                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input type="date" [(ngModel)]="endDate"
                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>
        </div>
        
        <button (click)="exportReport()" [disabled]="isExporting || !startDate || !endDate"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          <i class="fas fa-download mr-2"></i>
          {{ isExporting ? 'Génération...' : 'Télécharger le rapport CSV' }}
        </button>
      </div>
    </div>
  `
})
export class PharmacyDashboardComponent implements OnInit {
    startDate: string = '';
    endDate: string = '';
    isExporting = false;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // Set default dates (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        this.endDate = end.toISOString().split('T')[0];
        this.startDate = start.toISOString().split('T')[0];
    }

    exportReport(): void {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return;

        this.isExporting = true;
        const url = `/api/v1/employees/${currentUser.id}/report?startDate=${this.startDate}&endDate=${this.endDate}`;

        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `rapport-activite-${this.startDate}-${this.endDate}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.isExporting = false;
            },
            error: () => {
                this.isExporting = false;
                alert('Erreur lors de la génération du rapport');
            }
        });
    }
}
