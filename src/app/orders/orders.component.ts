import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
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
    this.loadOrders();
  }

  loadOrders(): void {
    this.apiService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading orders', 'error');
      }
    });
  }

  openAddModal(): void {
    this.selectedOrder = {};
    this.isEditMode = false;
  }

  editOrder(order: any): void {
    this.selectedOrder = { ...order };
    this.isEditMode = true;
  }

  saveOrder(): void {
    this.apiService.updateOrder(this.selectedOrder._id, this.selectedOrder).subscribe({
      next: () => {
        this.loadOrders();
        this.closeModal();
        this.showToastMessage('Order updated successfully', 'success');
      },
      error: () => {
        this.showToastMessage('Error updating order', 'error');
      }
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
    // Optionally hide modal if needed
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'confirmed': return 'bg-info';
      case 'shipped': return 'bg-primary';
      case 'delivered': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}