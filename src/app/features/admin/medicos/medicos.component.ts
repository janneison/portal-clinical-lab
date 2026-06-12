import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MedicoService } from '../../../core/services/medico.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Medico, CreateMedicoRequest } from '../../../core/models/medico.model';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Médicos</h1>
          <p class="text-gray-500 text-sm mt-1">Catálogo de médicos que ordenan exámenes</p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nuevo médico</button>
      </div>

      <!-- Search + filter -->
      <div class="card p-4 flex gap-3 items-end">
        <div class="flex-1">
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
            class="input" placeholder="🔍 Buscar por nombre o documento..." />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-1">
          <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" class="rounded" />
          Mostrar inactivos
        </label>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ medicos().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ activeCount() }}</p>
          <p class="text-xs text-gray-500 mt-1">Activos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ filtered().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Filtrados</p>
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <app-loading-spinner message="Cargando médicos..." />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="👨‍⚕️" title="Sin médicos registrados"
          description="Agrega el primer médico al catálogo" />
      } @else {
        <div class="card overflow-hidden">
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Especialidad</th>
                  <th>Registro médico</th>
                  <th class="text-center">Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (medico of filtered(); track medico.id) {
                  <tr [class.opacity-50]="!medico.activo">
                    <td>
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {{ medico.tipoDocumento }}
                      </span>
                      <span class="ml-1 text-sm text-gray-700">{{ medico.identificacion }}</span>
                    </td>
                    <td class="font-medium text-gray-900">{{ medico.nombre }}</td>
                    <td class="text-gray-500 text-sm">{{ medico.especialidad || '—' }}</td>
                    <td class="text-gray-500 text-sm font-mono text-xs">
                      {{ medico.registroMedico || '—' }}
                    </td>
                    <td class="text-center">
                      <span class="badge text-xs"
                        [class]="medico.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                        {{ medico.activo ? '✅ Activo' : '⏸ Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex justify-end gap-1">
                        <button (click)="openEdit(medico)" class="btn-ghost btn-sm text-xs" title="Editar">✏️</button>
                        @if (medico.activo) {
                          <button (click)="deactivate(medico)"
                            class="btn-ghost btn-sm text-xs text-red-500" title="Desactivar">🗑️</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- Modal crear / editar -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">
              {{ editingMedico() ? 'Editar médico' : 'Nuevo médico' }}
            </h2>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Tipo documento *</label>
                <select formControlName="tipoDocumento" class="input">
                  <option value="">Selecciona</option>
                  <option value="CC">CC</option>
                  <option value="TP">TP</option>
                  <option value="CE">CE</option>
                  <option value="PA">PA</option>
                </select>
                @if (f['tipoDocumento'].invalid && f['tipoDocumento'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Identificación *</label>
                <input type="text" formControlName="identificacion" class="input" placeholder="12345678" />
                @if (f['identificacion'].invalid && f['identificacion'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>

            <div>
              <label class="label">Nombre completo *</label>
              <input type="text" formControlName="nombre" class="input" placeholder="Dr. Juan Rodríguez" />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Especialidad</label>
                <input type="text" formControlName="especialidad" class="input"
                  placeholder="Medicina General" />
              </div>
              <div>
                <label class="label">Registro médico</label>
                <input type="text" formControlName="registroMedico" class="input"
                  placeholder="RM-12345" />
              </div>
            </div>

            @if (editingMedico()) {
              <div>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" formControlName="activo" class="rounded" />
                  <span class="font-medium text-gray-700">Médico activo</span>
                </label>
              </div>
            }

            @if (submitError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ submitError() }}
              </div>
            }

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                {{ editingMedico() ? 'Guardar' : 'Crear médico' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class MedicosComponent implements OnInit {
  private readonly service = inject(MedicoService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showModal = signal(false);
  readonly editingMedico = signal<Medico | null>(null);
  readonly medicos = signal<Medico[]>([]);

  searchQuery = '';
  showInactive = false;

  readonly activeCount = computed(() => this.medicos().filter((m) => m.activo).length);
  readonly filtered = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.medicos().filter(
      (m) =>
        !q ||
        m.nombre.toLowerCase().includes(q) ||
        m.identificacion.toLowerCase().includes(q) ||
        (m.especialidad ?? '').toLowerCase().includes(q)
    );
  });

  readonly form = this.fb.group({
    tipoDocumento:  ['', Validators.required],
    identificacion: ['', Validators.required],
    nombre:         ['', Validators.required],
    especialidad:   [''],
    registroMedico: [''],
    activo:         [true],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void { this.load(); }

  onSearch(): void { /* filtered is computed — no action needed */ }

  load(): void {
    this.loading.set(true);
    this.service.getAll('', this.showInactive).subscribe({
      next: (list) => { this.medicos.set(list); this.loading.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.editingMedico.set(null);
    this.form.reset({ tipoDocumento: '', identificacion: '', nombre: '', especialidad: '', registroMedico: '', activo: true });
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEdit(medico: Medico): void {
    this.editingMedico.set(medico);
    this.form.patchValue({
      tipoDocumento:  medico.tipoDocumento,
      identificacion: medico.identificacion,
      nombre:         medico.nombre,
      especialidad:   medico.especialidad  ?? '',
      registroMedico: medico.registroMedico ?? '',
      activo:         medico.activo,
    });
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  deactivate(medico: Medico): void {
    this.service.delete(medico.id).subscribe({
      next: () => {
        this.medicos.update((list) =>
          list.map((m) => m.id === medico.id ? { ...m, activo: false } : m)
        );
        this.notifications.success('Médico desactivado', medico.nombre);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.submitError.set('');
    const v = this.form.getRawValue();
    const editing = this.editingMedico();

    if (editing) {
      this.service.update(editing.id, {
        tipoDocumento:  v.tipoDocumento!,
        identificacion: v.identificacion!,
        nombre:         v.nombre!,
        especialidad:   v.especialidad  || null,
        registroMedico: v.registroMedico || null,
        activo:         v.activo ?? true,
      }).subscribe({
        next: (updated) => {
          this.medicos.update((list) => list.map((m) => m.id === editing.id ? updated : m));
          this.notifications.success('Médico actualizado', updated.nombre);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (err: Error) => { this.submitError.set(err.message); this.submitting.set(false); },
      });
    } else {
      const payload: CreateMedicoRequest = {
        tipoDocumento:  v.tipoDocumento!,
        identificacion: v.identificacion!,
        nombre:         v.nombre!,
        especialidad:   v.especialidad  || null,
        registroMedico: v.registroMedico || null,
      };
      this.service.create(payload).subscribe({
        next: (created) => {
          this.medicos.update((list) => [created, ...list]);
          this.notifications.success('Médico creado', created.nombre);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (err: Error) => { this.submitError.set(err.message); this.submitting.set(false); },
      });
    }
  }
}
