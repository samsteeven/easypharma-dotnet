import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isSavingPassword = false;
  user: User | null = null;
  message: { type: 'success' | 'error', text: string } | null = null;

  // Delete Modal State
  isDeleteModalOpen = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.isLoading = false;
        this.showMessage('error', 'Impossible de charger le profil.');
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSaving = true;
      this.message = null;

      // Inclusion de toutes les données existantes (id, lat, long, etc.) + valeurs du formulaire
      const updateData = { ...this.user, ...this.profileForm.getRawValue() };

      this.userService.updateProfile(updateData).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.isSaving = false;
          this.showMessage('success', 'Profil mis à jour avec succès !');
        },
        error: (err) => {
          console.error('Error updating profile', err);
          this.isSaving = false;
          this.showMessage('error', 'Erreur lors de la mise à jour.');
        }
      });
    }
  }

  onUpdatePassword(): void {
    if (this.passwordForm.valid) {
      this.isSavingPassword = true;
      this.message = null;

      const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

      this.userService.updatePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      }).subscribe({
        next: () => {
          this.isSavingPassword = false;
          this.passwordForm.reset();
          this.showMessage('success', 'Mot de passe modifié avec succès !');
        },
        error: (err) => {
          console.error('Error updating password', err);
          this.isSavingPassword = false;
          this.showMessage('error', 'Erreur lors du changement de mot de passe. Vérifiez votre mot de passe actuel.');
        }
      });
    }
  }

  showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => this.message = null, 5000);
  }

  getRoleLabel(): string {
    return this.user?.role || '';
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = true;
  }

  cancelDelete(): void {
    this.isDeleteModalOpen = false;
  }

  performDelete(): void {
    this.isSaving = true;
    this.userService.deleteProfile().subscribe({
      next: () => {
        this.isSaving = false;
        this.isDeleteModalOpen = false;
        this.authService.logout(); // Logout and redirect handled by AuthService
      },
      error: (err) => {
        console.error('Error deleting profile', err);
        this.isSaving = false;
        this.showMessage('error', 'Impossible de supprimer votre compte.');
        this.isDeleteModalOpen = false;
      }
    });
  }
}
