import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, PaginatedResponse } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  totalPages = 0;
  totalElements = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;

  // Filter State
  selectedRole: string = '';

  // Edit Modal State
  isEditModalOpen = false;
  editingUser: User | null = null;
  editForm: FormGroup;

  // Add Modal State
  isAddModalOpen = false;
  addForm: FormGroup;

  // Delete Modal State
  userToDelete: User | null = null;
  isDeleteModalOpen = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['PHARMACY_ADMIN', Validators.required], // Default to PHARMACY_ADMIN
      phone: ['']
    });

    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 0): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Pass selectedRole (if 'ALL' or empty, pass undefined/empty string)
    const roleParam = this.selectedRole === 'ALL' ? '' : this.selectedRole;

    this.userService.getAllUsers(page, this.pageSize, roleParam).subscribe({
      next: (response: PaginatedResponse<User>) => {
        // Support both paginated and list response for safety
        if (response.content) {
          this.users = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.currentPage = response.number;
        } else if (Array.isArray(response)) {
          // Fallback if backend returns array
          this.users = response;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.errorMessage = "Impossible de charger la liste des utilisateurs.";
        this.isLoading = false;
      }
    });
  }

  onRoleChange(): void {
    this.currentPage = 0; // Reset to first page
    this.loadUsers(0);
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadUsers(page);
    }
  }

  // Open Edit Modal
  editUser(user: User): void {
    this.editingUser = user;
    this.editForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city
    });
    this.isEditModalOpen = true;
  }

  // Close Edit Modal
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingUser = null;
    this.editForm.reset();
  }

  // Submit Edit Form
  onUpdateUser(): void {
    if (this.editForm.valid && this.editingUser) {
      this.isSaving = true;
      const updateData = { ...this.editingUser, ...this.editForm.value };

      this.userService.updateUser(this.editingUser.id, updateData).subscribe({
        next: (updatedUser) => {
          // Update local list
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.isSaving = false;
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Error updating user', err);
          this.isSaving = false;
          alert('Erreur lors de la mise à jour de l\'utilisateur.');
        }
      });
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  cancelDelete(): void {
    this.userToDelete = null;
    this.isDeleteModalOpen = false;
  }

  performDelete(): void {
    if (this.userToDelete) {
      this.isSaving = true;
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.loadUsers(this.currentPage);
          this.isSaving = false;
          this.cancelDelete();
        },
        error: (err) => {
          console.error('Error deleting user', err);
          this.isSaving = false;
          alert("Erreur lors de la suppression de l'utilisateur.");
          this.cancelDelete();
        }
      });
    }
  }

  // Add User Methods
  openAddModal(): void {
    this.isAddModalOpen = true;
    this.addForm.reset({ role: 'PHARMACY_ADMIN' });
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.addForm.reset();
  }

  onAddUser(): void {
    if (this.addForm.valid) {
      this.isSaving = true;
      const userData = this.addForm.value;

      this.authService.register(userData).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeAddModal();
          this.loadUsers(0); // Reload first page
          alert('Utilisateur créé avec succès !');
        },
        error: (err) => {
          console.error('Error creating user', err);
          this.isSaving = false;
          alert('Erreur lors de la création de l\'utilisateur. Vérifiez que l\'email n\'existe pas déjà.');
        }
      });
    }
  }
}
