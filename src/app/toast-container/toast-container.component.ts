import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService, AppToast } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, NgbToastModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1200">
      <ngb-toast
        *ngFor="let toast of toasts()"
        [autohide]="true"
        [delay]="toast.delay"
        [class]="toastClass(toast)"
        (hidden)="remove(toast)"
      >
        {{ toast.message }}
      </ngb-toast>
    </div>
  `,
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  readonly toasts = computed(() => this.toastService.toasts());

  toastClass(toast: AppToast): string {
    if (toast.type === 'success') return 'bg-success text-white';
    if (toast.type === 'error') return 'bg-danger text-white';
    return 'bg-dark text-white';
  }

  remove(toast: AppToast): void {
    this.toastService.remove(toast);
  }
}
