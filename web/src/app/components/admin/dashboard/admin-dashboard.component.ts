import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
// import { UserService } from '../../../services/user.service';
import { AdminService } from '../../../services/admin.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoins, faUsers, faClinicMedical, faShoppingCart, faDownload, faPills, faBoxOpen, faSearch, faChartLine, faChartPie } from '@fortawesome/free-solid-svg-icons';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('soldChart') soldChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart') trendsChartCanvas!: ElementRef<HTMLCanvasElement>;

  faCoins = faCoins;
  faUsers = faUsers;
  faClinicMedical = faClinicMedical;
  faShoppingCart = faShoppingCart;
  faDownload = faDownload;
  faPills = faPills;
  faBoxOpen = faBoxOpen;
  faSearch = faSearch;
  faChartLine = faChartLine;
  faChartPie = faChartPie;

  globalStats: any = null;
  topSold: any[] = [];
  topSearches: any[] = [];
  loading = false;
  currentUser: any = null;

  private soldChart: Chart | null = null;
  private trendsChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // We will initialize charts after data is loaded
  }

  loadData(): void {
    this.loading = true;

    // Use forkJoin to load everything in parallel if possible, or just sequential
    // For simplicity, let's load them
    this.adminService.getGlobalStats()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => this.globalStats = data,
        error: (err) => console.error('Error loading global stats', err)
      });

    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.adminService.getTopSoldMedications().subscribe({
      next: (data) => {
        this.topSold = data;
        this.updateSoldChart();
      },
      error: (err) => console.error('Error loading top sold', err)
    });

    this.adminService.getTopSearchTrends().subscribe({
      next: (data) => {
        this.topSearches = data;
        this.updateTrendsChart();
      },
      error: (err) => console.error('Error loading trends', err)
    });
  }

  private updateSoldChart(): void {
    if (!this.soldChartCanvas || this.topSold.length === 0) return;

    if (this.soldChart) {
      this.soldChart.destroy();
    }

    const ctx = this.soldChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.soldChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.topSold.map(i => i.medicationName),
        datasets: [{
          label: 'Unités vendues',
          data: this.topSold.map(i => i.soldCount),
          backgroundColor: '#6366f1',
          borderRadius: 8,
          barThickness: 24,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private updateTrendsChart(): void {
    if (!this.trendsChartCanvas || this.topSearches.length === 0) return;

    if (this.trendsChart) {
      this.trendsChart.destroy();
    }

    const ctx = this.trendsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.topSearches.map(i => i.query),
        datasets: [{
          data: this.topSearches.map(i => i.searchCount),
          backgroundColor: [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'
          ],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              font: { size: 10, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'A';
    return `${this.currentUser.firstName?.charAt(0) || ''}${this.currentUser.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  exportData(): void {
    this.adminService.exportGlobalReport().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-global-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error exporting global report', err);
        alert('Erreur lors de la génération du rapport.');
      }
    });
  }

}