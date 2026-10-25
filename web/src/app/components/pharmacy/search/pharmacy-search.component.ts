import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-pharmacy-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Recherche dans l'Inventaire</h2>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-4">
          <input type="text" [(ngModel)]="searchQuery" (input)="search()"
                 placeholder="Rechercher un médicament..."
                 class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>

        <div *ngIf="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        </div>

        <div *ngIf="!isLoading && results.length > 0" class="space-y-2">
          <div *ngFor="let med of results" class="p-4 border rounded hover:bg-gray-50">
            <h3 class="font-semibold">{{ med.name }}</h3>
            <p class="text-sm text-gray-600">Stock: {{ med.quantity }} | Prix: {{ med.price }}€</p>
          </div>
        </div>

        <div *ngIf="!isLoading && searchQuery && results.length === 0" class="text-center py-8 text-gray-500">
          Aucun résultat trouvé
        </div>
      </div>
    </div>
  `
})
export class PharmacySearchComponent {
    searchQuery = '';
    results: any[] = [];
    isLoading = false;

    constructor(private http: HttpClient) { }

    search(): void {
        if (!this.searchQuery || this.searchQuery.length < 2) {
            this.results = [];
            return;
        }

        this.isLoading = true;
        this.http.get<any>(`/api/v1/medications/search?query=${this.searchQuery}`).subscribe({
            next: (response) => {
                this.results = response.data || [];
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }
}
