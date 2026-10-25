import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AuthResponse,
  BackendAuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../models/user.model';

// ========== SERVICE ==========
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/v1';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  // ========== AUTH METHODS ==========
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.apiUrl}/auth/login`, data)
      .pipe(
        map(backendResponse => {
          const response: AuthResponse = {
            accessToken: backendResponse.data.access_token,
            refreshToken: backendResponse.data.refresh_token,
            user: backendResponse.data.user,
            role: backendResponse.data.user.role,
            expiresIn: backendResponse.data.expires_in
          };
          this.setSession(response.user, response.accessToken, response.refreshToken, response.role);
          return response;
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        map(backendResponse => {
          const response: AuthResponse = {
            accessToken: backendResponse.data.access_token,
            refreshToken: backendResponse.data.refresh_token,
            user: backendResponse.data.user,
            role: backendResponse.data.user.role,
            expiresIn: backendResponse.data.expires_in
          };
          this.setSession(response.user, response.accessToken, response.refreshToken, response.role);
          return response;
        })
      );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => this.doLogout(),
        error: () => this.doLogout()
      });
    } else {
      this.doLogout();
    }
  }

  private doLogout(): void {
    localStorage.removeItem('token'); // accessToken
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    // Note: Backend might not support this yet, based on guide "check forgot-password flow"
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, data);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<BackendAuthResponse>(`${this.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        map(backendResponse => {
          const response: AuthResponse = {
            accessToken: backendResponse.data.access_token,
            refreshToken: backendResponse.data.refresh_token,
            user: backendResponse.data.user,
            role: backendResponse.data.user.role,
            expiresIn: backendResponse.data.expires_in
          };
          this.setSession(response.user, response.accessToken, response.refreshToken, response.role);
          return response;
        })
      );
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/me`)
      .pipe(
        map(response => response.data), // Unwrap the response
        tap(user => {
          this.currentUserSubject.next({ ...user, role: this.getCurrentRole() });
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  // ========== SESSION MANAGEMENT ==========
  private setSession(user: any, accessToken: string, refreshToken: string, role: string): void {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    this.currentUserSubject.next({ ...user, role });
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    const role = this.getCurrentRole();

    if (token && user && role) {
      this.currentUserSubject.next({ ...user, role });
    }
  }

  // ========== GETTERS ==========
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getCurrentRole(): string | null {
    return localStorage.getItem('role');
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  // ========== ROLE CHECKS ==========
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isSuperAdmin(): boolean {
    return this.getCurrentRole() === 'SUPER_ADMIN';
  }

  isPharmacyAdmin(): boolean {
    return this.getCurrentRole() === 'PHARMACY_ADMIN';
  }

  isPharmacyEmployee(): boolean {
    return this.getCurrentRole() === 'PHARMACY_EMPLOYEE';
  }

  isPharmacyStaff(): boolean {
    return this.isPharmacyAdmin() || this.isPharmacyEmployee();
  }

  // Get pharmacy ID for pharmacy staff
  getUserPharmacyId(): string | undefined {
    const user = this.getCurrentUser();
    return user?.pharmacyId;
  }

  // Check if user has a pharmacy
  hasPharmacy(): boolean {
    return !!this.getUserPharmacyId();
  }

  // ========== ROLE BASED REDIRECT ==========
  redirectBasedOnRole(): void {
    const role = this.getCurrentRole();
    if (this.isSuperAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.isPharmacyAdmin()) {
      const pharmacyId = this.getUserPharmacyId();
      if (pharmacyId) {
        this.router.navigate(['/pharmacy/dashboard']);
      } else {
        this.router.navigate(['/pharmacy-admin/create-pharmacy']);
      }
    } else if (this.isPharmacyEmployee()) {
      this.router.navigate(['/pharmacy/dashboard']);
    } else {
      this.router.navigate(['/login']); // Default to login
    }
  }
}