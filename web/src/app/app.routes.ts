import { Routes } from '@angular/router';
import { LoginComponent } from '@components/auth/login/login.component';
import { RegisterComponent } from '@components/auth/register/register.component';
import { ForgotPasswordComponent } from '@components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@components/auth/reset-password/reset-password.component';

// Layouts
import { AdminLayoutComponent } from '@components/shared/layouts/admin-layout.component';

// Admin Components
import { AdminDashboardComponent } from '@components/admin/dashboard/admin-dashboard.component';
import { UsersListComponent } from '@components/admin/users-list/users-list';
import { PharmacyApprovalComponent } from '@components/admin/pharmacies/pharmacy-approval.component';
import { PharmacyDetailComponent } from '@components/admin/pharmacies/pharmacy-detail.component';
// import { ClientsListComponent } from '@components/admin/clients/clients-list.component'; 

// Pharmacy Components
import { PharmacyAdminLayoutComponent } from '@components/shared/layouts/pharmacy-admin-layout.component';
import { PharmacyDashboardComponent } from '@components/pharmacy/dashboard/pharmacy-dashboard.component';
import { EmployeeManagementComponent } from '@components/pharmacy/employee-management/employee-management.component';
import { CreatePharmacyComponent } from '@components/pharmacy/create-pharmacy/create-pharmacy.component';
import { OrderManagementComponent } from '@components/pharmacy/orders/order-management.component';
import { DeliveryManagementComponent } from '@components/pharmacy/deliveries/delivery-management.component';

// Profile Component
import { ProfileComponent } from '@components/profile/profile';

// Error Components
import { NotFoundComponent } from '@components/errors/not-found.component';

// Guards
import { authGuard, superAdminGuard, pharmacyAdminGuard, pharmacyStaffGuard, guestGuard } from '@guards';
import { permissionGuard } from './guards/permission.guard';
import { InventoryManagementComponent } from '@components/pharmacy/inventory-management/inventory-management.component';

export const routes: Routes = [
  // Default route - redirect to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes (Protected by guestGuard)
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register/:role', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },

  // Routes SUPER_ADMIN
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, superAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'pharmacies', component: PharmacyApprovalComponent },
      { path: 'pharmacies/:id', component: PharmacyDetailComponent },
      { path: 'global-search', loadComponent: () => import('./components/shared/global-medication-search/global-medication-search.component').then(m => m.GlobalMedicationSearchComponent) },
      { path: 'financial', loadComponent: () => import('./components/admin/financial-dashboard/financial-dashboard.component').then(m => m.FinancialDashboardComponent) },
      { path: 'audit-logs', loadComponent: () => import('./components/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent) }
      // { path: 'clients', component: ClientsListComponent }
    ]
  },

  // Routes PHARMACY_ADMIN
  {
    path: 'pharmacy-admin',
    component: PharmacyAdminLayoutComponent,
    canActivate: [authGuard, pharmacyAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PharmacyDashboardComponent },
      { path: 'create-pharmacy', component: CreatePharmacyComponent },
      { path: 'catalog', loadComponent: () => import('./components/medication-catalog/medication-catalog.component').then(m => m.MedicationCatalogComponent) },
      { path: 'global-search', loadComponent: () => import('./components/shared/global-medication-search/global-medication-search.component').then(m => m.GlobalMedicationSearchComponent) },
      { path: 'employees', component: EmployeeManagementComponent },
      { path: 'orders', component: OrderManagementComponent }, // Shared with staff but accessible here too
      { path: 'inventory', component: InventoryManagementComponent },
      { path: 'audit-logs', loadComponent: () => import('./components/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent) },
      { path: 'settings', loadComponent: () => import('./components/pharmacy/settings/pharmacy-settings.component').then(m => m.PharmacySettingsComponent) },
      { path: 'profile', component: ProfileComponent }
    ]
  },

  // Routes PHARMACY_STAFF (Employees + Admins)
  {
    path: 'pharmacy',
    component: PharmacyAdminLayoutComponent, // Reusing layout, will hide items based on role
    canActivate: [authGuard, pharmacyStaffGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PharmacyDashboardComponent },
      {
        path: 'orders',
        component: OrderManagementComponent,
        canActivate: [permissionGuard('PREPARE_ORDERS')]
      },
      {
        path: 'deliveries',
        component: DeliveryManagementComponent,
        canActivate: [permissionGuard('ASSIGN_DELIVERIES')]
      },
      { path: 'profile', component: ProfileComponent }
    ]
  },

  // No longer using global profile route as it breaks layout context

  {
    path: 'my-prescriptions',
    loadComponent: () => import('./components/client/prescription/prescription-upload.component').then(m => m.PrescriptionUploadComponent),
    canActivate: [authGuard]
  },

  // 404 - Not Found page
  { path: '**', component: NotFoundComponent }
];
