import { Component, inject, signal, OnInit, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { ResultsService } from '../../../core/services/results.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CriticalAlertComponent } from '../../../shared/components/critical-alert/critical-alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LabOrder } from '../../../core/models/order.model';
import { LabResult } from '../../../core/models/result.model';

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
      <!-- Back -->
      <a [routerLink]="['/dashboard/results']" class="btn-ghost btn-sm inline-flex">
        ← Volver a resultados
      </a>

      @if (loading()) {
        <app-loading-spinner message="Cargando resultado..." />
      } @else if (error()) {
        <div class="alert-critical">
          <span>❌</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (result() && order()) {
        <!-- Critical alert -->
        @if (result()!.isCritical) {
          <app-critical-alert
            [resultValue]="result()!.values.resultado"
            [examName]="result()!.nombreDelLaboratorio ?? cups()"
          />
        }

        <!-- Result header card -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="font-mono text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  CUPS: {{ cups() }}
                </span>
                @if (result()!.isCritical) {
                  <span class="badge-critical">🚨 Crítico</span>
                }
              </div>
              <h1 class="text-xl font-bold text-gray-900">
                {{ result()!.nombreDelLaboratorio ?? 'Examen ' + cups() }}
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Orden: <span class="font-mono font-medium text-primary-700">{{ orderId() }}</span>
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button (click)="download()" class="btn-secondary btn-sm">
                ⬇️ Descargar
              </button>
              <button (click)="share()" class="btn-secondary btn-sm">
                📤 Compartir
              </button>
              <button (click)="print()" class="btn-secondary btn-sm">
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>

        <!-- Patient info -->
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

        <!-- Main result -->
        <div class="card p-5">
          <h2 class="font-semibold text-gray-900 mb-4">🔬 Resultado Principal</h2>
          <div
            class="rounded-xl p-6 text-center"
            [class.bg-red-50]="result()!.isCritical"
            [class.bg-green-50]="!result()!.isCritical"
          >
            <p class="text-xs uppercase tracking-wider mb-2"
              [class.text-red-500]="result()!.isCritical"
              [class.text-green-500]="!result()!.isCritical"
            >
              Resultado
            </p>
            <p
              class="text-4xl font-bold"
              [class.text-red-700]="result()!.isCritical"
              [class.text-green-700]="!result()!.isCritical"
            >
              {{ result()!.values.resultado }}
            </p>
            @if (result()!.receivedAt) {
              <p class="text-xs text-gray-400 mt-3">
                Registrado: {{ result()!.receivedAt | date:'dd/MM/yyyy HH:mm' }}
              </p>
            }
          </div>
        </div>

        <!-- Detailed values -->
        @if (extraValues().length > 0) {
          <div class="card p-5">
            <h2 class="font-semibold text-gray-900 mb-4">📊 Valores Detallados</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (kv of extraValues(); track kv.key) {
                <div class="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <span class="text-sm text-gray-500 capitalize">{{ kv.key }}</span>
                  <span class="text-sm font-semibold text-gray-900">{{ kv.value }}</span>
                </div>
              }
            </div>
          </div>
        }

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
              <a
                [href]="result()!.attachmentPath"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary btn-sm"
              >
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

  readonly extraValues = computed(() =>
    Object.entries(this.result()?.values ?? {})
      .filter(([k]) => k !== 'resultado')
      .map(([key, value]) => ({ key, value }))
  );

  ngOnInit(): void {
    this.ordersService.getOrder(this.orderId()).subscribe({
      next: (order) => {
        this.order.set(order);

        const detail = order.detalles.find((d) => d.cups === this.cups());
        if (!detail) {
          this.error.set(`No se encontró el examen con CUPS ${this.cups()}`);
          this.loading.set(false);
          return;
        }

        const raw: LabResult = {
          idSolicitudKey: order.idSolicitudKey,
          cups: detail.cups,
          nombreDelLaboratorio: detail.nombreDelLaboratorio,
          values: {
            resultado: detail.estadoDelResultado ?? 'Pendiente',
            ...(detail.metodo ? { metodo: detail.metodo } : {}),
            ...(detail.reactivo ? { reactivo: detail.reactivo } : {}),
            ...(detail.invima ? { invima: detail.invima } : {}),
          },
          receivedAt: detail.fechaResultado ?? undefined,
        };

        this.result.set(this.resultsService.enrichWithCritical(raw));
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
      navigator.clipboard.writeText(text).then(() => {
        this.notifications.success('Copiado al portapapeles');
      });
    }
  }

  print(): void {
    window.print();
  }
}
