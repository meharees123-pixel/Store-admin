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
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    console.log('Loading products');
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading products', err);
      }
    });
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  openAddModal(): void {
    this.selectedProduct = { quantity: 0, categoryId: '', isActive: true };
    this.selectedImageFile = null;
    this.isEditMode = false;
  }

  editProduct(product: any): void {
    this.selectedProduct = { ...product };
    this.selectedImageFile = null;
    this.isEditMode = true;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedImageFile = file;
  }

  saveProduct(): void {
    if (this.isEditMode) {
      this.apiService.updateProduct(this.selectedProduct._id, this.selectedProduct).subscribe({
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
      this.apiService.createProduct(this.selectedProduct).subscribe({
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
}
