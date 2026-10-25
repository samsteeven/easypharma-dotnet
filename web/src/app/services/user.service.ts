import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

// Interface pour la pagination (adaptée selon Spring Data REST/Pageable habituel)
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // Current page index
}

import { map } from 'rxjs/operators';

// Interface pour la réponse standard du backend
export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/v1/users';

  constructor(private http: HttpClient) { }

  // Récupérer le profil de l'utilisateur connecté
  getProfile(): Observable<User> {
    return this.http.get<BackendResponse<User>>(`${this.apiUrl}/me`)
      .pipe(map(response => response.data));
  }

  // Mettre à jour le profil
  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<BackendResponse<User>>(`${this.apiUrl}/me`, data)
      .pipe(map(response => response.data));
  }

  // Changer le mot de passe
  updatePassword(data: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, data);
  }

  // ADMIN: Récupérer tous les utilisateurs avec pagination et filtre par rôle optionnel
  getAllUsers(page: number = 0, size: number = 10, role?: string): Observable<PaginatedResponse<User>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (role) {
      url += `&role=${role}`;
    }
    return this.http.get<BackendResponse<PaginatedResponse<User>>>(url)
      .pipe(map(response => response.data));
  }

  // PHARMACY_ADMIN: Récupérer ses employés
  getMyEmployees(page: number = 0, size: number = 10): Observable<PaginatedResponse<User>> {
    return this.http.get<BackendResponse<PaginatedResponse<User>>>(`${this.apiUrl}/my-pharmacy?page=${page}&size=${size}`)
      .pipe(map(response => response.data));
  }

  // ADMIN & USER: Récupérer un utilisateur par ID
  getUserById(id: string): Observable<User> {
    return this.http.get<BackendResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  // ADMIN: Supprimer un utilisateur
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ADMIN: Changer le rôle d'un utilisateur
  changeUserRole(id: string, role: string): Observable<User> {
    return this.http.patch<BackendResponse<User>>(`${this.apiUrl}/${id}/role`, { role })
      .pipe(map(response => response.data));
  }

  // USER: Supprimer son propre compte
  deleteProfile(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me`);
  }

  // ADMIN: Mettre à jour un utilisateur par ID
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<BackendResponse<User>>(`${this.apiUrl}/${id}`, data)
      .pipe(map(response => response.data));
  }


  // ADMIN: Obtenir les statistiques
  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}