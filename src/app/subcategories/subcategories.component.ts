import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-subcategories',
  imports: [CommonModule, FormsModule],
  templateUrl: './subcategories.component.html',
  styleUrls: ['./subcategories.component.scss']
})
export class SubcategoriesComponent implements OnInit {
  subcategories: any[] = [];
  categories: any[] = [];
  stores: any[] = [];
  private storeById = new Map<string, any>();
  selectedStoreId = '';
  selectedBulkStoreId = '';
  private categoryCodeMap = new Map<string, any>();
  selectedSubcategory: any = {};
  selectedImageFile: File | null = null;
  isEditMode = false;
  bulkFile: File | null = null;
  isBulkUploading = false;
  bulkUploadErrors: string[] = [];

  constructor(
    private apiService: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadStores();
    this.loadSubcategories();
  }

  loadSubcategories(): void {
    const obs = this.selectedStoreId
      ? this.apiService.getSubcategoriesByStore(this.selectedStoreId)
      : this.apiService.getSubcategories();

    obs.subscribe({
      next: (data) => {
        this.subcategories = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading subcategories', err);
      }
    });
  }

  loadCategories(): void {
    if (!this.selectedStoreId) {
      this.categories = [];
      this.cdr.markForCheck();
      return;
    }

    this.apiService.getCategoriesByStore(this.selectedStoreId).subscribe({
      next: (data) => {
        this.categories = Array.isArray(data) ? data : [];
        this.buildCategoryCodeMap();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  loadStores(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = data ?? [];
        this.storeById = new Map(this.stores.map((s) => [String(s?._id), s]));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading stores', err);
      }
    });
  }

  onStoreFilterChange(storeId: string): void {
    const normalized = this.toId(storeId);
    this.selectedStoreId = normalized;
    if (!this.selectedBulkStoreId) {
      this.selectedBulkStoreId = normalized;
    }
    this.loadCategories();
    this.loadSubcategories();
  }

  onBulkStoreChange(storeId: string): void {
    const normalized = this.toId(storeId);
    this.selectedBulkStoreId = normalized;
    this.onStoreFilterChange(normalized);
  }

  openAddModal(): void {
    this.selectedSubcategory = {
      name: '',
      description: '',
      subcategoryCode: '',
      isActive: true,
      categoryId: '',
      storeId: this.selectedStoreId || '',
    };
    this.selectedImageFile = null;
    this.isEditMode = false;
  }

  editSubcategory(subcategory: any): void {
    const rowStoreId =
      this.toId(subcategory?.storeId) ||
      (typeof subcategory?.categoryId === 'object' ? this.toId(subcategory?.categoryId?.storeId) : '');
    if (rowStoreId && rowStoreId !== this.selectedStoreId) {
      this.selectedStoreId = rowStoreId;
      this.loadCategories();
      this.loadSubcategories();
    }

    const categoryId = this.toId(subcategory?.categoryId);
    this.selectedSubcategory = {
      ...subcategory,
      subcategoryCode: subcategory?.subcategoryCode ?? '',
      isActive: subcategory?.isActive ?? true,
      categoryId,
      storeId: rowStoreId || this.storeIdForCategoryId(categoryId) || this.toId(subcategory?.storeId),
    };
    this.selectedImageFile = null;
    this.isEditMode = true;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedImageFile = file;
  }

  onCategoryIdChange(categoryId: string): void {
    this.selectedSubcategory.storeId = this.storeIdForCategoryId(categoryId);
  }

  onModalStoreChange(storeId: string): void {
    const id = this.toId(storeId);
    this.selectedSubcategory.storeId = id;
    this.selectedSubcategory.categoryId = '';

    // Keep the page filter consistent with the modal store selection.
    if (id && id !== this.selectedStoreId) {
      this.selectedStoreId = id;
      this.loadCategories();
      this.loadSubcategories();
    }
  }

  saveSubcategory(): void {
    if (!this.selectedStoreId) return;
    const subcategoryToSave: any = { ...this.selectedSubcategory };
    const categoryId = this.toId(subcategoryToSave.categoryId);
    if (!categoryId) return;
    if (!String(subcategoryToSave?.name ?? '').trim()) return;
    if (!String(subcategoryToSave?.subcategoryCode ?? '').trim()) return;

    subcategoryToSave.categoryId = categoryId;
    // Store is derived from category on the API side; keep it for consistency/client validation.
    subcategoryToSave.storeId = this.toId(subcategoryToSave.storeId) || this.selectedStoreId;
    if (!subcategoryToSave.storeId) return;

    const categoryStoreId = this.storeIdForCategoryId(categoryId);
    if (categoryStoreId && subcategoryToSave.storeId !== categoryStoreId) {
      subcategoryToSave.storeId = categoryStoreId;
    }

    if (this.isEditMode) {
      this.apiService.updateSubcategory(subcategoryToSave._id, subcategoryToSave).subscribe({
        next: (updated) => {
          if (this.selectedImageFile) {
            this.apiService
              .uploadSubcategoryImage(updated?._id || subcategoryToSave._id, this.selectedImageFile, true)
              .subscribe({
                next: () => {
                  this.loadSubcategories();
                  this.ngZone.run(() => this.closeModal());
                },
                error: (err) => console.error('Error uploading subcategory image', err),
              });
            return;
          }

          this.loadSubcategories();
          this.ngZone.run(() => this.closeModal());
        },
        error: (err) => console.error('Error updating subcategory', err),
      });
      return;
    }

    this.apiService.createSubcategory(subcategoryToSave).subscribe({
      next: (created) => {
        const createdId = created?._id;
        if (createdId && this.selectedImageFile) {
          this.apiService.uploadSubcategoryImage(createdId, this.selectedImageFile, false).subscribe({
            next: () => {
              this.loadSubcategories();
              this.ngZone.run(() => this.closeModal());
            },
            error: (err) => console.error('Error uploading subcategory image', err),
          });
          return;
        }

        this.loadSubcategories();
        this.ngZone.run(() => this.closeModal());
      },
      error: (err) => console.error('Error creating subcategory', err),
    });
  }

  deleteSubcategory(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteSubcategory(id).subscribe(() => {
        this.loadSubcategories();
      });
    }
  }

  closeModal(): void {
    this.selectedSubcategory = {
      name: '',
      description: '',
      subcategoryCode: '',
      isActive: true,
      categoryId: '',
      storeId: '',
    };
    this.isEditMode = false;
    this.selectedImageFile = null;
    this.hideModal();
  }

  deleteSelectedSubcategoryImage(): void {
    const id = this.toId(this.selectedSubcategory?._id);
    if (!id) return;
    if (!confirm('Delete subcategory image?')) return;

    this.apiService.deleteSubcategoryImage(id).subscribe({
      next: () => {
        this.selectedSubcategory.subcategoryImage = undefined;
        this.selectedImageFile = null;
        this.loadSubcategories();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error deleting subcategory image', err),
    });
  }

  categoryNameForRow(subcategory: any): string {
    const category = subcategory?.categoryId;
    if (typeof category === 'object' && category) return category?.name || '—';

    const id = this.toId(category);
    if (!id) return '—';
    return this.categories.find((c) => this.toId(c?._id) === id)?.name || id;
  }

  storeIdForRow(subcategory: any): string {
    const direct = this.toId(subcategory?.storeId);
    if (direct) return direct;

    const category = subcategory?.categoryId;
    if (typeof category === 'object' && category) {
      const fromCategory = this.toId(category?.storeId);
      if (fromCategory) return fromCategory;
    }

    return this.storeIdForCategoryId(this.toId(category)) || '—';
  }

  storeNameForRow(subcategory: any): string {
    const storeId = this.storeIdForRow(subcategory);
    if (!storeId || storeId === '—') return '—';
    return this.storeById.get(String(storeId))?.name || storeId;
  }

  storeNameForSelected(): string {
    const storeId = this.toId(this.selectedSubcategory?.storeId);
    if (!storeId) return '';
    return this.storeById.get(storeId)?.name || storeId;
  }

  private storeIdForCategoryId(categoryId: string): string {
    const id = this.toId(categoryId);
    if (!id) return '';
    const category = this.categories.find((c) => this.toId(c?._id) === id);
    return this.toId(category?.storeId);
  }

  private buildCategoryCodeMap(): void {
    this.categoryCodeMap.clear();
    for (const category of this.categories) {
      const code = normalizeBulkCode(category?.categoryCode);
      if (!code) continue;
      this.categoryCodeMap.set(code, category);
    }
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bulkFile = input.files?.[0] || null;
  }

  async handleBulkUpload(): Promise<void> {
    const targetStoreId = this.selectedBulkStoreId || this.selectedStoreId;
    if (!targetStoreId) {
      this.showToastMessage('Select a store before uploading.', 'error');
      return;
    }
    if (!this.bulkFile) {
      this.showToastMessage('Please choose an Excel file.', 'error');
      return;
    }
    this.isBulkUploading = true;
    this.bulkUploadErrors = [];
    try {
      const rows = await readExcelFile(this.bulkFile);
      if (!rows.length) throw new Error('The file has no rows.');
      const result = await this.processBulkRows(rows, targetStoreId);
      if (result.errors.length) {
        this.bulkUploadErrors = result.errors;
      }
      this.showToastMessage(`Imported ${result.success} rows (${result.errors.length} errors).`, result.errors.length ? 'error' : 'success');
      this.loadSubcategories();
      this.bulkFile = null;
    } catch (error: any) {
      this.showToastMessage(`Bulk upload failed: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      this.isBulkUploading = false;
      this.cdr.markForCheck();
    }
  }

  private async processBulkRows(rows: any[], storeId: string): Promise<{ success: number; errors: string[] }> {
    const summary = { success: 0, errors: [] as string[] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      try {
        await this.uploadSubcategoryRow(row, storeId);
        summary.success += 1;
      } catch (err: any) {
        summary.errors.push(`Row ${rowNumber}: ${err?.message || 'Unable to import'}`);
      }
    }
    return summary;
  }

  private async uploadSubcategoryRow(row: any, storeId: string): Promise<void> {
    const name = getRowValue(row, ['Name', 'Subcategory Name']);
    const code = getRowValue(row, ['Subcategory Code', 'Code']);
    const categoryCode = getRowValue(row, ['Category Code', 'Category']);
    if (!name) throw new Error('Missing name');
    if (!code) throw new Error('Missing subcategory code');
    if (!categoryCode) throw new Error('Missing category code');
    const category = this.findCategoryByCode(categoryCode, storeId);
    if (!category) throw new Error(`Category ${categoryCode} not found`);
    const payload = {
      name,
      subcategoryCode: code,
      description: getRowValue(row, ['Description']),
      categoryId: category._id,
      storeId: category.storeId || storeId,
      isActive: parseBulkBoolean(row, ['Active', 'Is Active'], true),
    };
    await firstValueFrom(this.apiService.createSubcategory(payload));
  }

  downloadSampleTemplate(): void {
    const targetStoreId = this.selectedBulkStoreId || this.selectedStoreId;
    if (!targetStoreId) {
      this.showToastMessage('Select a store before downloading a template.', 'error');
      return;
    }

    const template: BulkTemplate = {
      headers: ['Name', 'Subcategory Code', 'Category Code', 'Description', 'Active'],
      row: ['Citrus', 'CITRUS', 'FRUITS', 'Citrus fruits and juices', 'true'],
    };
    const buffer = buildTemplateWorkbook(template);
    triggerDownload('subcategory-template.xlsx', buffer);
  }

  private findCategoryByCode(code: string, storeId: string): any | undefined {
    if (!storeId) return undefined;
    return this.categoryCodeMap.get(normalizeBulkCode(code));
  }

  private showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    if (type === 'error') {
      this.toastService.error(message);
      return;
    }
    this.toastService.success(message);
  }

  visibleCategoriesForModal(): any[] {
    const selectedCategoryId = this.toId(this.selectedSubcategory?.categoryId);
    const modalStoreId = this.toId(this.selectedSubcategory?.storeId) || this.selectedStoreId;

    const filtered = modalStoreId
      ? this.categories.filter((c) => this.toId(c?.storeId) === modalStoreId)
      : [...this.categories];

    if (!selectedCategoryId) return filtered;
    if (filtered.some((c) => this.toId(c?._id) === selectedCategoryId)) return filtered;

    const selectedCategory = this.categories.find((c) => this.toId(c?._id) === selectedCategoryId);
    return selectedCategory ? [selectedCategory, ...filtered] : filtered;
  }

  private toId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return String(value?._id ?? value?.id ?? '');
    return String(value);
  }

  private hideModal(): void {
    const modalElement = document.getElementById('subcategoryModal');
    if (modalElement && (window as any).bootstrap) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    }
  }
}
