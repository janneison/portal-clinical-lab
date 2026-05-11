import { Component, inject, signal, OnInit, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrdersService } from '../../../core/services/orders.service';
import { ResultsService } from '../../../core/services/results.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CriticalAlertComponent } from '../../../shared/components/critical-alert/critical-alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LabOrder } from '../../../core/models/order.model';
import { LabResult, valuesToRows } from '../../../core/models/result.model';
@Component({
  selector: 'app-result-detail',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    LoadingSpinnerComponent,
    CriticalAlertComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="space-y-6 max-w-3xl">
      <a [routerLink]="['/dashboard/results']" class="btn-ghost btn-sm inline-flex">
        ← Volver a resultados
      </a>

      @if (loading()) {
        <app-loading-spinner message="Cargando resultado..." />
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3">
          <span>❌</span><p>{{ error() }}</p>
        </div>
      } @else if (result() && order()) {

        @if (result()!.isCritical) {
          <app-critical-alert
            [resultValue]="result()!.values.resultado"
            [examName]="result()!.nombreDelLaboratorio ?? cups()"
          />
        }

        <!-- Header -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="font-mono text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  CUPS: {{ cups() }}
                </span>
                @if (result()!.isCritical) {
                  <span class="badge bg-red-100 text-red-700 animate-pulse">🚨 Crítico</span>
                }
              </div>
              <h1 class="text-xl font-bold text-gray-900">
                {{ result()!.nombreDelLaboratorio ?? 'Examen ' + cups() }}
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Orden:
                <span class="font-mono font-medium text-blue-700">{{ orderId() }}</span>
              </p>
              @if (result()!.receivedAt) {
                <p class="text-xs text-gray-400 mt-0.5">
                  Registrado: {{ result()!.receivedAt | date:'dd/MM/yyyy HH:mm' }}
                </p>
              }
            </div>
            <div class="flex gap-2 flex-wrap">
              <button (click)="download()" class="btn-secondary btn-sm">⬇️ Descargar</button>
              <button (click)="share()" class="btn-secondary btn-sm">📤 Compartir</button>
              <button (click)="print()" class="btn-secondary btn-sm">🖨️ Imprimir</button>
            </div>
          </div>
        </div>

        <!-- Patient -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 mb-4">👤 Paciente</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-gray-400">Nombre</p>
              <p class="text-sm font-medium text-gray-900">{{ order()!.nombreDelPaciente }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Documento</p>
              <p class="text-sm font-medium text-gray-900">
                {{ order()!.tipoDeDocumento }}: {{ order()!.identificacion }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Fecha de nacimiento</p>
              <p class="text-sm font-medium text-gray-900">
                {{ order()!.fechaDeNacimiento | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Médico</p>
              <p class="text-sm font-medium text-gray-900">{{ order()!.medicoQueOrdena }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Centro de salud</p>
              <p class="text-sm font-medium text-gray-900">{{ order()!.centroDeSalud }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Estado de la orden</p>
              <app-status-badge [status]="order()!.estadoDeLaOrden" />
            </div>
          </div>
        </div>

        <!-- Values table -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
            [class.bg-red-50]="result()!.isCritical"
            [class.bg-gray-50]="!result()!.isCritical"
          >
            <h2 class="font-semibold text-gray-900">📊 Valores del resultado</h2>
            <span class="text-xs text-gray-400">{{ rows().length }} parámetro(s)</span>
          </div>

          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-1/3">Parámetro</th>
                  <th>Valor</th>
                  <th>Unidad</th>
                  <th>Referencia</th>
                  <th class="w-28 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.parametro) {
                  <tr [class.bg-yellow-50]="row.isMain">
                    <td>
                      <span
                        class="text-sm capitalize"
                        [class.font-semibold]="row.isMain"
                        [class.text-gray-900]="row.isMain"
                        [class.text-gray-600]="!row.isMain"
                      >
                        {{ row.parametro }}
                      </span>
                      @if (row.isMain) {
                        <span class="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                          principal
                        </span>
                      }
                    </td>
                    <td>
                      <span
                        class="font-medium text-sm"
                        [class.text-red-700]="row.isMain && result()!.isCritical"
                        [class.text-green-700]="row.isMain && !result()!.isCritical"
                        [class.text-gray-900]="!row.isMain"
                      >
                        {{ row.valor }}
                      </span>
                    </td>
                    <td class="text-gray-500 text-xs">{{ row.unidad || '—' }}</td>
                    <td class="text-gray-400 text-xs max-w-xs" [title]="row.referencia">
                      <span class="block truncate max-w-[200px]">{{ row.referencia || '—' }}</span>
                    </td>
                    <td class="text-center">
                      @if (row.isMain) {
                        <span
                          class="badge text-xs"
                          [class.bg-red-100]="result()!.isCritical"
                          [class.text-red-700]="result()!.isCritical"
                          [class.bg-green-100]="!result()!.isCritical"
                          [class.text-green-700]="!result()!.isCritical"
                        >
                          {{ result()!.isCritical ? '🚨 Crítico' : '✅ Normal' }}
                        </span>
                      } @else {
                        <span class="text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attachment -->
        @if (result()!.attachmentPath) {
          <div class="card p-5">
            <h2 class="font-semibold text-gray-900 mb-3">📎 Archivo adjunto</h2>
            <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <span class="text-2xl">📄</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ result()!.attachmentPath }}
                </p>
                <p class="text-xs text-gray-400">PDF</p>
              </div>
              <a [href]="result()!.attachmentPath" target="_blank"
                rel="noopener noreferrer" class="btn-secondary btn-sm">
                Abrir
              </a>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ResultDetailComponent implements OnInit {
  readonly orderId = input.required<string>();
  readonly cups = input.required<string>();

  private readonly ordersService = inject(OrdersService);
  private readonly resultsService = inject(ResultsService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly order = signal<LabOrder | null>(null);
  readonly result = signal<LabResult | null>(null);

  readonly rows = computed(() =>
    valuesToRows(this.result()?.valuesJson ?? this.result()?.values ?? { resultado: '' })
  );

  ngOnInit(): void {
    forkJoin({
      order:      this.ordersService.getOrderFullSearch(this.orderId()),
      apiResults: this.resultsService.getResultsByOrder(this.orderId()).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ order, apiResults }) => {
        this.order.set(order);

        const detail = order.detalles.find((d) => d.cups === this.cups());
        if (!detail) {
          this.error.set(`No se encontró el examen con CUPS ${this.cups()}`);
          this.loading.set(false);
          return;
        }

        // Prefer real valuesJson from GET /orders/{id}/results
        const apiItem = apiResults?.resultados.find((r) => r.cups === this.cups());

        if (apiItem) {
          this.result.set({
            ...this.resultsService.fromApiResult(apiItem, detail.nombreDelLaboratorio),
            idSolicitudKey: order.idSolicitudKey,
          });
        } else {
          // Fallback: values_json not available — show status info only
          this.result.set(
            this.resultsService.enrichWithCritical({
              idSolicitudKey:       order.idSolicitudKey,
              cups:                 detail.cups,
              nombreDelLaboratorio: detail.nombreDelLaboratorio,
              values: {
                resultado:      'Valores no disponibles aún',
                estado:         detail.estadoDelResultado ?? '—',
                fechaResultado: detail.fechaResultado     ?? '—',
                ...(detail.metodo   ? { metodo:   detail.metodo   } : {}),
                ...(detail.reactivo ? { reactivo: detail.reactivo } : {}),
                ...(detail.invima   ? { invima:   detail.invima   } : {}),
              },
              receivedAt: detail.fechaResultado ?? undefined,
            })
          );
        }

        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  download(): void {
    const result = this.result();
    const order = this.order();
    if (!result || !order) return;
    const text = this.resultsService.generateShareText(result, order.nombreDelPaciente);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado_${this.orderId()}_${this.cups()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.notifications.success('Descarga iniciada');
  }

  share(): void {
    const result = this.result();
    const order = this.order();
    if (!result || !order) return;
    const text = this.resultsService.generateShareText(result, order.nombreDelPaciente);
    if (navigator.share) {
      navigator.share({ title: `Resultado ${this.cups()}`, text });
    } else {
      navigator.clipboard.writeText(text).then(() =>
        this.notifications.success('Copiado al portapapeles')
      );
    }
  }

  print(): void {
    window.print();
  }
}
