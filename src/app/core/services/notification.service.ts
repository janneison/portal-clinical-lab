import { Injectable, signal } from '@angular/core';
import { NotificationConfig } from '../models/notification.model';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration ?? 4000 };
    this._toasts.update((list) => [...list, newToast]);

    setTimeout(() => this.dismiss(id), newToast.duration);
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  warning(title: string, message?: string): void {
    this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /**
   * Simulates sending a patient notification (email/SMS).
   * In production this would call a backend notifications endpoint.
   */
  sendPatientNotification(
    config: NotificationConfig,
    patientName: string,
    orderId: string
  ): void {
    if (config.emailEnabled && config.email) {
      console.log(
        `[Notification] Email enviado a ${config.email} — Resultados de orden ${orderId} disponibles para ${patientName}`
      );
      this.info(
        'Notificación enviada',
        `Email enviado a ${config.email}`
      );
    }

    if (config.smsEnabled && config.phone) {
      console.log(
        `[Notification] SMS enviado a ${config.phone} — Resultados de orden ${orderId} disponibles`
      );
      this.info(
        'Notificación enviada',
        `SMS enviado a ${config.phone}`
      );
    }
  }
}
