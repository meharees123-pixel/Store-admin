import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-user-addresses',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './user-addresses.component.html',
  styleUrls: ['./user-addresses.component.scss']
})
export class UserAddressesComponent implements OnInit {
  stores: any[] = [];
  users: any[] = [];
  addresses: any[] = [];
  selectedAddress: any = {};
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('addressModal') modal!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadAddresses();
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading users', 'error');
      }
    });
  }

  loadStores(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToastMessage('Error loading stores', 'error');
      },
    });
  }

  getUserName(id: string): string {
    const user = this.users.find((u: any) => u._id === id);
    return user ? (user.name || user.mobileNumber || id) : id;
  }

  getUserLabel(user: any): string {
    if (!user) return '';
    return user.name || user.mobileNumber || user.email || user._id;
  }

  getStoreName(id?: string): string {
    if (!id) return '—';
    const store = this.stores.find((s) => s._id === id);
    return store ? store.name || store._id : id;
  }

  loadAddresses(): void {
    this.apiService.getUserAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading user addresses', 'error');
      }
    });
  }

  openAddModal(): void {
    this.selectedAddress = {};
    this.isEditMode = false;
  }

  editAddress(address: any): void {
    this.selectedAddress = { ...address };
    this.isEditMode = true;
  }

  saveAddress(): void {
    if (this.isEditMode) {
      this.apiService.updateUserAddress(this.selectedAddress._id, this.selectedAddress).subscribe({
        next: () => {
          this.loadAddresses();
          this.closeModal();
          this.showToastMessage('Address updated successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error updating address', 'error');
        }
      });
    } else {
      this.apiService.createUserAddress(this.selectedAddress).subscribe({
        next: () => {
          this.loadAddresses();
          this.closeModal();
          this.showToastMessage('Address created successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error creating address', 'error');
        }
      });
    }
  }

  deleteAddress(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteUserAddress(id).subscribe({
        next: () => {
          this.loadAddresses();
          this.showToastMessage('Address deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting address', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedAddress = {};
    this.isEditMode = false;
    // Optionally hide modal if needed
  }
}
