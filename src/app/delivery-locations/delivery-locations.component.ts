import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-delivery-locations',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './delivery-locations.component.html',
  styleUrls: ['./delivery-locations.component.scss']
})
export class DeliveryLocationsComponent implements OnInit {
  getStoreName(storeId: string): string {
    const store = this.stores.find(s => s._id === storeId);
    return store ? store.name : storeId;
  }

  getUserName(userOrId: any): string {
    if (!userOrId) return '—';
    if (typeof userOrId === 'object') {
      return userOrId.name || userOrId.email || userOrId.mobileNumber || userOrId._id || '—';
    }
    const user = this.userById.get(String(userOrId));
    return user?.name || user?.email || user?.mobileNumber || String(userOrId);
  }
  locations: any[] = [];
  stores: any[] = [];
  users: any[] = [];
  private userById = new Map<string, any>();
  selectedLocation: any = {};
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('locationModal') modal!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  ngOnInit(): void {
    this.loadLocations();
    this.loadStores();
    this.loadUsers();
  }

  loadLocations(): void {
    this.apiService.getDeliveryLocations().subscribe({
      next: (data) => {
        this.locations = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading delivery locations', 'error');
      }
    });
  }

  loadStores(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading stores', 'error');
      }
    });
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data ?? [];
        this.userById = new Map(this.users.map((u) => [String(u._id), u]));
        this.cdr.markForCheck();
      },
      error: () => {
        // Non-blocking: page can still work without resolving names
      },
    });
  }

  openAddModal(): void {
    this.selectedLocation = {};
    this.isEditMode = false;
  }

  editLocation(location: any): void {
    this.selectedLocation = { ...location };
    this.isEditMode = true;
  }

  saveLocation(): void {
    const locationToSave = { ...this.selectedLocation };
    if (locationToSave.storeId && locationToSave.storeId._id) {
      locationToSave.storeId = locationToSave.storeId._id;
    }
    if (this.isEditMode) {
      this.apiService.updateDeliveryLocation(locationToSave._id, locationToSave).subscribe({
        next: () => {
          this.loadLocations();
          this.ngZone.run(() => {
            this.hideModal();
            setTimeout(() => {
              this.showToastMessage('Location updated successfully', 'success');
              this.cdr.detectChanges();
            }, 300);
          });
        },
        error: () => {
          this.showToastMessage('Error updating location', 'error');
        }
      });
    } else {
      this.apiService.createDeliveryLocation(locationToSave).subscribe({
        next: () => {
          this.loadLocations();
          this.ngZone.run(() => {
            this.hideModal();
            setTimeout(() => {
              this.showToastMessage('Location created successfully', 'success');
              this.selectedLocation = {};
              this.cdr.detectChanges();
            }, 300);
          });
        },
        error: () => {
          this.showToastMessage('Error creating location', 'error');
        }
      });
    }
  }

  deleteLocation(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteDeliveryLocation(id).subscribe({
        next: () => {
          this.loadLocations();
          this.showToastMessage('Location deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting location', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedLocation = {};
    this.isEditMode = false;
    this.hideModal();
  }

  hideModal(): void {
    const modalElement = document.getElementById('locationModal');
    if (modalElement && (window as any).bootstrap) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    }
  }
}
