import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 p-4 rounded-lg border text-sm transition-all duration-300"
          [class]="toastClass(toast)"
        >
          <span class="text-lg leading-none mt-0.5">{{ toastIcon(toast) }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="mt-0.5 opacity-80">{{ toast.message }}</p>
            }
          </div>
          <button
            (click)="notificationService.dismiss(toast.id)"
            class="text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);

  toastClass(toast: ToastMessage): string {
    const map: Record<string, string> = {
      success: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
      info: 'bg-blue-50 border-blue-200 text-blue-700',
    };
    return map[toast.type] ?? map['info'];
  }

  toastIcon(toast: ToastMessage): string {
    const map: Record<string, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return map[toast.type] ?? 'ℹ️';
  }
}
