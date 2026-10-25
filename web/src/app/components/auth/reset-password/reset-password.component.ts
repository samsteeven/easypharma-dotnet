import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@services';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock, faCircleNotch, faCheck, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})

export class ResetPasswordComponent implements OnInit {
  // Icons
  faLock = faLock;
  faCircleNotch = faCircleNotch;
  faCheck = faCheck;
  faExclamationCircle = faExclamationCircle;
  resetForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.errorMessage = 'Token invalide ou expiré';
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.valid && this.token) {
      this.loading = true;
      this.errorMessage = '';

      // CORRECTION ICI : Créez un objet avec les 2 propriétés
      const data = {
        token: this.token,
        newPassword: this.resetForm.value.newPassword
      };

      // Appelez avec 1 argument
      this.authService.resetPassword(data).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Mot de passe réinitialisé avec succès !';
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Erreur lors de la réinitialisation';
        }
      });
    }
  }
}