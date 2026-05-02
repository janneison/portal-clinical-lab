import { Component, input } from '@angular/core';
import { OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="badgeClass()">
      {{ icon() }} {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<OrderStatus>();

  badgeClass(): string {
    const map: Record<OrderStatus, string> = {
      pending: 'badge-pending',
      sent: 'badge-sent',
      completed: 'badge-completed',
    };
    return map[this.status()] ?? 'badge';
  }

  label(): string {
    const map: Record<OrderStatus, string> = {
      pending: 'Pendiente',
      sent: 'Enviada',
      completed: 'Completada',
    };
    return map[this.status()] ?? this.status();
  }

  icon(): string {
    const map: Record<OrderStatus, string> = {
      pending: '🕐',
      sent: '📤',
      completed: '✅',
    };
    return map[this.status()] ?? '';
  }
}
