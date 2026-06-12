import { Component, inject, signal, OnInit, input, computed } from '@angular/core';
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
import { CriticalAlertComponent } from '../../../shared/components/critical-alert/critical-alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LabOrder } from '../../../core/models/order.model';
import { LabResult, valuesToRows, SENSIBILIDAD_CONFIG } from '../../../core/models/result.model';
@Component({
  selector: 'app-result-detail',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
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
              <button (click)="viewPdf()" class="btn-secondary btn-sm" [disabled]="pdfLoading()">
                @if (pdfLoading()) {
                  <span class="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                } @else {
                  📄
                }
                Ver PDF
              </button>
              @if (authService.canSendResultEmail()) {
                <button (click)="openEmailModal()" class="btn-secondary btn-sm">📧 Enviar email</button>
              }
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
                      @if (row.comentario) {
                        <p class="text-xs text-gray-400 italic mt-0.5">{{ row.comentario }}</p>
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

        <!-- Bacteriólogo -->
        @if (result()!.bacteriologo) {
          <div class="card p-5">
            <h2 class="font-semibold text-gray-900 mb-4">👩‍🔬 Bacteriólogo responsable</h2>
            <div class="flex items-start gap-4">
              <!-- Firma -->
              <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                @if (result()!.bacteriologo!.firmaPath) {
                  <img [src]="apiBase + result()!.bacteriologo!.firmaPath" alt="Firma digital"
                    class="w-full h-full object-contain p-2" />
                } @else {
                  <div class="text-center">
                    <span class="text-2xl">✍️</span>
                    <p class="text-xs text-gray-400 mt-1">Sin firma</p>
                  </div>
                }
              </div>
              <!-- Info -->
              <dl class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-xs text-gray-400">Nombre</dt>
                  <dd class="font-semibold text-gray-900">{{ result()!.bacteriologo!.nombre }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400">Documento</dt>
                  <dd class="text-gray-700">
                    {{ result()!.bacteriologo!.tipoDocumento }}: {{ result()!.bacteriologo!.identificacion }}
                  </dd>
                </div>
                @if (result()!.bacteriologo!.tarjetaProfesional) {
                  <div>
                    <dt class="text-xs text-gray-400">Tarjeta profesional</dt>
                    <dd class="text-blue-700 font-medium">{{ result()!.bacteriologo!.tarjetaProfesional }}</dd>
                  </div>
                }
                @if (result()!.bacteriologo!.universidad) {
                  <div>
                    <dt class="text-xs text-gray-400">Universidad</dt>
                    <dd class="text-gray-700">{{ result()!.bacteriologo!.universidad }}</dd>
                  </div>
                }
              </dl>
            </div>
          </div>
        }

        <!-- Antibiograma -->
        @if (result()!.antibiogramas && result()!.antibiogramas!.length > 0) {
          <div class="card overflow-hidden">
            <div class="px-5 py-4 border-b border-amber-100 bg-amber-50">
              <h2 class="font-semibold text-amber-800">🧫 Antibiograma</h2>
            </div>
            @for (abg of result()!.antibiogramas!; track $index) {
              <div class="p-5 border-b border-gray-100 last:border-0">
                <!-- Bacteria header -->
                <div class="flex flex-wrap items-center gap-3 mb-3">
                  <p class="font-bold text-gray-900">{{ abg.bacteriaAislada }}</p>
                  @if (abg.gram !== 'n/a') {
                    <span class="badge text-xs"
                      [class]="abg.gram === 'positivo' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'">
                      Gram {{ abg.gram }}
                    </span>
                  }
                  @if (abg.tiempoIncubacion) {
                    <span class="text-xs text-gray-400">⏱ {{ abg.tiempoIncubacion }}</span>
                  }
                </div>
                @if (abg.gramOrina) {
                  <p class="text-sm text-gray-500 mb-1">
                    <span class="font-medium">Gram orina:</span> {{ abg.gramOrina }}
                  </p>
                }
                @if (abg.observaciones) {
                  <p class="text-sm text-gray-500 italic mb-3">{{ abg.observaciones }}</p>
                }

                @if (abg.items && abg.items.length > 0) {
                  <div class="table-container rounded-xl border border-gray-200 mt-3">
                    <table class="table text-sm">
                      <thead>
                        <tr>
                          <th>Antibiótico</th>
                          <th class="text-center">CIM</th>
                          <th class="text-center w-36">Sensibilidad</th>
                          <th>Método</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of abg.items; track item.antibiotico) {
                          <tr>
                            <td class="font-medium text-gray-800">{{ item.antibiotico }}</td>
                            <td class="text-center font-mono text-gray-600 text-xs">{{ item.cim }}</td>
                            <td class="text-center">
                              <span class="badge text-xs font-bold"
                                [class]="SENSIBILIDAD_CONFIG[item.sensibilidad].class">
                                {{ item.sensibilidad }} — {{ SENSIBILIDAD_CONFIG[item.sensibilidad].label }}
                              </span>
                            </td>
                            <td class="text-gray-500 text-xs">{{ item.metodo }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="text-sm text-gray-400 italic">Sin antibióticos (cultivo negativo)</p>
                }
              </div>
            }
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
              <a [href]="result()!.attachmentPath" target="_blank"
                rel="noopener noreferrer" class="btn-secondary btn-sm">
                Abrir
              </a>
            </div>
          </div>
        }
      }
    </div>

    <!-- Email modal -->
    @if (showEmailModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeEmailModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Enviar resultados por email</h2>
            <p class="text-sm text-gray-500 mt-0.5">
              Orden: <span class="font-mono font-semibold">{{ orderId() }}</span>
            </p>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="label">Destinatario</label>
              <input type="email" [(ngModel)]="emailDest" class="input"
                placeholder="correo@paciente.com (vacío = usa email del paciente)" />
              <p class="text-xs text-gray-400 mt-1">Si se deja vacío, se usa el email del paciente</p>
            </div>
            <div>
              <label class="label">Mensaje personalizado</label>
              <textarea [(ngModel)]="emailMsg" class="input resize-none" rows="3"
                placeholder="Estimado paciente, adjunto sus resultados..."></textarea>
            </div>
            @if (emailError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ emailError() }}
              </div>
            }
            <div class="flex gap-3 pt-2">
              <button (click)="closeEmailModal()" class="btn-secondary flex-1">Cancelar</button>
              <button (click)="sendEmail()" class="btn-primary flex-1" [disabled]="emailSending()">
                @if (emailSending()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                📧 Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ResultDetailComponent implements OnInit {
  readonly orderId = input.required<string>();
  readonly cups = input.required<string>();

  private readonly ordersService = inject(OrdersService);
  private readonly resultsService = inject(ResultsService);
  private readonly notifications = inject(NotificationService);
  readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly order = signal<LabOrder | null>(null);
  readonly result = signal<LabResult | null>(null);
  readonly apiBase = 'http://localhost:8080';

  // PDF
  readonly pdfLoading = signal(false);

  // Email modal
  readonly showEmailModal = signal(false);
  readonly emailSending = signal(false);
  readonly emailError = signal('');
  emailDest = '';
  emailMsg  = '';

  readonly rows = computed(() =>
    valuesToRows(
      this.result()?.valuesJson ?? this.result()?.values ?? { resultado: '' },
      this.result()?.valoresEstructurados
    )
  );
  readonly SENSIBILIDAD_CONFIG = SENSIBILIDAD_CONFIG;

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

  // ─── PDF ──────────────────────────────────────────────────────────────────

  viewPdf(): void {
    this.pdfLoading.set(true);
    this.resultsService.downloadPdf(this.orderId()).subscribe({
      next: (blob) => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const tab = window.open(url, '_blank');
        if (tab) {
          tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        this.pdfLoading.set(false);
      },
      error: (err: Error) => {
        this.notifications.error('Error al generar PDF', err.message);
        this.pdfLoading.set(false);
      },
    });
  }

  // ─── Email ────────────────────────────────────────────────────────────────

  openEmailModal(): void {
    this.emailDest = '';
    this.emailMsg  = '';
    this.emailError.set('');
    this.showEmailModal.set(true);
  }

  closeEmailModal(): void { this.showEmailModal.set(false); }

  sendEmail(): void {
    this.emailSending.set(true);
    this.emailError.set('');
    this.resultsService.sendEmail(this.orderId(), {
      email:   this.emailDest.trim() || undefined,
      mensaje: this.emailMsg.trim()  || undefined,
    }).subscribe({
      next: (res) => {
        this.notifications.success('Email enviado', `Enviado a ${res.emailDestino}`);
        this.closeEmailModal();
        this.emailSending.set(false);
      },
      error: (err: Error) => {
        this.emailError.set(err.message);
        this.emailSending.set(false);
      },
    });
  }
}
