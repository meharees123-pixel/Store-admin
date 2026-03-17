import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

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

  storeFilterId = '';
  selectedProduct: any = {};
  selectedImageFile: File | null = null;
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

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
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading subcategories', err),
    });
  }

  onStoreFilterChange(storeId: string): void {
    this.storeFilterId = String(storeId || '').trim();
    this.loadProducts();
  }

  openAddModal(): void {
    this.selectedProduct = {
      storeId: this.storeFilterId?.trim() || '',
      categoryId: '',
      subcategoryId: '',
      quantity: 0,
      isActive: true,
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
    this.selectedProduct = { ...product, storeId, categoryId: String(product?.categoryId || '').trim(), subcategoryId: String(product?.subcategoryId || '').trim() };
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
}
