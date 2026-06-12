import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { OrderListItem } from '../../core/models/order.model';
import { forkJoin } from 'rxjs';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Bienvenido, {{ authService.currentUser()?.username }} 👋
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ today | date:'EEEE, d MMMM yyyy':'':'es' }} — Panel de control
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats(); track stat.label) {
          <div class="card p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ stat.label }}
                </p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
              </div>
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                [class]="stat.color"
              >
                {{ stat.icon }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Recent orders -->
      <div class="card">
        <div class="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">Órdenes recientes</h2>
          <a routerLink="/dashboard/orders" class="btn-secondary btn-sm">
            Ver todas →
          </a>
        </div>

        @if (loading()) {
          <app-loading-spinner message="Cargando órdenes..." />
        } @else if (recentOrders().length === 0) {
          <div class="p-8 text-center text-gray-400">
            <p class="text-3xl mb-2">📋</p>
            <p class="text-sm">No hay órdenes registradas aún</p>
          </div>
        } @else {
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th>ID Solicitud</th>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Aliado</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (order of recentOrders(); track order.idSolicitudKey) {
                  <tr>
                    <td class="font-mono text-xs font-semibold text-blue-700">
                      {{ order.idSolicitudKey }}
                    </td>
                    <td>
                      <div>
                        <p class="font-medium text-gray-900">{{ order.nombreDelPaciente }}</p>
                        <p class="text-xs text-gray-400">{{ order.identificacion }}</p>
                      </div>
                    </td>
                    <td class="text-gray-500 text-xs">
                      {{ order.fechaDeLaOrden | date:'dd/MM/yyyy' }}
                    </td>
                    <td>
                      @if (order.idAliado) {
                        <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {{ order.idAliado }}
                        </span>
                      } @else {
                        <span class="text-xs text-gray-400">—</span>
                      }
                    </td>
                    <td>
                      <app-status-badge [status]="order.estadoDeLaOrden" />
                    </td>
                    <td>
                      <a
                        [routerLink]="['/dashboard/orders', order.idSolicitudKey]"
                        class="btn-ghost btn-sm"
                      >
                        Ver →
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a routerLink="/dashboard/orders" class="card-hover p-5 flex items-center gap-4 cursor-pointer">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
            📋
          </div>
          <div>
            <p class="font-semibold text-gray-900">Gestionar Órdenes</p>
            <p class="text-sm text-gray-500">Buscar, filtrar y ver órdenes</p>
          </div>
        </a>
        <a routerLink="/dashboard/results" class="card-hover p-5 flex items-center gap-4 cursor-pointer">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
            🔬
          </div>
          <div>
            <p class="font-semibold text-gray-900">Ver Resultados</p>
            <p class="text-sm text-gray-500">Resultados por paciente y examen</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);

  readonly today = new Date();
  readonly loading = signal(true);
  readonly recentOrders = signal<OrderListItem[]>([]);
  readonly stats = signal<StatCard[]>([
    { label: 'Total Órdenes', value: '…', icon: '📋', color: 'bg-blue-50' },
    { label: 'Pendientes',    value: '…', icon: '🕐', color: 'bg-yellow-50' },
    { label: 'Enviadas',      value: '…', icon: '📤', color: 'bg-blue-50' },
    { label: 'Completadas',   value: '…', icon: '✅', color: 'bg-green-50' },
  ]);

  ngOnInit(): void {
    // Load recent orders + stats in parallel
    forkJoin({
      all:       this.ordersService.getOrders({ limit: 10 }),
      pending:   this.ordersService.getOrders({ estado: 'pending',   limit: 1 }),
      sent:      this.ordersService.getOrders({ estado: 'sent',      limit: 1 }),
      completed: this.ordersService.getOrders({ estado: 'completed', limit: 1 }),
    }).subscribe({
      next: ({ all, pending, sent, completed }) => {
        this.recentOrders.set(all.data);
        this.stats.set([
          { label: 'Total Órdenes', value: all.pagination.total,       icon: '📋', color: 'bg-blue-50' },
          { label: 'Pendientes',    value: pending.pagination.total,   icon: '🕐', color: 'bg-yellow-50' },
          { label: 'Enviadas',      value: sent.pagination.total,      icon: '📤', color: 'bg-blue-50' },
          { label: 'Completadas',   value: completed.pagination.total, icon: '✅', color: 'bg-green-50' },
        ]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Error cargando órdenes:', err);
        this.loading.set(false);
      },
    });
  }
}
