import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  stores: any[] = [];
  selectedCategory: any = {};
  selectedImageFile: File | null = null;
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('categoryModal') modal!: ElementRef;

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
    this.loadCategories();
    this.loadStores();
  }

  loadStores(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToastMessage('Error loading stores', 'error');
      }
    });
  }

  getStoreName(storeId: string): string {
    const store = this.stores.find((s: any) => s._id === storeId);
    return store ? store.name : storeId;
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading categories', 'error');
      }
    });
  }

  openAddModal(): void {
    this.selectedCategory = { isActive: true, storeId: '' };
    this.selectedImageFile = null;
    this.isEditMode = false;
  }

  editCategory(category: any): void {
    this.selectedCategory = { isActive: true, ...category };
    this.selectedImageFile = null;
    this.isEditMode = true;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedImageFile = file;
  }

  saveCategory(): void {
    if (this.isEditMode) {
      this.apiService.updateCategory(this.selectedCategory._id, this.selectedCategory).subscribe({
        next: (updated) => {
          if (this.selectedImageFile) {
            this.apiService.uploadCategoryImage(updated?._id || this.selectedCategory._id, this.selectedImageFile, true).subscribe({
              next: () => {
                this.loadCategories();
                this.closeModal();
              },
              error: () => this.showToastMessage('Error uploading category image', 'error'),
            });
            return;
          }

          this.loadCategories();
          this.closeModal();
          this.showToastMessage('Category updated successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error updating category', 'error');
        }
      });
    } else {
      this.apiService.createCategory(this.selectedCategory).subscribe({
        next: (created) => {
          const createdId = created?._id;
          if (createdId && this.selectedImageFile) {
            this.apiService.uploadCategoryImage(createdId, this.selectedImageFile, false).subscribe({
              next: () => {
                this.loadCategories();
                this.closeModal();
              },
              error: () => this.showToastMessage('Error uploading category image', 'error'),
            });
            return;
          }

          this.loadCategories();
          this.closeModal();
          this.showToastMessage('Category created successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error creating category', 'error');
        }
      });
    }
  }

  deleteSelectedCategoryImage(): void {
    const id = this.selectedCategory?._id;
    if (!id) return;
    if (!confirm('Delete category image?')) return;

    this.apiService.deleteCategoryImage(id).subscribe({
      next: () => {
        this.selectedCategory.categoryImage = undefined;
        this.selectedImageFile = null;
        this.loadCategories();
      },
      error: () => this.showToastMessage('Error deleting category image', 'error'),
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
          this.showToastMessage('Category deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting category', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedCategory = {};
    this.selectedImageFile = null;
    this.isEditMode = false;
    // Optionally hide modal if needed
  }
}
