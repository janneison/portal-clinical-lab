import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientPortalService } from '../../../core/services/patient-portal.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PatientPortalOrder, PatientPortalResultsResponse } from '../../../core/models/patient-portal.model';

@Component({
  selector: 'app-patient-results',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- Top bar -->
      <header class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span class="text-white text-lg">🧪</span>
            </div>
            <div>
              <p class="font-bold text-gray-900 text-sm leading-tight">Clinical Lab</p>
              <p class="text-xs text-gray-400">Portal de Pacientes</p>
            </div>
          </div>
          <button (click)="svc.logout()" class="btn-ghost btn-sm text-red-500 hover:text-red-700">
            🚪 Salir
          </button>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <!-- Patient greeting -->
        @if (data()) {
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-blue-700 text-xl font-bold">
                  {{ data()!.patient.nombre[0] }}
                </span>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Bienvenido</p>
                <h1 class="text-xl font-bold text-gray-900">{{ data()!.patient.nombre }}</h1>
                <p class="text-sm text-gray-500">
                  {{ data()!.patient.tipoDocumento }}: {{ data()!.patient.identificacion }}
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Header -->
        <div>
          <h2 class="text-lg font-bold text-gray-900">Mis resultados</h2>
          <p class="text-sm text-gray-500 mt-0.5">
            Órdenes completadas disponibles para descarga
          </p>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <app-loading-spinner message="Cargando tus resultados..." />
        }

        <!-- Error -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex gap-3">
            <span>❌</span>
            <div>
              <p class="font-semibold">Error al cargar resultados</p>
              <p>{{ error() }}</p>
              <button (click)="load()" class="mt-2 text-red-700 underline text-xs">Reintentar</button>
            </div>
          </div>
        }

        <!-- Empty -->
        @if (!loading() && data() && data()!.ordenes.length === 0) {
          <app-empty-state
            icon="🔬"
            title="Sin resultados disponibles"
            description="Aún no tienes órdenes completadas. Cuando tus resultados estén listos aparecerán aquí."
          />
        }

        <!-- Orders list -->
        @if (!loading() && data() && data()!.ordenes.length > 0) {
          <div class="space-y-3">
            @for (orden of data()!.ordenes; track orden.idSolicitudKey) {
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <!-- Order header -->
                <div class="px-5 py-4 flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono text-sm font-bold text-blue-700">
                        {{ orden.idSolicitudKey }}
                      </span>
                      <span class="badge bg-green-100 text-green-700 text-xs">✅ Completada</span>
                    </div>
                    <p class="text-sm text-gray-600">
                      📅 {{ orden.fechaDeLaOrden | date:'dd/MM/yyyy' }}
                    </p>
                    <p class="text-sm text-gray-600 mt-0.5">
                      🏥 {{ orden.centroDeSalud }}
                    </p>
                    <p class="text-sm text-gray-500 mt-0.5">
                      👨‍⚕️ {{ orden.medicoQueOrdena }}
                    </p>
                  </div>

                  <!-- Download button -->
                  <button
                    (click)="downloadPdf(orden)"
                    class="btn-primary btn-sm flex-shrink-0"
                    [disabled]="downloadingId() === orden.idSolicitudKey"
                    title="Descargar PDF"
                  >
                    @if (downloadingId() === orden.idSolicitudKey) {
                      <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Descargando...
                    } @else {
                      📄 Descargar PDF
                    }
                  </button>
                </div>

                <!-- Error per order -->
                @if (downloadError()[orden.idSolicitudKey]) {
                  <div class="px-5 pb-3 text-xs text-red-600">
                    ⚠️ {{ downloadError()[orden.idSolicitudKey] }}
                  </div>
                }
              </div>
            }
          </div>

          <p class="text-center text-xs text-gray-400 pt-2">
            {{ data()!.total }} resultado(s) disponible(s)
          </p>
        }

      </main>

      <!-- Footer -->
      <footer class="text-center py-8 text-xs text-gray-400">
        © {{ year }} Clinical Lab — Portal de Pacientes
      </footer>
    </div>
  `,
})
export class PatientResultsComponent implements OnInit {
  readonly svc = inject(PatientPortalService);

  readonly year = new Date().getFullYear();
  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<PatientPortalResultsResponse | null>(null);
  readonly downloadingId = signal<string | null>(null);
  readonly downloadError = signal<Record<string, string>>({});

  ngOnInit(): void {
    // Debug: verify token is available on hard refresh
    const storedToken = localStorage.getItem('patient_portal_token');
    console.log('[PatientResults] Token en localStorage:', storedToken ? storedToken.substring(0, 30) + '...' : 'NULL');
    console.log('[PatientResults] isAuthenticated:', this.svc.isAuthenticated());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.getResults().subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err: Error) => { this.error.set(err.message); this.loading.set(false); },
    });
  }

  downloadPdf(orden: PatientPortalOrder): void {
    this.downloadingId.set(orden.idSolicitudKey);
    this.downloadError.update((e) => ({ ...e, [orden.idSolicitudKey]: '' }));

    this.svc.downloadPdf(orden.idSolicitudKey).subscribe({
      next: (blob) => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const tab = window.open(url, '_blank');
        if (tab) {
          tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        } else {
          // Fallback: force download
          const a = document.createElement('a');
          a.href = url;
          a.download = `resultado_${orden.idSolicitudKey}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        this.downloadingId.set(null);
      },
      error: (err: Error) => {
        this.downloadError.update((e) => ({ ...e, [orden.idSolicitudKey]: err.message }));
        this.downloadingId.set(null);
      },
    });
  }
}
