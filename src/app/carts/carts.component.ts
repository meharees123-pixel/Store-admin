import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-carts',
  imports: [CommonModule],
  templateUrl: './carts.component.html',
  styleUrls: ['./carts.component.scss']
})
export class CartsComponent implements OnInit {
  carts: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCarts();
  }

  loadCarts(): void {
    this.apiService.getCarts().subscribe({
      next: (data) => {
        this.carts = data;
      },
      error: (err) => {
        console.error('Error loading carts', err);
      }
    });
  }

  deleteCart(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteCart(id).subscribe(() => {
        this.loadCarts();
      });
    }
  }
}