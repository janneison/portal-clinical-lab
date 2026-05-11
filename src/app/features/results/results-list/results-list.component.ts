import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrdersService } from '../../../core/services/orders.service';
import { ResultsService } from '../../../core/services/results.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CriticalAlertComponent } from '../../../shared/components/critical-alert/critical-alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LabOrder } from '../../../core/models/order.model';
import { LabResult, valuesToRows, ResultValueDetail } from '../../../core/models/result.model';
import { NotificationConfig } from '../../../core/models/notification.model';

@Component({
  selector: 'app-results-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CriticalAlertComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Resultados de Laboratorio</h1>
        <p class="text-gray-500 text-sm mt-1">Consulta resultados por orden de laboratorio</p>
      </div>

      <!-- Search -->
      <div class="card p-5">
        <h2 class="font-semibold text-gray-700 mb-4">🔍 Buscar resultados por orden</h2>
        <div class="flex gap-3">
          <input
            type="text"
            [(ngModel)]="searchId"
            class="input flex-1"
            placeholder="ID de solicitud (Ej: SOL-2025-0001)"
            (keyup.enter)="loadResults()"
          />
          <button
            (click)="loadResults()"
            class="btn-primary"
            [disabled]="!searchId.trim() || loading()"
          >
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            Buscar
          </button>
        </div>
        @if (searchError()) {
          <p class="text-sm text-red-600 mt-2">{{ searchError() }}</p>
        }
      </div>

      @if (currentOrder()) {
        <!-- Filters -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-700">🗂️ Filtros</h2>
            <button (click)="clearFilters()" class="btn-ghost btn-sm text-gray-500">Limpiar</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="label">Tipo de examen</label>
              <input type="text" [(ngModel)]="filterExam" class="input" placeholder="Ej: Hemograma" />
            </div>
            <div>
              <label class="label">Desde</label>
              <input type="date" [(ngModel)]="filterDateFrom" class="input" />
            </div>
            <div>
              <label class="label">Hasta</label>
              <input type="date" [(ngModel)]="filterDateTo" class="input" />
            </div>
          </div>
        </div>

        <!-- Critical alerts -->
        @for (result of criticalResults(); track result.cups) {
          <app-critical-alert
            [resultValue]="result.values.resultado"
            [examName]="result.nombreDelLaboratorio ?? result.cups"
            [dismissable]="true"
          />
        }

        <!-- Patient card -->
        <div class="card p-5">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-blue-700 text-lg font-bold">
                  {{ currentOrder()!.nombreDelPaciente[0] }}
                </span>
              </div>
              <div>
                <p class="font-bold text-gray-900">{{ currentOrder()!.nombreDelPaciente }}</p>
                <p class="text-xs text-gray-500">
                  {{ currentOrder()!.tipoDeDocumento }}: {{ currentOrder()!.identificacion }}
                  · {{ currentOrder()!.sexo === 'M' ? 'Masculino' : 'Femenino' }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ currentOrder()!.medicoQueOrdena }} · {{ currentOrder()!.centroDeSalud }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <app-status-badge [status]="currentOrder()!.estadoDeLaOrden" />
              <button (click)="showNotifConfig.set(!showNotifConfig())" class="btn-secondary btn-sm">
                🔔 Notificar
              </button>
              <button (click)="downloadAll()" class="btn-secondary btn-sm">
                ⬇️ Descargar todo
              </button>
            </div>
          </div>

          @if (showNotifConfig()) {
            <div class="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4 space-y-3">
              <p class="text-sm font-semibold text-gray-700">Notificar al paciente</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" [(ngModel)]="notifConfig.emailEnabled" class="rounded" />
                  Email
                </label>
                @if (notifConfig.emailEnabled) {
                  <input type="email" [(ngModel)]="notifConfig.email" class="input" placeholder="correo@paciente.com" />
                }
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" [(ngModel)]="notifConfig.smsEnabled" class="rounded" />
                  SMS
                </label>
                @if (notifConfig.smsEnabled) {
                  <input type="tel" [(ngModel)]="notifConfig.phone" class="input" placeholder="+57 300 000 0000" />
                }
              </div>
              <button (click)="sendNotification()" class="btn-primary btn-sm">Enviar</button>
            </div>
          }
        </div>

        <!-- Results -->
        @if (filteredResults().length === 0) {
          <app-empty-state icon="🔬" title="Sin resultados"
            description="Esta orden no tiene resultados registrados aún" />
        } @else {
          <div class="space-y-4">
            @for (result of filteredResults(); track result.cups) {
              <div
                class="card overflow-hidden"
                [class.border-red-300]="result.isCritical"
                [class.border-2]="result.isCritical"
              >
                <!-- Result header -->
                <div
                  class="px-5 py-4 flex items-center justify-between"
                  [class.bg-red-50]="result.isCritical"
                  [class.bg-gray-50]="!result.isCritical"
                >
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
                      {{ result.cups }}
                    </span>
                    <div>
                      <p class="font-semibold text-gray-900">
                        {{ result.nombreDelLaboratorio ?? 'Examen ' + result.cups }}
                      </p>
                      @if (result.receivedAt) {
                        <p class="text-xs text-gray-400">
                          {{ result.receivedAt | date:'dd/MM/yyyy HH:mm' }}
                        </p>
                      }
                    </div>
                    @if (result.isCritical) {
                      <span class="badge bg-red-100 text-red-700 animate-pulse">🚨 Crítico</span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="downloadResult(result)" class="btn-ghost btn-sm" title="Descargar">⬇️</button>
                    <button (click)="shareResult(result)" class="btn-ghost btn-sm" title="Compartir">📤</button>
                    <a
                      [routerLink]="['/dashboard/results', currentOrder()!.idSolicitudKey, result.cups]"
                      class="btn-secondary btn-sm"
                    >
                      Ver detalle →
                    </a>
                  </div>
                </div>

                <!-- Values table -->
                <div class="table-container rounded-none border-0">
                  <table class="table">
                    <thead>
                      <tr>
                        <th class="w-1/3">Parámetro</th>
                        <th>Valor</th>
                        <th>Unidad</th>
                        <th>Referencia</th>
                        <th class="w-24 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of getRows(result); track row.parametro) {
                        <tr [class.bg-yellow-50]="row.isMain">
                          <td>
                            <span class="text-sm capitalize"
                              [class.font-semibold]="row.isMain"
                              [class.text-gray-900]="row.isMain"
                              [class.text-gray-600]="!row.isMain">
                              {{ row.parametro }}
                            </span>
                            @if (row.isMain) {
                              <span class="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                principal
                              </span>
                            }
                          </td>
                          <td>
                            <span class="font-medium text-sm"
                              [class.text-red-700]="row.isMain && result.isCritical"
                              [class.text-green-700]="row.isMain && !result.isCritical"
                              [class.text-gray-900]="!row.isMain">
                              {{ row.valor }}
                            </span>
                          </td>
                          <td class="text-gray-500 text-xs">{{ row.unidad || '—' }}</td>
                          <td class="text-gray-400 text-xs max-w-xs truncate" [title]="row.referencia">
                            {{ row.referencia || '—' }}
                          </td>
                          <td class="text-center">
                            @if (row.isMain) {
                              <span class="badge text-xs"
                                [class.bg-red-100]="result.isCritical"
                                [class.text-red-700]="result.isCritical"
                                [class.bg-green-100]="!result.isCritical"
                                [class.text-green-700]="!result.isCritical">
                                {{ result.isCritical ? '🚨 Crítico' : '✅ Normal' }}
                              </span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (result.attachmentPath) {
                  <div class="px-5 py-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                    <span>📎</span>
                    <a [href]="result.attachmentPath" target="_blank"
                      rel="noopener noreferrer" class="text-blue-600 hover:underline truncate">
                      {{ result.attachmentPath }}
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        }
      } @else if (!loading()) {
        <app-empty-state icon="🔬" title="Busca resultados"
          description="Ingresa el ID de una orden para ver sus resultados" />
      }
    </div>
  `,
})
export class ResultsListComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly resultsService = inject(ResultsService);
  private readonly notifications = inject(NotificationService);
  readonly authService = inject(AuthService);

  readonly valuesToRows = valuesToRows;

  getRows(result: LabResult) {
    return valuesToRows(result.valuesJson ?? result.values);
  }

  searchId = '';
  filterExam = '';
  filterDateFrom = '';
  filterDateTo = '';

  readonly loading = signal(false);
  readonly searchError = signal('');
  readonly currentOrder = signal<LabOrder | null>(null);
  readonly results = signal<LabResult[]>([]);
  readonly showNotifConfig = signal(false);

  notifConfig: NotificationConfig = {
    emailEnabled: false,
    smsEnabled: false,
    email: '',
    phone: '',
  };

  readonly criticalResults = computed(() => this.results().filter((r) => r.isCritical));

  readonly filteredResults = computed(() => {
    let list = this.results();
    if (this.filterExam) {
      list = list.filter((r) =>
        (r.nombreDelLaboratorio ?? r.cups).toLowerCase().includes(this.filterExam.toLowerCase())
      );
    }
    if (this.filterDateFrom) {
      const from = new Date(this.filterDateFrom);
      list = list.filter((r) => !r.receivedAt || new Date(r.receivedAt) >= from);
    }
    if (this.filterDateTo) {
      const to = new Date(this.filterDateTo);
      to.setHours(23, 59, 59);
      list = list.filter((r) => !r.receivedAt || new Date(r.receivedAt) <= to);
    }
    return list;
  });

  loadResults(): void {
    const id = this.searchId.trim();
    if (!id) return;

    this.loading.set(true);
    this.searchError.set('');
    this.currentOrder.set(null);
    this.results.set([]);

    // Load order + results in parallel; results endpoint may not exist yet → fallback
    forkJoin({
      order:      this.ordersService.getOrderFullSearch(id),
      apiResults: this.resultsService.getResultsByOrder(id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ order, apiResults }) => {
        this.currentOrder.set(order);

        // Build name map from order details
        const nameMap = new Map(order.detalles.map((d) => [d.cups, d.nombreDelLaboratorio]));

        let results: LabResult[];

        if (apiResults && apiResults.resultados.length > 0) {
          // Use real valuesJson from GET /orders/{id}/results
          results = apiResults.resultados.map((api) => ({
            ...this.resultsService.fromApiResult(api, nameMap.get(api.cups)),
            idSolicitudKey: order.idSolicitudKey,
          }));
        } else {
          // Fallback: build from order details — estadoDelResultado is the exam
          // status ("FINAL"), NOT the clinical value.
          results = order.detalles.map((d) =>
            this.resultsService.enrichWithCritical({
              idSolicitudKey:       order.idSolicitudKey,
              cups:                 d.cups,
              nombreDelLaboratorio: d.nombreDelLaboratorio,
              values: {
                resultado:      'Valores no disponibles aún',
                estado:         d.estadoDelResultado ?? '—',
                fechaResultado: d.fechaResultado     ?? '—',
                ...(d.metodo   ? { metodo:   d.metodo   } : {}),
                ...(d.reactivo ? { reactivo: d.reactivo } : {}),
              },
              receivedAt: d.fechaResultado ?? undefined,
            })
          );
        }

        this.results.set(results);
        this.loading.set(false);

        if (this.criticalResults().length > 0) {
          this.notifications.warning(
            '⚠️ Resultados críticos',
            `${this.criticalResults().length} resultado(s) requieren atención inmediata`
          );
        }
      },
      error: (err: Error) => {
        this.searchError.set(err.message);
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.filterExam = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
  }

  downloadResult(result: LabResult): void {
    const order = this.currentOrder();
    if (!order) return;
    const text = this.resultsService.generateShareText(result, order.nombreDelPaciente);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado_${result.idSolicitudKey}_${result.cups}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notifications.success('Descarga iniciada');
  }

  downloadAll(): void {
    const order = this.currentOrder();
    if (!order) return;
    const text = this.results()
      .map((r) => this.resultsService.generateShareText(r, order.nombreDelPaciente))
      .join('\n\n' + '='.repeat(50) + '\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${order.idSolicitudKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notifications.success('Descarga iniciada', 'Todos los resultados descargados');
  }

  shareResult(result: LabResult): void {
    const order = this.currentOrder();
    if (!order) return;
    const text = this.resultsService.generateShareText(result, order.nombreDelPaciente);
    if (navigator.share) {
      navigator.share({ title: `Resultado ${result.cups}`, text });
    } else {
      navigator.clipboard.writeText(text).then(() =>
        this.notifications.success('Copiado', 'Resultado copiado al portapapeles')
      );
    }
  }

  sendNotification(): void {
    const order = this.currentOrder();
    if (!order) return;
    this.notifications.sendPatientNotification(
      this.notifConfig,
      order.nombreDelPaciente,
      order.idSolicitudKey
    );
    this.showNotifConfig.set(false);
  }
}
