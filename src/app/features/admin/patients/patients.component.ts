import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Patient, PatientDetail, PatientsPage, CreatePatientRequest } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p class="text-gray-500 text-sm mt-1">
            Los pacientes también se crean automáticamente al registrar una orden
          </p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nuevo paciente</button>
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
                    <th>Email</th>
                    <th>Teléfono</th>
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
                      <td class="text-gray-500 text-sm">{{ patient.email || '—' }}</td>
                      <td class="text-gray-500 text-sm">{{ patient.telefono || '—' }}</td>
                      <td class="text-right">
                        <div class="flex justify-end gap-1">
                          <button (click)="openEdit(patient)" class="btn-ghost btn-sm text-xs" title="Editar">✏️</button>
                          <button (click)="openDetail(patient)" class="btn-secondary btn-sm">
                            Ver historial →
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (page()!.pagination.total_pages > 1) {
              <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button (click)="goToPage(page()!.pagination.page - 1)" class="btn-secondary btn-sm"
                  [disabled]="page()!.pagination.page <= 1">← Anterior</button>
                <span class="text-sm text-gray-500">
                  {{ page()!.pagination.page }} / {{ page()!.pagination.total_pages }}
                </span>
                <button (click)="goToPage(page()!.pagination.page + 1)" class="btn-secondary btn-sm"
                  [disabled]="page()!.pagination.page >= page()!.pagination.total_pages">Siguiente →</button>
              </div>
            }
          }
        </div>
      } @else {
        <app-empty-state icon="👤" title="Busca un paciente"
          description="Ingresa un nombre o número de documento para buscar, o crea uno nuevo" />
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
                  @if (patientDetail()!.email) {
                    <div>
                      <dt class="text-gray-400 text-xs">Email</dt>
                      <dd class="font-medium text-gray-900">{{ patientDetail()!.email }}</dd>
                    </div>
                  }
                  @if (patientDetail()!.telefono) {
                    <div>
                      <dt class="text-gray-400 text-xs">Teléfono</dt>
                      <dd class="font-medium text-gray-900">{{ patientDetail()!.telefono }}</dd>
                    </div>
                  }
                </dl>
              </div>

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
                        <a [routerLink]="['/dashboard/orders', order.idSolicitudKey]"
                          class="btn-ghost btn-sm text-xs mt-2 w-full justify-center">
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

    <!-- Modal editar paciente -->
    @if (showEditModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeEdit()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Editar paciente</h2>
            <p class="text-sm text-gray-500 mt-0.5 font-mono">
              {{ editingPatient()?.tipoDocumento }}: {{ editingPatient()?.identificacion }}
            </p>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Tipo documento *</label>
                <select formControlName="tipoDocumento" class="input">
                  <option value="">Selecciona</option>
                  <option value="CC">CC — Cédula</option>
                  <option value="TI">TI — Tarjeta Identidad</option>
                  <option value="PA">PA — Pasaporte</option>
                  <option value="CE">CE — Cédula Extranjería</option>
                  <option value="RC">RC — Registro Civil</option>
                  <option value="MS">MS — Menor sin ID</option>
                </select>
                @if (ef['tipoDocumento'].invalid && ef['tipoDocumento'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Número de documento *</label>
                <input type="text" formControlName="identificacion" class="input" />
                @if (ef['identificacion'].invalid && ef['identificacion'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>
            <div>
              <label class="label">Nombre completo *</label>
              <input type="text" formControlName="nombre" class="input" />
              @if (ef['nombre'].invalid && ef['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Sexo *</label>
                <select formControlName="sexo" class="input">
                  <option value="">Selecciona</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                @if (ef['sexo'].invalid && ef['sexo'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Fecha de nacimiento *</label>
                <input type="date" formControlName="fechaNacimiento" class="input" />
                @if (ef['fechaNacimiento'].invalid && ef['fechaNacimiento'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Email</label>
                <input type="email" formControlName="email" class="input" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label class="label">Teléfono</label>
                <input type="tel" formControlName="telefono" class="input" placeholder="3001234567" />
              </div>
            </div>
            @if (editError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ editError() }}
              </div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeEdit()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="updating()">
                @if (updating()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal crear paciente -->
    @if (showCreateModal()) {      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeCreate()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Nuevo paciente</h2>
            <p class="text-sm text-gray-500 mt-0.5">
              Los pacientes también se crean automáticamente al registrar una orden
            </p>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="p-6 space-y-4">
            <!-- Documento -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Tipo documento *</label>
                <select formControlName="tipoDocumento" class="input">
                  <option value="">Selecciona</option>
                  <option value="CC">CC — Cédula</option>
                  <option value="TI">TI — Tarjeta Identidad</option>
                  <option value="PA">PA — Pasaporte</option>
                  <option value="CE">CE — Cédula Extranjería</option>
                  <option value="RC">RC — Registro Civil</option>
                  <option value="MS">MS — Menor sin ID</option>
                </select>
                @if (f['tipoDocumento'].invalid && f['tipoDocumento'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Número de documento *</label>
                <input type="text" formControlName="identificacion" class="input" placeholder="1020304050" />
                @if (f['identificacion'].invalid && f['identificacion'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>

            <!-- Nombre -->
            <div>
              <label class="label">Nombre completo *</label>
              <input type="text" formControlName="nombre" class="input" placeholder="Carlos Andrés Pérez López" />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>

            <!-- Sexo y fecha nacimiento -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Sexo *</label>
                <select formControlName="sexo" class="input">
                  <option value="">Selecciona</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                @if (f['sexo'].invalid && f['sexo'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Fecha de nacimiento *</label>
                <input type="date" formControlName="fechaNacimiento" class="input" />
                @if (f['fechaNacimiento'].invalid && f['fechaNacimiento'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>

            <!-- Contacto -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Email</label>
                <input type="email" formControlName="email" class="input" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label class="label">Teléfono</label>
                <input type="tel" formControlName="telefono" class="input" placeholder="3001234567" />
              </div>
            </div>

            @if (createError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ createError() }}
              </div>
            }

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeCreate()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="creating()">
                @if (creating()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Crear paciente
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class PatientsComponent implements OnInit {
  private readonly service = inject(PatientService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly page = signal<PatientsPage | null>(null);
  readonly selectedPatient = signal<Patient | null>(null);
  readonly patientDetail = signal<PatientDetail | null>(null);

  // Create
  readonly showCreateModal = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');

  readonly createForm = this.fb.group({
    tipoDocumento:   ['', Validators.required],
    identificacion:  ['', Validators.required],
    nombre:          ['', Validators.required],
    sexo:            ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    email:           [''],
    telefono:        [''],
  });

  get f() { return this.createForm.controls; }

  // Edit
  readonly showEditModal = signal(false);
  readonly updating = signal(false);
  readonly editError = signal('');
  readonly editingPatient = signal<Patient | null>(null);

  readonly editForm = this.fb.group({
    tipoDocumento:   ['', Validators.required],
    identificacion:  ['', Validators.required],
    nombre:          ['', Validators.required],
    sexo:            ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    email:           [''],
    telefono:        [''],
  });

  get ef() { return this.editForm.controls; }

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

  // ─── Create ───────────────────────────────────────────────────────────────

  openCreate(): void {
    this.createForm.reset();
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreate(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    this.createError.set('');
    const v = this.createForm.value;

    const payload: CreatePatientRequest = {
      tipoDocumento:   v.tipoDocumento!,
      identificacion:  v.identificacion!,
      nombre:          v.nombre!,
      sexo:            v.sexo as 'M' | 'F',
      fechaNacimiento: v.fechaNacimiento!,
      email:           v.email   || null,
      telefono:        v.telefono || null,
    };

    this.service.createPatient(payload).subscribe({
      next: (created) => {
        // Add to current list if page is loaded
        if (this.page()) {
          this.page.update((p) => p ? {
            ...p,
            data: [created, ...p.data],
            pagination: { ...p.pagination, total: p.pagination.total + 1 },
          } : p);
        }
        this.notifications.success('Paciente creado', created.nombre);
        this.closeCreate();
        this.creating.set(false);
      },
      error: (err: Error) => {
        this.createError.set(err.message);
        this.creating.set(false);
      },
    });
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────

  openEdit(patient: Patient): void {
    this.editingPatient.set(patient);
    this.editForm.patchValue({
      tipoDocumento:   patient.tipoDocumento,
      identificacion:  patient.identificacion,
      nombre:          patient.nombre,
      sexo:            patient.sexo,
      fechaNacimiento: patient.fechaNacimiento,
      email:           patient.email    ?? '',
      telefono:        patient.telefono ?? '',
    });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEdit(): void { this.showEditModal.set(false); }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const patient = this.editingPatient();
    if (!patient) return;

    this.updating.set(true);
    this.editError.set('');
    const v = this.editForm.value;

    this.service.updatePatient(patient.id, {
      tipoDocumento:   v.tipoDocumento!,
      identificacion:  v.identificacion!,
      nombre:          v.nombre!,
      sexo:            v.sexo as 'M' | 'F',
      fechaNacimiento: v.fechaNacimiento!,
      email:           v.email    || null,
      telefono:        v.telefono || null,
    }).subscribe({
      next: (updated) => {
        this.page.update((p) => p ? {
          ...p,
          data: p.data.map((x) => x.id === patient.id ? updated : x),
        } : p);
        this.notifications.success('Paciente actualizado', updated.nombre);
        this.closeEdit();
        this.updating.set(false);
      },
      error: (err: Error) => {
        this.editError.set(err.message);
        this.updating.set(false);
      },
    });
  }
}
