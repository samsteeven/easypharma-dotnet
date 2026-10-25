// ...existing code...
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faKey, faEnvelope, faCircleNotch, faCheck, faArrowLeft, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  // Icons
  faKey = faKey;
  faEnvelope = faEnvelope;
  faCircleNotch = faCircleNotch;
  faCheck = faCheck;
  faArrowLeft = faArrowLeft;
  faExclamationCircle = faExclamationCircle;
  forgotForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotForm.get('email');
  }

  onSubmit(): void {
    if (!this.forgotForm.valid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.forgotForm.disable();

    // CORRECTION : Utilisez 1 argument (objet)
    const payload = {
      email: this.forgotForm.value.email
    };

    this.authService.forgotPassword(payload) // 1 argument seulement
      .pipe(finalize(() => {
        this.loading = false;
        this.forgotForm.enable();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Email envoyé avec succès !';
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de l\'envoi de l\'email';
        }
      });
  }
}