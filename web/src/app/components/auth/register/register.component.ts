// app/components/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faLock, faEye, faEyeSlash, faCircleNotch, faUserPlus, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  // Icons
  faUser = faUser;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faMapMarkerAlt = faMapMarkerAlt;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCircleNotch = faCircleNotch;
  faUserPlus = faUserPlus;
  faCheck = faCheck;
  registerForm: FormGroup;
  isLoading = false;
  role: string = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      latitude: [0],
      longitude: [0],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void { }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const formValue = this.registerForm.value;

      // Utility helpers
      const toNull = (val: any) => (val === '' || val === null || val === undefined) ? null : val;
      const toNumOrNull = (val: any) => (val === 0 || val === '0' || val === '' || val === null || val === undefined) ? null : Number(val);

      // Always PATIENT for public registration
      const roleEnum = 'PATIENT';

      const formData: any = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        role: roleEnum,
        phone: toNull(formValue.phone),
        address: toNull(formValue.address),
        city: toNull(formValue.city),
        latitude: toNumOrNull(formValue.latitude),
        longitude: toNumOrNull(formValue.longitude)
      };

      console.log('Register Payload:', formData);

      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Redirect to client dashboard
          this.router.navigate(['/client/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur inscription:', error);
          alert('Erreur: ' + (error.error?.message || 'Inscription échouée'));
        }
      });
    }
  }
}