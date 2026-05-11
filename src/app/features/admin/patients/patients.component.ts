import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Patient, PatientDetail, PatientsPage } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pacientes</h1>
        <p class="text-gray-500 text-sm mt-1">
          Los pacientes se crean automáticamente al registrar una orden
        </p>
      </div>

      <!-- Search -->
      <div class="card p-4">
        <div class="flex gap-3">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="input flex-1"
            placeholder="🔍 Buscar por nombre o número de documento..."
            (keyup.enter)="search()"
          />
          <button (click)="search()" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            Buscar
          </button>
          @if (searchQuery) {
            <button (click)="clearSearch()" class="btn-secondary">Limpiar</button>
          }
        </div>
      </div>

      <!-- Results -->
      @if (loading()) {
        <app-loading-spinner message="Buscando pacientes..." />
      } @else if (page()) {
        <div class="card overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p class="text-sm text-gray-600">
              {{ page()!.pagination.total }} paciente(s)
              · Página {{ page()!.pagination.page }} de {{ page()!.pagination.total_pages }}
            </p>
          </div>

          @if (page()!.data.length === 0) {
            <app-empty-state icon="👤" title="Sin resultados"
              description="No se encontraron pacientes con ese criterio" />
          } @else {
            <div class="table-container rounded-none border-0">
              <table class="table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th class="text-center">Sexo</th>
                    <th>Fecha nacimiento</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (patient of page()!.data; track patient.id) {
                    <tr>
                      <td>
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {{ patient.tipoDocumento }}
                        </span>
                        <span class="ml-1 text-sm text-gray-700">{{ patient.identificacion }}</span>
                      </td>
                      <td class="font-medium text-gray-900">{{ patient.nombre }}</td>
                      <td class="text-center">
                        <span class="text-sm"
                          [class.text-blue-600]="patient.sexo === 'M'"
                          [class.text-pink-600]="patient.sexo === 'F'">
                          {{ patient.sexo === 'M' ? '♂ M' : '♀ F' }}
                        </span>
                      </td>
                      <td class="text-gray-500 text-sm">
                        {{ patient.fechaNacimiento | date:'dd/MM/yyyy' }}
                      </td>
                      <td class="text-right">
                        <button
                          (click)="openDetail(patient)"
                          class="btn-secondary btn-sm"
                        >
                          Ver historial →
                        </button>
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
                >← Anterior</button>
                <span class="text-sm text-gray-500">
                  {{ page()!.pagination.page }} / {{ page()!.pagination.total_pages }}
                </span>
                <button
                  (click)="goToPage(page()!.pagination.page + 1)"
                  class="btn-secondary btn-sm"
                  [disabled]="page()!.pagination.page >= page()!.pagination.total_pages"
                >Siguiente →</button>
              </div>
            }
          }
        </div>
      } @else {
        <app-empty-state icon="👤" title="Busca un paciente"
          description="Ingresa un nombre o número de documento para buscar" />
      }
    </div>

    <!-- Patient detail drawer -->
    @if (selectedPatient()) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" (click)="closeDetail()"></div>
        <div class="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 class="font-bold text-gray-900">Historial del paciente</h2>
            <button (click)="closeDetail()" class="btn-ghost btn-sm">✕</button>
          </div>

          @if (loadingDetail()) {
            <div class="p-6"><app-loading-spinner message="Cargando historial..." /></div>
          } @else if (patientDetail()) {
            <div class="p-6 space-y-6">
              <!-- Patient info -->
              <div class="card p-5">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    [class]="patientDetail()!.sexo === 'M' ? 'bg-blue-100' : 'bg-pink-100'">
                    {{ patientDetail()!.sexo === 'M' ? '♂' : '♀' }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-900 text-lg">{{ patientDetail()!.nombre }}</p>
                    <p class="text-sm text-gray-500">
                      {{ patientDetail()!.tipoDocumento }}: {{ patientDetail()!.identificacion }}
                    </p>
                  </div>
                </div>
                <dl class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt class="text-gray-400 text-xs">Fecha de nacimiento</dt>
                    <dd class="font-medium text-gray-900">
                      {{ patientDetail()!.fechaNacimiento | date:'dd/MM/yyyy' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-gray-400 text-xs">Total de órdenes</dt>
                    <dd class="font-bold text-blue-700 text-lg">{{ patientDetail()!.totalOrdenes }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Orders history -->
              <div>
                <h3 class="font-semibold text-gray-900 mb-3">Historial de órdenes</h3>
                @if (patientDetail()!.ordenes.length === 0) {
                  <p class="text-sm text-gray-400 text-center py-4">Sin órdenes registradas</p>
                } @else {
                  <div class="space-y-2">
                    @for (order of patientDetail()!.ordenes; track order.idSolicitudKey) {
                      <div class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-mono text-xs font-semibold text-blue-700">
                            {{ order.idSolicitudKey }}
                          </span>
                          <app-status-badge [status]="order.estadoDeLaOrden" />
                        </div>
                        <p class="text-xs text-gray-500">
                          {{ order.fechaDeLaOrden | date:'dd/MM/yyyy HH:mm' }}
                        </p>
                        <div class="flex items-center justify-between mt-2">
                          <p class="text-xs text-gray-400">{{ order.centroDeSalud }}</p>
                          @if (order.idAliado) {
                            <span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {{ order.idAliado }}
                            </span>
                          }
                        </div>
                        <a
                          [routerLink]="['/dashboard/orders', order.idSolicitudKey]"
                          class="btn-ghost btn-sm text-xs mt-2 w-full justify-center"
                        >
                          Ver orden →
                        </a>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class PatientsComponent implements OnInit {
  private readonly service = inject(PatientService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly page = signal<PatientsPage | null>(null);
  readonly selectedPatient = signal<Patient | null>(null);
  readonly patientDetail = signal<PatientDetail | null>(null);

  searchQuery = '';
  private currentPage = 1;

  ngOnInit(): void { this.loadPage(1); }

  loadPage(pageNum: number): void {
    this.loading.set(true);
    this.currentPage = pageNum;
    this.service.getPatients(this.searchQuery, pageNum).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loading.set(false); },
    });
  }

  search(): void { this.loadPage(1); }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadPage(1);
  }

  goToPage(p: number): void {
    const total = this.page()?.pagination.total_pages ?? 1;
    if (p < 1 || p > total) return;
    this.loadPage(p);
  }

  openDetail(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.loadingDetail.set(true);
    this.patientDetail.set(null);
    this.service.getPatient(patient.id).subscribe({
      next: (detail) => { this.patientDetail.set(detail); this.loadingDetail.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loadingDetail.set(false); },
    });
  }

  closeDetail(): void {
    this.selectedPatient.set(null);
    this.patientDetail.set(null);
  }
}
