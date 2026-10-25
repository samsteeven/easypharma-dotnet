import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClientService {
  logout(): void {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
