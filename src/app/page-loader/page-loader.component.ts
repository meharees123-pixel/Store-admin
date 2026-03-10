import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-page-loader',
  imports: [CommonModule],
  template: `
    <div *ngIf="loader.loading()" class="page-loader-backdrop">
      <div class="page-loader-card">
        <div class="spinner-border text-primary" role="status" aria-label="Loading"></div>
        <div class="ms-3">Loading…</div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-loader-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.7);
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .page-loader-card {
        display: flex;
        align-items: center;
        padding: 14px 18px;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        font-weight: 500;
      }
    `,
  ],
})
export class PageLoaderComponent {
  readonly loader = inject(LoaderService);
}

