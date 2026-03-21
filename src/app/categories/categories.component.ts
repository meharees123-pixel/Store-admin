import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import {
  BulkTemplate,
  buildTemplateWorkbook,
  getRowValue,
  normalizeBulkCode,
  parseBulkBoolean,
  readExcelFile,
  triggerDownload,
} from '../services/bulk-upload.utils';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  stores: any[] = [];
  storeFilterId = '';
  selectedBulkStoreId = '';
  bulkFile: File | null = null;
  isBulkUploading = false;
  bulkUploadErrors: string[] = [];
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
    const request = this.storeFilterId?.trim()
      ? this.apiService.getCategoriesByStore(this.storeFilterId.trim())
      : this.apiService.getCategories();
    request.subscribe({
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

  onStoreFilterChange(storeId: string): void {
    this.storeFilterId = String(storeId || '').trim();
    if (this.storeFilterId) {
      this.selectedBulkStoreId = this.storeFilterId;
    }
    this.loadCategories();
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

  onIconSelected(category: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !category?._id) {
      return;
    }
    const replace = !!category.categoryIconImage;
    this.apiService.uploadCategoryIcon(category._id, file, replace).subscribe({
      next: () => {
        this.showToastMessage('Category icon uploaded successfully', 'success');
        this.loadCategories();
        input.value = '';
      },
      error: () => {
        this.showToastMessage('Error uploading category icon', 'error');
        input.value = '';
      },
    });
  }

  deleteCategoryIcon(id: string): void {
    if (!id) return;
    if (!confirm('Delete category icon?')) return;
    this.apiService.deleteCategoryIcon(id).subscribe({
      next: () => {
        this.showToastMessage('Category icon deleted', 'success');
        this.loadCategories();
      },
      error: () => {
        this.showToastMessage('Error deleting category icon', 'error');
      },
    });
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

  downloadSampleTemplate(): void {
    if (!this.selectedBulkStoreId) {
      this.showToastMessage('Select a store before downloading a template.', 'error');
      return;
    }

    const template: BulkTemplate = {
      headers: ['Name', 'Category Code', 'Description', 'Active'],
      row: ['Fresh Produce', 'FRESH', 'Fresh fruits and veggies', 'true'],
    };
    const buffer = buildTemplateWorkbook(template);
    triggerDownload('category-template.xlsx', buffer);
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bulkFile = input.files?.[0] || null;
  }

  async handleBulkUpload(): Promise<void> {
    if (!this.selectedBulkStoreId) {
      this.showToastMessage('Select a store before uploading.', 'error');
      return;
    }
    if (!this.bulkFile) {
      this.showToastMessage('Please choose an Excel file first.', 'error');
      return;
    }
    this.isBulkUploading = true;
    this.bulkUploadErrors = [];
    try {
      const rows = await readExcelFile(this.bulkFile);
      if (!rows.length) {
        throw new Error('The file does not contain any rows.');
      }
      const result = await this.processBulkRows(rows);
      if (result.errors.length) {
        this.bulkUploadErrors = result.errors;
        this.showToastMessage(`Uploaded ${result.success} rows; ${result.errors.length} rows failed.`, 'error');
      } else {
        this.showToastMessage(`Uploaded ${result.success} rows successfully.`, 'success');
      }
      this.bulkFile = null;
    } catch (err: any) {
      this.showToastMessage(`Bulk upload failed: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      this.isBulkUploading = false;
      this.cdr.markForCheck();
    }
  }

  private async processBulkRows(rows: any[]): Promise<{ success: number; errors: string[] }> {
    const summary = { success: 0, errors: [] as string[] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      try {
        await this.uploadCategoryRow(row);
        summary.success += 1;
      } catch (error: any) {
        summary.errors.push(`Row ${rowNumber}: ${error?.message || 'Failed to import row'}`);
      }
    }
    return summary;
  }

  private async uploadCategoryRow(row: any): Promise<void> {
    const name = getRowValue(row, ['Name', 'Category Name']);
    const code = getRowValue(row, ['Category Code', 'Code']);
    if (!name) throw new Error('Missing Name');
    if (!code) throw new Error('Missing Category Code');
    const payload: any = {
      name,
      categoryCode: code,
      description: getRowValue(row, ['Description']),
      storeId: this.selectedBulkStoreId,
      isActive: parseBulkBoolean(row, ['Active', 'Is Active'], true),
    };
    await firstValueFrom(this.apiService.createCategory(payload));
  }
}
