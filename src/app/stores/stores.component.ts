import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-stores',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './stores.component.html',
  styleUrls: ['./stores.component.scss']
})
export class StoresComponent implements OnInit {
  stores: any[] = [];
  selectedStore: any = {};
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('storeModal') modal!: ElementRef;

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

  openAddModal(): void {
    this.selectedStore = { isActive: true };
    this.isEditMode = false;
  }

  editStore(store: any): void {
    this.selectedStore = { isActive: true, ...store };
    this.isEditMode = true;
  }

  saveStore(): void {
    if (this.isEditMode) {
      this.apiService.updateStore(this.selectedStore._id, this.selectedStore).subscribe({
        next: () => {
          this.loadStores();
          this.closeModal();
          this.showToastMessage('Store updated successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error updating store', 'error');
        }
      });
    } else {
      this.apiService.createStore(this.selectedStore).subscribe({
        next: () => {
          this.loadStores();
          this.closeModal();
          this.showToastMessage('Store created successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error creating store', 'error');
        }
      });
    }
  }

  deleteStore(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteStore(id).subscribe({
        next: () => {
          this.loadStores();
          this.showToastMessage('Store deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting store', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedStore = {};
    this.isEditMode = false;
    // Optionally hide modal if needed
  }
}
