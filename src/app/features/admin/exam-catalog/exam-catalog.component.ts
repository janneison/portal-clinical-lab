import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ExamCatalogService } from '../../../core/services/exam-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ExamType, CreateExamTypeRequest, UpdateExamTypeRequest } from '../../../core/models/exam-catalog.model';

@Component({
  selector: 'app-exam-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Catálogo de Exámenes</h1>
          <p class="text-gray-500 text-sm mt-1">Tipos de examen y sus códigos CUPS</p>
        </div>
        <div class="flex gap-2">
          <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" class="rounded" />
            Mostrar inactivos
          </label>
          <button (click)="openCreate()" class="btn-primary">+ Nuevo examen</button>
        </div>
      </div>

      <!-- Search -->
      <div class="card p-4">
        <input
          type="text"
          [(ngModel)]="search"
          class="input"
          placeholder="🔍 Buscar por CUPS o nombre..."
        />
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ examTypes().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ activeCount() }}</p>
          <p class="text-xs text-gray-500 mt-1">Activos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-400">{{ inactiveCount() }}</p>
          <p class="text-xs text-gray-500 mt-1">Inactivos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ filtered().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Filtrados</p>
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <app-loading-spinner message="Cargando catálogo..." />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="🔬" title="Sin exámenes" description="No hay tipos de examen que coincidan" />
      } @else {
        <div class="card overflow-hidden">
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th>CUPS</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center">Parámetros</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (exam of filtered(); track exam.cups) {
                  <tr>
                    <td>
                      <span class="font-mono text-sm font-semibold text-blue-700">
                        {{ exam.cups }}
                      </span>
                    </td>
                    <td class="font-medium text-gray-900">{{ exam.nombre }}</td>
                    <td class="text-gray-500 text-sm max-w-xs truncate" [title]="exam.descripcion ?? ''">
                      {{ exam.descripcion || '—' }}
                    </td>
                    <td class="text-center">
                      <span
                        class="badge text-xs"
                        [class]="exam.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                      >
                        {{ exam.activo ? '✅ Activo' : '⏸ Inactivo' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <a
                        [routerLink]="['/dashboard/admin/exam-catalog', exam.cups, 'parameters']"
                        class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver parámetros →
                      </a>
                    </td>
                    <td class="text-right">
                      <div class="flex justify-end gap-1">
                        <button
                          (click)="openEdit(exam)"
                          class="btn-ghost btn-sm text-xs"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          (click)="toggleActive(exam)"
                          class="btn-ghost btn-sm text-xs"
                          [title]="exam.activo ? 'Desactivar' : 'Activar'"
                        >
                          {{ exam.activo ? '⏸' : '▶' }}
                        </button>
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
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">
              {{ editingExam() ? 'Editar examen' : 'Nuevo tipo de examen' }}
            </h2>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            @if (!editingExam()) {
              <div>
                <label class="label">Código CUPS *</label>
                <input type="text" formControlName="cups" class="input"
                  placeholder="Ej: 903820" autocomplete="off" />
                @if (f['cups'].invalid && f['cups'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            }

            <div>
              <label class="label">Nombre del examen *</label>
              <input type="text" formControlName="nombre" class="input"
                placeholder="Ej: Hemograma Completo" />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>

            <div>
              <label class="label">Descripción</label>
              <textarea formControlName="descripcion" class="input resize-none" rows="3"
                placeholder="Descripción opcional del examen"></textarea>
            </div>

            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="activo" class="rounded" />
                <span class="font-medium text-gray-700">Examen activo</span>
              </label>
            </div>

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
                {{ editingExam() ? 'Guardar cambios' : 'Crear examen' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class ExamCatalogComponent implements OnInit {
  private readonly service = inject(ExamCatalogService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showModal = signal(false);
  readonly editingExam = signal<ExamType | null>(null);
  readonly examTypes = signal<ExamType[]>([]);

  showInactive = false;
  search = '';

  readonly activeCount = computed(() => this.examTypes().filter((e) => e.activo).length);
  readonly inactiveCount = computed(() => this.examTypes().filter((e) => !e.activo).length);
  readonly filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.examTypes().filter(
      (e) =>
        e.cups.toLowerCase().includes(q) ||
        e.nombre.toLowerCase().includes(q) ||
        (e.descripcion ?? '').toLowerCase().includes(q)
    );
  });

  readonly form = this.fb.group({
    cups:        ['', Validators.required],
    nombre:      ['', Validators.required],
    descripcion: [''],
    activo:      [true],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getExamTypes(this.showInactive).subscribe({
      next: (list) => { this.examTypes.set(list); this.loading.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.editingExam.set(null);
    this.form.reset({ cups: '', nombre: '', descripcion: '', activo: true });
    this.form.get('cups')?.enable();
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEdit(exam: ExamType): void {
    this.editingExam.set(exam);
    this.form.patchValue({ cups: exam.cups, nombre: exam.nombre, descripcion: exam.descripcion ?? '', activo: exam.activo });
    this.form.get('cups')?.disable();
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  toggleActive(exam: ExamType): void {
    this.service.updateExamType(exam.cups, { activo: !exam.activo }).subscribe({
      next: () => {
        this.examTypes.update((list) =>
          list.map((e) => (e.cups === exam.cups ? { ...e, activo: !e.activo } : e))
        );
        this.notifications.success(exam.activo ? 'Examen desactivado' : 'Examen activado', exam.nombre);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    this.submitError.set('');
    const v = this.form.getRawValue();
    const editing = this.editingExam();

    const obs = editing
      ? this.service.updateExamType(editing.cups, { nombre: v.nombre!, descripcion: v.descripcion || null, activo: v.activo! } as UpdateExamTypeRequest)
      : this.service.createExamType({ cups: v.cups!, nombre: v.nombre!, descripcion: v.descripcion || null, activo: v.activo! } as CreateExamTypeRequest);

    obs.subscribe({
      next: () => {
        this.notifications.success(editing ? 'Examen actualizado' : 'Examen creado');
        this.closeModal();
        this.load();
        this.submitting.set(false);
      },
      error: (err: Error) => {
        this.submitError.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
