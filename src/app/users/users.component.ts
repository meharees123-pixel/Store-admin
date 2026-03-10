import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';
import { User } from './user.model';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedUser: Partial<User> = {};
  isEditMode = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 5000);
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data ?? [];
        this.cdr.markForCheck();
      },
      error: () => this.showToastMessage('Error loading users', 'error'),
    });
  }

  openAddModal(): void {
    this.selectedUser = { isActive: true };
    this.isEditMode = false;
  }

  editUser(user: User): void {
    this.selectedUser = { ...user };
    this.isEditMode = true;
  }

  saveUser(): void {
    if (!this.selectedUser.mobileNumber?.trim()) {
      this.showToastMessage('Mobile number is required', 'error');
      return;
    }

    const payload: Partial<User> = {
      name: this.selectedUser.name?.trim() || undefined,
      email: this.selectedUser.email?.trim() || undefined,
      mobileNumber: this.selectedUser.mobileNumber.trim(),
      isActive: this.selectedUser.isActive ?? true,
    };

    if (this.isEditMode && this.selectedUser._id) {
      this.apiService.updateUser(this.selectedUser._id, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.showToastMessage('User updated successfully', 'success');
        },
        error: () => this.showToastMessage('Error updating user', 'error'),
      });
      return;
    }

    this.apiService.createUser(payload).subscribe({
      next: () => {
        this.loadUsers();
        this.closeModal();
        this.showToastMessage('User created successfully', 'success');
      },
      error: () => this.showToastMessage('Error creating user', 'error'),
    });
  }

  deleteUser(id?: string): void {
    if (!id) return;
    if (!confirm('Are you sure?')) return;

    this.apiService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.showToastMessage('User deleted successfully', 'success');
      },
      error: () => this.showToastMessage('Error deleting user', 'error'),
    });
  }

  closeModal(): void {
    this.selectedUser = {};
    this.isEditMode = false;
  }
}

