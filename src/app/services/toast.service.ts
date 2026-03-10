import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface AppToast {
  id: number;
  message: string;
  type: ToastType;
  delay: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<AppToast[]>([]);

  show(message: string, type: ToastType = 'info', delay = 4000): void {
    const toast: AppToast = { id: this.nextId++, message, type, delay };
    this.toasts.update((items) => [...items, toast]);
  }

  success(message: string, delay = 3000): void {
    this.show(message, 'success', delay);
  }

  error(message: string, delay = 5000): void {
    this.show(message, 'error', delay);
  }

  remove(toast: AppToast): void {
    this.toasts.update((items) => items.filter((t) => t.id !== toast.id));
  }
}

