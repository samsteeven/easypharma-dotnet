// ==========================================
// user.model.ts
// ==========================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  pharmacyId?: string; // For PHARMACY_EMPLOYEE and DELIVERY
  pharmacyName?: string; // For PHARMACY_EMPLOYEE and DELIVERY
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PHARMACY_ADMIN = 'PHARMACY_ADMIN',
  PHARMACY_EMPLOYEE = 'PHARMACY_EMPLOYEE',
  PATIENT = 'PATIENT',
  DELIVERY = 'DELIVERY'
}

// ==========================================
// auth.model.ts
// ==========================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string; // "SUPER_ADMIN", "PHARMACY_ADMIN", "PHARMACY_EMPLOYEE", etc.
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  pharmacyId?: string; // Required for PHARMACY_EMPLOYEE and DELIVERY
}

// Backend response structure
export interface BackendAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  timestamp: number;
}

// Frontend-friendly structure (for internal use)
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  role: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
  // TODO: Add frontend URL if needed by backend
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

