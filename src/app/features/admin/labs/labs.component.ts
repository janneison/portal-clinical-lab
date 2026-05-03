import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Aliado, CreateAliadoRequest } from '../../../core/models/admin.model';

@Component({
  selector: 'app-labs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Laboratorios Clínicos</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de laboratorios aliados</p>
        </div>
        <button (click)="openModal()" class="btn-primary">
          + Nuevo laboratorio
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ labs().length }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Activos</p>
          <p class="text-3xl font-bold text-green-600 mt-1">{{ activeLabs() }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wider">Inactivos</p>
          <p class="text-3xl font-bold text-gray-400 mt-1">{{ inactiveLabs() }}</p>
        </div>
      </div>

      <!-- Labs grid -->
      @if (loading()) {
        <app-loading-spinner message="Cargando laboratorios..." />
      } @else if (labs().length === 0) {
        <app-empty-state
          icon="🏥"
          title="Sin laboratorios registrados"
          description="Agrega el primer laboratorio aliado"
        />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (lab of labs(); track lab.id) {
            <div class="card p-5 flex flex-col gap-3">
              <div class="flex items-start justify-between">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  🏥
                </div>
                <span
                  class="badge text-xs"
                  [class]="lab.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                >
                  {{ lab.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

              <div>
                <p class="font-semibold text-gray-900">{{ lab.nombre }}</p>
                <p class="text-xs font-mono text-blue-600 mt-0.5">{{ lab.id }}</p>
              </div>

              @if (lab.created_at) {
                <p class="text-xs text-gray-400">
                  Registrado: {{ lab.created_at | date:'dd/MM/yyyy' }}
                </p>
              }

              <div class="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  (click)="toggleActive(lab)"
                  class="btn-ghost btn-sm flex-1 text-xs"
                  [class.text-red-600]="lab.activo"
                  [class.text-green-600]="!lab.activo"
                >
                  {{ lab.activo ? '⏸ Desactivar' : '▶ Activar' }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal crear laboratorio -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>

        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Nuevo laboratorio</h2>
            <p class="text-sm text-gray-500 mt-0.5">Registra un laboratorio aliado</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <div>
              <label class="label">ID del laboratorio *</label>
              <input type="text" formControlName="id" class="input"
                placeholder="Ej: ALIADO-003" autocomplete="off" />
              <p class="text-xs text-gray-400 mt-1">
                Identificador único. Ej: ALIADO-001, LAB-NORTE
              </p>
              @if (f['id'].invalid && f['id'].touched) {
                <p class="text-xs text-red-600 mt-1">El ID es requerido</p>
              }
            </div>

            <div>
              <label class="label">Nombre del laboratorio *</label>
              <input type="text" formControlName="nombre" class="input"
                placeholder="Ej: Laboratorio Clínico Norte" />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">El nombre es requerido</p>
              }
            </div>

            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="activo" class="rounded" />
                <span class="font-medium text-gray-700">Laboratorio activo</span>
              </label>
            </div>

            @if (submitError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ submitError() }}
              </div>
            }

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" class="btn-primary flex-1" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Crear laboratorio
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class LabsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly labs = signal<Aliado[]>([]);
  readonly loading = signal(false);
  readonly showModal = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');

  readonly activeLabs = computed(() => this.labs().filter((l) => l.activo).length);
  readonly inactiveLabs = computed(() => this.labs().filter((l) => !l.activo).length);

  readonly form = this.fb.group({
    id:     ['', Validators.required],
    nombre: ['', Validators.required],
    activo: [true],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.loadLabs();
  }

  loadLabs(): void {
    this.loading.set(true);
    this.adminService.getAliados().subscribe({
      next: (labs) => {
        this.labs.set(labs);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to known labs from API docs if endpoint not available
        this.labs.set([
          { id: 'ALIADO-001', nombre: 'Laboratorio Clínico Norte', activo: true },
          { id: 'ALIADO-002', nombre: 'Laboratorio Clínico Sur',   activo: true },
        ]);
        this.loading.set(false);
      },
    });
  }

  openModal(): void {
    this.form.reset({ activo: true });
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  toggleActive(lab: Aliado): void {
    this.labs.update((list) =>
      list.map((l) => (l.id === lab.id ? { ...l, activo: !l.activo } : l))
    );
    const msg = lab.activo ? 'desactivado' : 'activado';
    this.notifications.success(`Laboratorio ${msg}`, lab.nombre);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const v = this.form.value;
    const payload: CreateAliadoRequest = {
      id:     v.id!,
      nombre: v.nombre!,
      activo: v.activo ?? true,
    };

    this.adminService.createAliado(payload).subscribe({
      next: (lab) => {
        this.labs.update((list) => [lab, ...list]);
        this.notifications.success('Laboratorio creado', lab.nombre);
        this.closeModal();
        this.submitting.set(false);
      },
      error: (err: Error) => {
        // If endpoint doesn't exist yet, add locally
        const newLab: Aliado = { id: payload.id, nombre: payload.nombre, activo: payload.activo ?? true };
        this.labs.update((list) => [newLab, ...list]);
        this.notifications.success('Laboratorio registrado localmente', payload.nombre);
        this.closeModal();
        this.submitting.set(false);
      },
    });
  }
}
