import { Component, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CriticalAlertComponent } from '../../../shared/components/critical-alert/critical-alert.component';
import { LabOrder, OrderDetail } from '../../../core/models/order.model';
import { isCriticalResult } from '../../../core/models/result.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    CriticalAlertComponent,
  ],
  template: `
    <div class="space-y-6 max-w-5xl">
      <!-- Back -->
      <a routerLink="/dashboard/orders" class="btn-ghost btn-sm inline-flex">
        ← Volver a órdenes
      </a>

      @if (loading()) {
        <app-loading-spinner message="Cargando orden..." />
      } @else if (error()) {
        <div class="alert-critical">
          <span>❌</span>
          <div>
            <p class="font-semibold">Error al cargar la orden</p>
            <p class="text-sm">{{ error() }}</p>
          </div>
        </div>
      } @else if (order()) {
        <!-- Critical alerts -->
        @for (detail of criticalDetails(); track detail.cups) {
          <app-critical-alert
            [resultValue]="detail.estadoDelResultado ?? 'Resultado crítico'"
            [examName]="detail.nombreDelLaboratorio"
            [dismissable]="true"
          />
        }

        <!-- Order header -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-xl font-bold text-gray-900 font-mono">
                  {{ order()!.idSolicitudKey }}
                </h1>
                <app-status-badge [status]="order()!.estadoDeLaOrden" />
              </div>
              <p class="text-gray-500 text-sm">
                Admisión: <span class="font-medium text-gray-700">{{ order()!.idAdmision }}</span>
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-wrap">
              @if (authService.isLabOperator() && order()!.estadoDeLaOrden === 'pending') {
                <button
                  (click)="sendOrder()"
                  class="btn-primary btn-sm"
                  [disabled]="sending()"
                >
                  @if (sending()) {
                    <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  }
                  📤 Enviar al laboratorio
                </button>
              }
              <button (click)="printOrder()" class="btn-secondary btn-sm">
                🖨️ Imprimir
              </button>
              <button (click)="shareOrder()" class="btn-secondary btn-sm">
                📤 Compartir
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progreso de ejecución</span>
              <span class="font-semibold">{{ order()!.porcEjecucion }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500"
                [class]="order()!.porcEjecucion === 100 ? 'bg-green-500' : 'bg-blue-500'"
                [style.width.%]="order()!.porcEjecucion"
              ></div>
            </div>
          </div>
        </div>

        <!-- Patient info -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              👤 Información del Paciente
            </h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Nombre</dt>
                <dd class="text-sm font-medium text-gray-900">{{ order()!.nombreDelPaciente }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Documento</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ order()!.tipoDeDocumento }}: {{ order()!.identificacion }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Sexo</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ order()!.sexo === 'M' ? 'Masculino' : 'Femenino' }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Fecha de nacimiento</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ order()!.fechaDeNacimiento | date:'dd/MM/yyyy' }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="card p-5">
            <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🏥 Información Clínica
            </h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Centro de salud</dt>
                <dd class="text-sm font-medium text-gray-900">{{ order()!.centroDeSalud }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Médico que ordena</dt>
                <dd class="text-sm font-medium text-gray-900">{{ order()!.medicoQueOrdena }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Fecha de orden</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ order()!.fechaDeLaOrden | date:'dd/MM/yyyy HH:mm' }}
                </dd>
              </div>
              @if (order()!.fechaEnvio) {
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Fecha de envío</dt>
                  <dd class="text-sm font-medium text-gray-900">
                    {{ order()!.fechaEnvio | date:'dd/MM/yyyy HH:mm' }}
                  </dd>
                </div>
              }
              @if (order()!.idAliado) {
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-500">Laboratorio aliado</dt>
                  <dd class="text-sm font-medium text-primary-700">{{ order()!.idAliado }}</dd>
                </div>
              }
            </dl>
          </div>
        </div>

        <!-- Exam details -->
        <div class="card">
          <div class="p-5 border-b border-gray-100">
            <h2 class="font-semibold text-gray-900">🔬 Exámenes ({{ order()!.detalles.length }})</h2>
          </div>

          <div class="divide-y divide-gray-100">
            @for (detail of order()!.detalles; track detail.cups) {
              <div class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {{ detail.cups }}
                      </span>
                      @if (isCritical(detail)) {
                        <span class="badge-critical">🚨 Crítico</span>
                      }
                    </div>
                    <p class="font-semibold text-gray-900">{{ detail.nombreDelLaboratorio }}</p>

                    @if (detail.estadoDelResultado) {
                      <p class="text-sm mt-1">
                        Resultado:
                        <span
                          class="font-medium"
                          [class.text-red-600]="isCritical(detail)"
                          [class.text-green-600]="!isCritical(detail)"
                        >
                          {{ detail.estadoDelResultado }}
                        </span>
                      </p>
                    }
                  </div>

                  <div class="text-right text-xs text-gray-400 space-y-1">
                    @if (detail.fechaTomaMuestra) {
                      <p>Muestra: {{ detail.fechaTomaMuestra | date:'dd/MM/yyyy' }}</p>
                    }
                    @if (detail.fechaResultado) {
                      <p>Resultado: {{ detail.fechaResultado | date:'dd/MM/yyyy' }}</p>
                    }
                    @if (detail.metodo) {
                      <p>Método: {{ detail.metodo }}</p>
                    }
                  </div>
                </div>

                <!-- Extra detail fields -->
                @if (detail.reactivo || detail.invima || detail.identificacionDelBacteriologo) {
                  <div class="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                    @if (detail.reactivo) {
                      <span>Reactivo: <strong>{{ detail.reactivo }}</strong></span>
                    }
                    @if (detail.invima) {
                      <span>INVIMA: <strong>{{ detail.invima }}</strong></span>
                    }
                    @if (detail.identificacionDelBacteriologo) {
                      <span>Bacteriólogo: <strong>{{ detail.identificacionDelBacteriologo }}</strong></span>
                    }
                  </div>
                }

                @if (order()!.estadoDeLaOrden === 'completed') {
                  <div class="mt-3">
                    <a
                      [routerLink]="['/dashboard/results', order()!.idSolicitudKey, detail.cups]"
                      class="btn-secondary btn-sm"
                    >
                      Ver resultado completo →
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  // Route param via input binding
  readonly id = input.required<string>();

  private readonly ordersService = inject(OrdersService);
  private readonly notifications = inject(NotificationService);
  readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly order = signal<LabOrder | null>(null);
  readonly sending = signal(false);

  readonly criticalDetails = () =>
    (this.order()?.detalles ?? []).filter((d) => this.isCritical(d));

  ngOnInit(): void {
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading.set(true);
    this.error.set('');

    this.ordersService.getOrder(this.id()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);

        if (this.criticalDetails().length > 0) {
          this.notifications.warning(
            'Resultados críticos detectados',
            `${this.criticalDetails().length} examen(es) requieren atención`
          );
        }
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  sendOrder(): void {
    this.sending.set(true);
    this.ordersService.sendOrder(this.id()).subscribe({
      next: (updated) => {
        this.order.update((o) =>
          o ? { ...o, estadoDeLaOrden: updated.estadoDeLaOrden, fechaEnvio: updated.fechaEnvio ?? null } : o
        );
        this.notifications.success('Orden enviada', `Enviada el ${new Date().toLocaleString('es-CO')}`);
        this.sending.set(false);
      },
      error: (err: Error) => {
        this.notifications.error('Error al enviar', err.message);
        this.sending.set(false);
      },
    });
  }

  isCritical(detail: OrderDetail): boolean {
    return isCriticalResult(detail.estadoDelResultado ?? '');
  }

  printOrder(): void {
    window.print();
  }

  shareOrder(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Orden ${this.id()}`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.notifications.success('Enlace copiado', 'El enlace fue copiado al portapapeles');
      });
    }
  }
}
