import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  editMode = false;
  loading = false;
  loadingProfile = true;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }
  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadingProfile = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loadingProfile = false;
        this.initForm();
      },
      error: () => {
        this.loadingProfile = false;
        this.router.navigate(['/login']);
      }
    });
  }

  initForm(): void {
    if (this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone || ''
      });
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.editMode) {
      this.initForm();
    }
  }

  cancelEdit(): void {
    this.editMode = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.initForm();
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.userService.updateProfile(this.profileForm.value).subscribe({
        next: (updatedUser) => {
          this.loading = false;
          this.user = updatedUser;
          this.successMessage = 'Profil mis à jour avec succès !';

          setTimeout(() => {
            this.editMode = false;
            this.successMessage = '';
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Erreur lors de la mise à jour';
        }
      });
    }
  }

  changePassword(): void {
    // TODO: Implémenter la modal de changement de mot de passe
    alert('Fonctionnalité de changement de mot de passe à implémenter');
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrateur',
      'CLIENT': 'Client',
      'COLLECTEUR': 'Collecteur'
    };
    return labels[role] || role;
  }
}