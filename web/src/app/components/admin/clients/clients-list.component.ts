import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { RouterLink } from '@angular/router';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, /*RouterLink*/],
  template: `
    <h2>Clients</h2>
    <p *ngIf="loading">Chargement...</p>
    <ul>
      <li *ngFor="let c of clients">{{ c.firstName }} {{ c.lastName }}</li>
    </ul>
  `
})
export class ClientsListComponent implements OnInit {
  clients: User[] = [];
  loading = true;

  constructor() { }

  ngOnInit(): void {
    this.loading = false;
    // TODO: récupérer la liste via un service (UserService)
  }
}