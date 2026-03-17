import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  stores: any[] = [];
  users: any[] = [];
  userAddresses: any[] = [];
  deliveryLocations: any[] = [];
  categories: any[] = [];
  products: any[] = [];
  expandedOrderId = '';
  private productById = new Map<string, any>();
  private addressById = new Map<string, any>();
  private locationById = new Map<string, any>();
  private categoryById = new Map<string, any>();

  // Item editor state (edit mode)
  editableItems: Array<{ productId: string; quantity: number; remove?: boolean; isNew?: boolean }> = [];
  private originalQtyByProductId = new Map<string, number>();
  addProductId = '';
  addQuantity = 1;

  storeFilterId = '';
  selectedOrder: any = {};
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('orderModal') modal!: ElementRef;

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
    this.loadLookups();
    this.loadOrders();
  }

  loadLookups(): void {
    this.apiService.getStores().subscribe({
      next: (data) => (this.stores = data || []),
      error: (err) => console.error('Error loading stores', err),
    });

    this.apiService.getUsers().subscribe({
      next: (data) => (this.users = data || []),
      error: (err) => console.error('Error loading users', err),
    });

    this.apiService.getUserAddresses().subscribe({
      next: (data) => {
        this.userAddresses = data || [];
        this.addressById = new Map(this.userAddresses.map((a: any) => [String(a?._id), a]));
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading addresses', err),
    });

    this.apiService.getDeliveryLocations().subscribe({
      next: (data) => {
        this.deliveryLocations = data || [];
        this.locationById = new Map(this.deliveryLocations.map((l: any) => [String(l?._id), l]));
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading delivery locations', err),
    });
  }

  loadOrders(): void {
    const req = this.storeFilterId?.trim()
      ? this.apiService.getOrdersByStore(this.storeFilterId.trim())
      : this.apiService.getOrders();

    req.subscribe({
      next: (data) => {
        this.orders = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading orders', 'error');
      }
    });
  }

  openAddModal(): void {
    this.selectedOrder = {
      storeId: this.storeFilterId?.trim() || '',
      userId: '',
      userAddressId: '',
      deliveryLocationId: '',
    };
    this.isEditMode = false;
    this.editableItems = [];
    this.originalQtyByProductId.clear();
  }

  editOrder(order: any): void {
    this.selectedOrder = { ...order };
    this.isEditMode = true;
    this.ensureCatalogLoaded();
    this.initItemEditor(order);
    this.hydrateOrderProducts(order);
  }

  saveOrder(): void {
    if (this.isEditMode) {
      const payload: any = {
        status: this.selectedOrder.status,
        userAddressId: this.selectedOrder.userAddressId,
        deliveryLocationId: this.selectedOrder.deliveryLocationId,
      };

      try {
        const itemChanges = this.buildItemChanges();
        if (itemChanges.length) payload.items = itemChanges;
      } catch (e: any) {
        this.showToastMessage(String(e?.message || 'Invalid items update'), 'error');
        return;
      }

      this.apiService.updateOrder(this.selectedOrder._id, payload).subscribe({
        next: () => {
          this.loadOrders();
          this.closeModal();
          this.showToastMessage('Order updated successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error updating order', 'error');
        }
      });
      return;
    }

    const createPayload = {
      userId: String(this.selectedOrder.userId || '').trim(),
      userAddressId: String(this.selectedOrder.userAddressId || '').trim(),
      storeId: String(this.selectedOrder.storeId || '').trim(),
      deliveryLocationId: String(this.selectedOrder.deliveryLocationId || '').trim() || undefined,
    };

    if (!createPayload.userId || !createPayload.userAddressId || !createPayload.storeId) {
      this.showToastMessage('User, Address and Store are required', 'error');
      return;
    }

    this.apiService.createOrder(createPayload).subscribe({
      next: () => {
        this.loadOrders();
        this.closeModal();
        this.showToastMessage('Order created successfully', 'success');
      },
      error: () => {
        this.showToastMessage('Error creating order', 'error');
      },
    });
  }

  deleteOrder(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteOrder(id).subscribe({
        next: () => {
          this.loadOrders();
          this.showToastMessage('Order deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting order', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedOrder = {};
    this.isEditMode = false;
    this.editableItems = [];
    this.originalQtyByProductId.clear();
    this.addProductId = '';
    this.addQuantity = 1;
    if (this.modal) {
      (window as any).bootstrap?.Modal?.getInstance(this.modal.nativeElement)?.hide();
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Confirmed': return 'bg-info';
      case 'Dispatched': return 'bg-primary';
      case 'Delivered': return 'bg-success';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  storeName(id: string): string {
    return this.stores.find((s) => s?._id === id)?.name || id;
  }

  userLabel(id: string): string {
    const u = this.users.find((x) => x?._id === id);
    return u?.name || u?.mobileNumber || id;
  }

  addressLabel(order: any): string {
    const id = String(order?.userAddressId || '').trim();
    const a = id ? this.addressById.get(id) : null;
    if (!a) return id || '—';
    return this.formatAddress(a) || a._id || '—';
  }

  formatAddress(address: any): string {
    if (!address) return '';

    const street = String(address?.street || '').trim();
    const city = String(address?.city || '').trim();
    const state = String(address?.state || '').trim();
    const country = String(address?.country || '').trim();

    const parts = [street, city, state, country].filter(Boolean);
    return parts.join(', ');
  }

  deliveryLocationLabel(order: any): string {
    const id = String(order?.deliveryLocationId || '').trim();
    const l = id ? this.locationById.get(id) : null;
    if (!l) return id || '—';
    return l.name || l.address || l._id || '—';
  }

  toggleOrderDetails(order: any): void {
    const id = String(order?._id || '').trim();
    if (!id) return;

    this.expandedOrderId = this.expandedOrderId === id ? '' : id;
    if (this.expandedOrderId) this.hydrateOrderProducts(order);
  }

  orderLabel(order: any): string {
    const id = String(order?._id || '').trim();
    return id ? `#${id.slice(-6)}` : '—';
  }

  productNameForItem(item: any): string {
    const pid = String(item?.productId || '').trim();
    if (!pid) return '—';
    return this.productById.get(pid)?.name || this.products.find((p) => String(p?._id) === pid)?.name || pid;
  }

  productImageForItem(item: any): string {
    const pid = String(item?.productId || '').trim();
    if (!pid) return '';
    return String(this.productById.get(pid)?.productImage || this.products.find((p) => String(p?._id) === pid)?.productImage || '').trim();
  }

  itemUnitPrice(item: any): number | null {
    const direct = item?.unitPrice;
    if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Number(direct);

    const pid = String(item?.productId || '').trim();
    if (!pid) return null;
    const fromProduct = this.productById.get(pid)?.price ?? this.products.find((p) => String(p?._id) === pid)?.price;
    if (fromProduct !== undefined && fromProduct !== null && Number.isFinite(Number(fromProduct))) return Number(fromProduct);

    return null;
  }

  itemTotalPrice(item: any): number | null {
    const direct = item?.totalPrice;
    if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Number(direct);

    const qty = Number(item?.quantity || 0);
    const unit = this.itemUnitPrice(item) ?? 0;
    const total = qty * unit;
    return Number.isFinite(total) && total > 0 ? total : null;
  }

  productStock(productId: string): number | null {
    const pid = String(productId || '').trim();
    if (!pid) return null;
    const p = this.productById.get(pid) || this.products.find((x) => String(x?._id) === pid);
    const q = p?.quantity;
    return q !== undefined && q !== null && Number.isFinite(Number(q)) ? Number(q) : null;
  }

  maxAllowedQty(productId: string): number | null {
    const pid = String(productId || '').trim();
    if (!pid) return null;
    const stock = this.productStock(pid);
    if (stock === null) return null;
    const original = this.originalQtyByProductId.get(pid) || 0;
    return original ? original + stock : stock;
  }

  productsForSelectedOrderStore(): any[] {
    const storeId = String(this.selectedOrder?.storeId || '').trim();
    if (!storeId || !this.categories.length) return this.products;

    return this.products.filter((p) => {
      const categoryId = String(p?.categoryId || '').trim();
      const category = categoryId ? this.categoryById.get(categoryId) : null;
      const catStoreId = category ? String(category?.storeId || '').trim() : '';
      return !!catStoreId && catStoreId === storeId;
    });
  }

  addItemToEditor(): void {
    const productId = String(this.addProductId || '').trim();
    const qty = Number(this.addQuantity || 0);
    if (!productId || !Number.isFinite(qty) || qty < 1) return;

    const stock = this.productStock(productId);
    if (stock !== null && qty > stock) {
      alert(`Insufficient stock. Available: ${stock}`);
      return;
    }

    const existing = this.editableItems.find((x) => x.productId === productId);
    if (existing) {
      existing.remove = false;
      existing.quantity = qty;
      this.cdr.markForCheck();
      return;
    }

    this.editableItems.push({ productId, quantity: qty, isNew: true });
    this.addProductId = '';
    this.addQuantity = 1;
    this.cdr.markForCheck();
  }

  toggleRemove(item: { productId: string; quantity: number; remove?: boolean; isNew?: boolean }): void {
    if (item.isNew) {
      this.editableItems = this.editableItems.filter((x) => x !== item);
      this.cdr.markForCheck();
      return;
    }
    item.remove = !item.remove;
    this.cdr.markForCheck();
  }

  private initItemEditor(order: any): void {
    const items: any[] = Array.isArray(order?.items) ? order.items : [];
    this.originalQtyByProductId.clear();
    this.editableItems = items
      .map((i: any) => {
        const pid = String(i?.productId || '').trim();
        const qty = Number(i?.quantity || 0);
        if (!pid || !Number.isFinite(qty) || qty < 1) return null;
        this.originalQtyByProductId.set(pid, qty);
        return { productId: pid, quantity: qty };
      })
      .filter(Boolean) as any;
  }

  private buildItemChanges(): Array<{ productId: string; quantity?: number; remove?: boolean }> {
    const changes: Array<{ productId: string; quantity?: number; remove?: boolean }> = [];

    for (const row of this.editableItems) {
      const pid = String(row.productId || '').trim();
      if (!pid) continue;

      if (row.remove) {
        changes.push({ productId: pid, remove: true });
        continue;
      }

      const nextQty = Number(row.quantity || 0);
      if (!Number.isFinite(nextQty) || nextQty < 1) continue;

      const original = this.originalQtyByProductId.get(pid);
      if (original === undefined) {
        changes.push({ productId: pid, quantity: nextQty });
        continue;
      }

      if (nextQty !== original) {
        const max = this.maxAllowedQty(pid);
        if (max !== null && nextQty > max) {
          throw new Error(`Insufficient stock. Max allowed for ${this.productNameForItem({ productId: pid })}: ${max}`);
        }
        changes.push({ productId: pid, quantity: nextQty });
      }
    }

    return changes;
  }

  private ensureCatalogLoaded(): void {
    if (this.products.length && this.categories.length) return;

    forkJoin({
      products: this.apiService.getProducts().pipe(catchError(() => of([]))),
      categories: this.apiService.getCategories().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (res) => {
        this.products = Array.isArray(res.products) ? res.products : [];
        this.categories = Array.isArray(res.categories) ? res.categories : [];
        this.categoryById = new Map(this.categories.map((c: any) => [String(c?._id), c]));
        for (const p of this.products) {
          const id = String(p?._id || '').trim();
          if (id) this.productById.set(id, p);
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  private hydrateOrderProducts(order: any): void {
    const items: any[] = Array.isArray(order?.items) ? order.items : [];
    const missing: string[] = items
      .map((i: any) => String(i?.productId ?? '').trim())
      .filter((pid) => !!pid && !this.productById.has(pid));

    const unique: string[] = [...new Set(missing)].slice(0, 50);
    if (!unique.length) return;

    const obs = unique.map((pid: string) =>
      this.apiService.getProduct(pid).pipe(
        catchError(() => of(null)),
        map((p) => ({ pid, p } as const)),
      ),
    );

    forkJoin(obs).subscribe({
      next: (rows) => {
        for (const r of rows) {
          if (r?.p) this.productById.set(r.pid, r.p);
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }
}
