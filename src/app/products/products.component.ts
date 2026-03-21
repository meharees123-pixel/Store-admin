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
  parseBulkNumber,
  readExcelFile,
  triggerDownload,
} from '../services/bulk-upload.utils';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  stores: any[] = [];
  private storeById = new Map<string, any>();
  private categoryCodeMap = new Map<string, any>();
  private subcategoryCodeMap = new Map<string, any>();

  storeFilterId = '';
  selectedProduct: any = {};
  selectedImageFile: File | null = null;
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'
  bulkFile: File | null = null;
  isBulkUploading = false;
  bulkUploadErrors: string[] = [];
  selectedBulkStoreId = '';

  @ViewChild('productModal') modal!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    console.log('Showing toast:', message, type);
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      console.log('Hiding toast');
      this.showToast = false;
    }, 5000);
  }

  ngOnInit(): void {
    console.log('ProductsComponent ngOnInit');
    this.loadStores();
    this.loadProducts();
  }

  loadProducts(): void {
    console.log('Loading products');
    const req = this.storeFilterId?.trim()
      ? this.apiService.getProductsByStore(this.storeFilterId.trim())
      : this.apiService.getProducts();

    req.subscribe({
      next: (data) => {
        this.products = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading products', err);
      }
    });
  }

  loadStores(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = Array.isArray(data) ? data : [];
        this.storeById = new Map(this.stores.map((s) => [String(s?._id), s]));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading stores', err);
      }
    });
  }

  loadCategoriesByStore(storeId: string): void {
    const id = String(storeId || '').trim();
    if (!id) {
      this.categories = [];
      this.cdr.markForCheck();
      return;
    }

    this.apiService.getCategoriesByStore(id).subscribe({
      next: (data) => {
        this.categories = Array.isArray(data) ? data : [];
        this.buildCategoryCodeMap();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading categories', err),
    });
  }

  loadSubcategoriesByStore(storeId: string): void {
    const id = String(storeId || '').trim();
    if (!id) {
      this.subcategories = [];
      this.cdr.markForCheck();
      return;
    }

    this.apiService.getSubcategoriesByStore(id).subscribe({
      next: (data) => {
        this.subcategories = Array.isArray(data) ? data : [];
        this.buildSubcategoryCodeMap();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading subcategories', err),
    });
  }

  onStoreFilterChange(storeId: string): void {
    this.storeFilterId = String(storeId || '').trim();
    if (this.storeFilterId && !this.selectedBulkStoreId) {
      this.selectedBulkStoreId = this.storeFilterId;
    }
    this.loadProducts();
  }

  onBulkStoreChange(storeId: string): void {
    this.selectedBulkStoreId = String(storeId || '').trim();
    if (this.selectedBulkStoreId) {
      this.loadCategoriesByStore(this.selectedBulkStoreId);
      this.loadSubcategoriesByStore(this.selectedBulkStoreId);
    } else {
      this.categoryCodeMap.clear();
      this.subcategoryCodeMap.clear();
    }
  }

  openAddModal(): void {
    this.selectedProduct = {
      storeId: this.storeFilterId?.trim() || '',
      categoryId: '',
      subcategoryId: '',
      quantity: 0,
      isActive: true,
      mrp: undefined,
    };
    this.selectedImageFile = null;
    this.isEditMode = false;

    if (this.selectedProduct.storeId) {
      this.loadCategoriesByStore(this.selectedProduct.storeId);
      this.loadSubcategoriesByStore(this.selectedProduct.storeId);
    } else {
      this.categories = [];
      this.subcategories = [];
    }
  }

  editProduct(product: any): void {
    const storeId = String(product?.storeId || '').trim();
    this.selectedProduct = {
      ...product,
      storeId,
      categoryId: String(product?.categoryId || '').trim(),
      subcategoryId: String(product?.subcategoryId || '').trim(),
      mrp: product?.mrp ?? undefined,
    };
    this.selectedImageFile = null;
    this.isEditMode = true;

    if (storeId) {
      this.loadCategoriesByStore(storeId);
      this.loadSubcategoriesByStore(storeId);
    }
  }

  onModalStoreChange(storeId: string): void {
    const id = String(storeId || '').trim();
    this.selectedProduct.storeId = id;
    this.selectedProduct.categoryId = '';
    this.selectedProduct.subcategoryId = '';
    this.loadCategoriesByStore(id);
    this.loadSubcategoriesByStore(id);
  }

  onModalCategoryChange(categoryId: string): void {
    this.selectedProduct.categoryId = String(categoryId || '').trim();
    this.selectedProduct.subcategoryId = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedImageFile = file;
  }

  saveProduct(): void {
    const payload: any = {
      ...this.selectedProduct,
      storeId: String(this.selectedProduct.storeId || '').trim(),
      categoryId: String(this.selectedProduct.categoryId || '').trim(),
      subcategoryId: this.selectedProduct.subcategoryId ? String(this.selectedProduct.subcategoryId).trim() : undefined,
      quantity: Number(this.selectedProduct.quantity || 0),
      price: Number(this.selectedProduct.price || 0),
      name: String(this.selectedProduct.name || '').trim(),
      description: this.selectedProduct.description ? String(this.selectedProduct.description).trim() : undefined,
      mrp: this.selectedProduct.mrp !== undefined && this.selectedProduct.mrp !== null ? Number(this.selectedProduct.mrp) : undefined,
    };

    if (!payload.storeId || !payload.categoryId || !payload.name) {
      this.showToastMessage('Store, Category and Name are required', 'error');
      return;
    }

    if (this.isEditMode) {
      this.apiService.updateProduct(this.selectedProduct._id, payload).subscribe({
        next: (updated) => {
          if (this.selectedImageFile) {
            this.apiService.uploadProductImage(updated?._id || this.selectedProduct._id, this.selectedImageFile, true).subscribe({
              next: () => {
                this.loadProducts();
                this.closeModal();
              },
              error: () => {
                this.showToastMessage('Error uploading product image', 'error');
              }
            });
            return;
          }

          this.loadProducts();
          this.closeModal();
        },
        error: () => {
          this.showToastMessage('Error updating product', 'error');
        }
      });
    } else {
      this.apiService.createProduct(payload).subscribe({
        next: (created) => {
          const createdId = created?._id;
          if (createdId && this.selectedImageFile) {
            this.apiService.uploadProductImage(createdId, this.selectedImageFile, false).subscribe({
              next: () => {
                this.loadProducts();
                this.closeModal();
              },
              error: () => {
                this.showToastMessage('Error uploading product image', 'error');
              }
            });
            return;
          }

          this.loadProducts();
          this.closeModal();
        },
        error: () => {
          this.showToastMessage('Error creating product', 'error');
        }
      });
    }
  }

  deleteSelectedProductImage(): void {
    const id = this.selectedProduct?._id;
    if (!id) return;
    if (!confirm('Delete product image?')) return;

    this.apiService.deleteProductImage(id).subscribe({
      next: () => {
        this.selectedProduct.productImage = undefined;
        this.selectedImageFile = null;
        this.loadProducts();
      },
      error: () => this.showToastMessage('Error deleting product image', 'error'),
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteProduct(id).subscribe({
        next: () => {
          this.showToastMessage('Product deleted successfully');
          this.loadProducts();
        },
        error: (err) => {
          this.showToastMessage('Error deleting product', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedProduct = {};
    this.selectedImageFile = null;
    if (this.modal) {
      (window as any).bootstrap.Modal.getInstance(this.modal.nativeElement)?.hide();
    }
  }

  storeName(id: string): string {
    const sid = String(id || '').trim();
    return this.storeById.get(sid)?.name || sid;
  }

  visibleSubcategoriesForModal(): any[] {
    const storeId = String(this.selectedProduct?.storeId || '').trim();
    const categoryId = String(this.selectedProduct?.categoryId || '').trim();
    if (!storeId) return [];

    const scoped = this.subcategories.filter((s) => {
      const catId = typeof s?.categoryId === 'object' ? String(s?.categoryId?._id || '') : String(s?.categoryId || '');
      return !categoryId ? true : catId === categoryId;
    });

    return scoped;
  }

  private buildCategoryCodeMap(): void {
    this.categoryCodeMap.clear();
    for (const category of this.categories) {
      const code = normalizeBulkCode(category?.categoryCode);
      if (!code) continue;
      this.categoryCodeMap.set(code, category);
    }
  }

  private buildSubcategoryCodeMap(): void {
    this.subcategoryCodeMap.clear();
    for (const subcategory of this.subcategories) {
      const code = normalizeBulkCode(subcategory?.subcategoryCode);
      if (!code) continue;
      this.subcategoryCodeMap.set(code, subcategory);
    }
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bulkFile = input.files?.[0] || null;
  }

  downloadSampleTemplate(): void {
    if (!this.selectedBulkStoreId) {
      this.showToastMessage('Select a store before downloading a template.', 'error');
      return;
    }

    const template: BulkTemplate = {
      headers: ['Name', 'Category Code', 'Subcategory Code', 'Description', 'Price', 'MRP', 'Quantity', 'Active'],
      row: ['Gold Apple', 'FRUITS', 'APPLE', 'Premium apples', 12.5, 15.0, 100, 'true'],
    };
    const buffer = buildTemplateWorkbook(template);
    triggerDownload('product-template.xlsx', buffer);
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
        this.showToastMessage(`Imported ${result.success} rows (${result.errors.length} errors).`, 'error');
      } else {
        this.showToastMessage(`Imported ${result.success} rows successfully.`, 'success');
      }
      this.bulkFile = null;
      this.loadProducts();
    } catch (error: any) {
      this.showToastMessage(`Bulk upload failed: ${error?.message || 'Unknown error'}`, 'error');
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
        await this.uploadProductRow(row);
        summary.success += 1;
      } catch (err: any) {
        summary.errors.push(`Row ${rowNumber}: ${err?.message || 'Failed to import row'}`);
      }
    }
    return summary;
  }

  private async uploadProductRow(row: any): Promise<void> {
    const name = getRowValue(row, ['Name', 'Product Name']);
    const categoryCode = getRowValue(row, ['Category Code', 'Category']);
    const price = parseBulkNumber(row, ['Price', 'MRP']);
    const quantity = parseBulkNumber(row, ['Quantity', 'Stock']);
    const mrp = parseBulkNumber(row, ['MRP']);

    if (!name) throw new Error('Missing Name');
    if (!categoryCode) throw new Error('Missing Category Code');
    if (price === null) throw new Error('Invalid Price');
    if (quantity === null) throw new Error('Invalid Quantity');

    const category = this.findCategoryByCode(categoryCode, this.selectedBulkStoreId);
    if (!category) throw new Error(`Category not found for code ${categoryCode}`);

    const payload: any = {
      name,
      description: getRowValue(row, ['Description']),
      price,
      quantity,
      categoryId: category._id,
      storeId: category.storeId || this.selectedBulkStoreId,
      isActive: parseBulkBoolean(row, ['Active', 'Is Active'], true),
    };

    if (mrp !== null) {
      payload.mrp = mrp;
    }

    const subcategoryCode = getRowValue(row, ['Subcategory Code', 'Sub Category']);
    if (subcategoryCode) {
      const subcategory = this.findSubcategoryByCode(subcategoryCode, this.selectedBulkStoreId);
      if (!subcategory) throw new Error(`Subcategory not found for code ${subcategoryCode}`);
      payload.subcategoryId = subcategory._id;
    }

    await firstValueFrom(this.apiService.createProduct(payload));
  }

  private findCategoryByCode(code: string, storeId: string): any | undefined {
    if (!storeId) return undefined;
    return this.categoryCodeMap.get(normalizeBulkCode(code));
  }

  private findSubcategoryByCode(code: string, storeId: string): any | undefined {
    if (!storeId) return undefined;
    return this.subcategoryCodeMap.get(normalizeBulkCode(code));
  }
}
