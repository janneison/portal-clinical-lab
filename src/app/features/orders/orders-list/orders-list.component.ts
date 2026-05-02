import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OrdersService } from '../../../core/services/orders.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { OrderListItem, OrderFilters, OrdersPage } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Órdenes de Laboratorio</h1>
        <p class="text-gray-500 text-sm mt-1">Listado de órdenes con filtros</p>
      </div>

      <!-- Filters -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-700">🗂️ Filtros</h2>
          <button (click)="clearFilters()" class="btn-ghost btn-sm text-gray-500">
            Limpiar filtros
          </button>
        </div>
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="label">Desde</label>
              <input type="date" formControlName="fecha_desde" class="input" />
            </div>
            <div>
              <label class="label">Hasta</label>
              <input type="date" formControlName="fecha_hasta" class="input" />
            </div>
            <div>
              <label class="label">Código CUPS</label>
              <input
                type="text"
                formControlName="cups"
                class="input"
                placeholder="Ej: 903820"
              />
            </div>
            <div>
              <label class="label">Estado</label>
              <select formControlName="estado" class="input">
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="sent">Enviada</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              }
              Buscar
            </button>
          </div>
        </form>
        @if (filterError()) {
          <p class="text-sm text-red-600 mt-2">{{ filterError() }}</p>
        }
      </div>

      <!-- Results -->
      @if (loading()) {
        <app-loading-spinner message="Cargando órdenes..." />
      } @else if (page()) {
        <div class="card">
          <!-- Table header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-100">
            <p class="text-sm text-gray-500">
              {{ page()!.pagination.total }} orden(es) encontrada(s)
              · Página {{ page()!.pagination.page }} de {{ page()!.pagination.total_pages }}
            </p>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500">Por página:</label>
              <select
                class="input w-20 text-xs py-1"
                [value]="currentLimit()"
                (change)="changeLimit($event)"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          @if (page()!.data.length === 0) {
            <app-empty-state
              icon="📋"
              title="Sin resultados"
              description="No hay órdenes que coincidan con los filtros aplicados"
            />
          } @else {
            <div class="table-container rounded-none border-0">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID Solicitud</th>
                    <th>Paciente</th>
                    <th>Documento</th>
                    <th>Fecha Orden</th>
                    <th>Médico</th>
                    <th>Aliado</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of page()!.data; track order.idSolicitudKey) {
                    <tr>
                      <td class="font-mono text-xs font-semibold text-blue-700">
                        {{ order.idSolicitudKey }}
                      </td>
                      <td>
                        <div>
                          <p class="font-medium text-gray-900">{{ order.nombreDelPaciente }}</p>
                          <p class="text-xs text-gray-400">{{ order.centroDeSalud }}</p>
                        </div>
                      </td>
                      <td class="text-gray-500 text-xs">
                        {{ order.tipoDocumento }}: {{ order.identificacion }}
                      </td>
                      <td class="text-gray-500 text-xs">
                        {{ order.fechaDeLaOrden | date:'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td class="text-gray-600 text-xs">{{ order.medicoQueOrdena }}</td>
                      <td>
                        @if (order.idAliado) {
                          <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
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
                          class="btn-secondary btn-sm"
                        >
                          Ver →
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (page()!.pagination.total_pages > 1) {
              <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button
                  (click)="goToPage(page()!.pagination.page - 1)"
                  class="btn-secondary btn-sm"
                  [disabled]="page()!.pagination.page <= 1"
                >
                  ← Anterior
                </button>

                <div class="flex items-center gap-1">
                  @for (p of pageNumbers(); track p) {
                    <button
                      (click)="goToPage(p)"
                      class="w-8 h-8 rounded text-sm font-medium transition-colors"
                      [class.bg-blue-600]="p === page()!.pagination.page"
                      [class.text-white]="p === page()!.pagination.page"
                      [class.text-gray-600]="p !== page()!.pagination.page"
                      [class.hover:bg-gray-100]="p !== page()!.pagination.page"
                    >
                      {{ p }}
                    </button>
                  }
                </div>

                <button
                  (click)="goToPage(page()!.pagination.page + 1)"
                  class="btn-secondary btn-sm"
                  [disabled]="page()!.pagination.page >= page()!.pagination.total_pages"
                >
                  Siguiente →
                </button>
              </div>
            }
          }
        </div>
      } @else {
        <app-empty-state
          icon="📋"
          title="Busca órdenes"
          description="Usa los filtros y presiona Buscar para listar las órdenes"
        />
      }
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly filterError = signal('');
  readonly page = signal<OrdersPage | null>(null);
  readonly currentLimit = signal(20);

  readonly filterForm = this.fb.group({
    fecha_desde: [''],
    fecha_hasta: [''],
    cups: [''],
    estado: [''],
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  applyFilters(): void {
    this.loadOrders(1);
  }

  loadOrders(pageNum = 1): void {
    this.loading.set(true);
    this.filterError.set('');

    const v = this.filterForm.value;
    const filters: OrderFilters = {
      page: pageNum,
      limit: this.currentLimit(),
    };

    if (v.estado)      filters.estado = v.estado as any;
    if (v.fecha_desde) filters.fecha_desde = v.fecha_desde!;
    if (v.fecha_hasta) filters.fecha_hasta = v.fecha_hasta!;
    if (v.cups)        filters.cups = v.cups!;

    this.ordersService.getOrders(filters).subscribe({
      next: (result) => {
        this.page.set(result);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.filterError.set(err.message);
        this.loading.set(false);
      },
    });
  }

  goToPage(p: number): void {
    const total = this.page()?.pagination.total_pages ?? 1;
    if (p < 1 || p > total) return;
    this.loadOrders(p);
  }

  changeLimit(event: Event): void {
    const val = parseInt((event.target as HTMLSelectElement).value, 10);
    this.currentLimit.set(val);
    this.loadOrders(1);
  }

  clearFilters(): void {
    this.filterForm.reset({ fecha_desde: '', fecha_hasta: '', cups: '', estado: '' });
    this.loadOrders(1);
  }

  pageNumbers(): number[] {
    const p = this.page();
    if (!p) return [];
    const total = p.pagination.total_pages;
    const current = p.pagination.page;
    const delta = 2;
    const pages: number[] = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  }
}
