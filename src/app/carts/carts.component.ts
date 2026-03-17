import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-carts',
  imports: [CommonModule, FormsModule],
  templateUrl: './carts.component.html',
  styleUrls: ['./carts.component.scss']
})
export class CartsComponent implements OnInit {
  carts: any[] = [];
  stores: any[] = [];
  users: any[] = [];
  products: any[] = [];

  storeFilterId = '';

  selectedCart: any = {};
  isEditMode = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadCarts();
  }

  loadLookups(): void {
    this.apiService.getStores().subscribe({
      next: (data) => {
        this.stores = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading stores', err),
    });

    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading users', err),
    });

    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading products', err),
    });
  }

  loadCarts(): void {
    const req = this.storeFilterId?.trim()
      ? this.apiService.getCartsByStore(this.storeFilterId.trim())
      : this.apiService.getCarts();

    req.subscribe({
      next: (data) => {
        const rows = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.carts)
            ? (data as any).carts
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : [];
        this.carts = rows;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading carts', err);
      }
    });
  }

  openAddModal(): void {
    this.selectedCart = {
      storeId: this.storeFilterId?.trim() || '',
      userId: '',
      productId: '',
      addressId: '',
      quantity: 1,
    };
    this.isEditMode = false;
  }

  editCart(cart: any): void {
    this.selectedCart = { ...cart };
    this.isEditMode = true;
  }

  saveCart(): void {
    const payload = {
      storeId: String(this.selectedCart.storeId || '').trim(),
      userId: String(this.selectedCart.userId || '').trim(),
      productId: String(this.selectedCart.productId || '').trim(),
      addressId: this.selectedCart.addressId ? String(this.selectedCart.addressId).trim() : undefined,
      quantity: Number(this.selectedCart.quantity || 0),
    };

    if (!payload.storeId || !payload.userId || !payload.productId || !payload.quantity) {
      alert('Store, User, Product and Quantity are required.');
      return;
    }

    if (this.isEditMode) {
      this.apiService.updateCart(this.selectedCart._id, payload).subscribe({
        next: () => {
          this.loadCarts();
          this.closeModal();
        },
        error: (err) => console.error('Error updating cart', err),
      });
      return;
    }

    this.apiService.createCart(payload).subscribe({
      next: () => {
        this.loadCarts();
        this.closeModal();
      },
      error: (err) => console.error('Error creating cart', err),
    });
  }

  deleteCart(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteCart(id).subscribe(() => {
        this.loadCarts();
      });
    }
  }

  closeModal(): void {
    this.selectedCart = {};
    this.isEditMode = false;
    const el = document.getElementById('cartModal');
    if (el) {
      (window as any).bootstrap?.Modal?.getInstance(el)?.hide();
    }
  }

  storeName(id: string): string {
    return this.stores.find((s) => s?._id === id)?.name || id;
  }

  userName(id: string): string {
    return this.users.find((u) => u?._id === id)?.name || id;
  }

  productName(id: string): string {
    return this.products.find((p) => p?._id === id)?.name || id;
  }
}
