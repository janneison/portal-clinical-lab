import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HealthCenterService } from '../../../core/services/health-center.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HealthCenter, CreateHealthCenterRequest } from '../../../core/models/health-center.model';

const KNOWN_ALIADOS = ['ALIADO-001', 'ALIADO-002'];

@Component({
  selector: 'app-health-centers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Centros de Salud</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de centros y su asociación con laboratorios</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" class="rounded" />
            Mostrar inactivos
          </label>
          <button (click)="openCreate()" class="btn-primary">+ Nuevo centro</button>
        </div>
      </div>

      <!-- Search + filter -->
      <div class="card p-4 flex gap-3">
        <input type="text" [(ngModel)]="search" class="input flex-1"
          placeholder="🔍 Buscar por nombre o ciudad..." />
        <select [(ngModel)]="filterAliado" class="input w-52">
          <option value="">Todos los laboratorios</option>
          @for (a of knownAliados; track a) {
            <option [value]="a">{{ a }}</option>
          }
        </select>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ centers().length }}</p>
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
        <app-loading-spinner message="Cargando centros de salud..." />
      } @else if (filtered().length === 0) {
        <app-empty-state icon="🏥" title="Sin centros registrados"
          description="Crea el primer centro de salud" />
      } @else {
        <div class="card overflow-hidden">
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Teléfono</th>
                  <th>Laboratorios</th>
                  <th class="text-center">Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (center of filtered(); track center.id) {
                  <tr [class.opacity-50]="!center.activo">
                    <td class="text-gray-400 text-xs font-mono">{{ center.id }}</td>
                    <td class="font-medium text-gray-900">{{ center.nombre }}</td>
                    <td class="text-gray-500 text-sm">{{ center.ciudad || '—' }}</td>
                    <td class="text-gray-500 text-sm">{{ center.telefono || '—' }}</td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @for (a of knownAliados; track a) {
                          <button
                            (click)="toggleAliado(center, a)"
                            class="text-xs px-2 py-0.5 rounded-full border transition-colors"
                            [class]="isAssociated(center, a)
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-300'"
                            [title]="isAssociated(center, a) ? 'Desasociar ' + a : 'Asociar ' + a"
                          >
                            {{ a }}
                            {{ isAssociated(center, a) ? '✓' : '+' }}
                          </button>
                        }
                      </div>
                    </td>
                    <td class="text-center">
                      <span class="badge text-xs"
                        [class]="center.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                        {{ center.activo ? '✅ Activo' : '⏸ Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex justify-end gap-1">
                        <button (click)="openEdit(center)" class="btn-ghost btn-sm text-xs" title="Editar">✏️</button>
                        <button (click)="toggleActive(center)" class="btn-ghost btn-sm text-xs"
                          [title]="center.activo ? 'Desactivar' : 'Activar'">
                          {{ center.activo ? '⏸' : '▶' }}
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
              {{ editingCenter() ? 'Editar centro de salud' : 'Nuevo centro de salud' }}
            </h2>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <div>
              <label class="label">Nombre *</label>
              <input type="text" formControlName="nombre" class="input" placeholder="Ej: Clínica Norte S.A." />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Ciudad</label>
                <input type="text" formControlName="ciudad" class="input" placeholder="Ej: Bogotá" />
              </div>
              <div>
                <label class="label">Teléfono</label>
                <input type="text" formControlName="telefono" class="input" placeholder="Ej: 601-7001000" />
              </div>
            </div>
            <div>
              <label class="label">Dirección</label>
              <input type="text" formControlName="direccion" class="input" placeholder="Ej: Calle 100 # 15-20" />
            </div>
            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="activo" class="rounded" />
                <span class="font-medium text-gray-700">Centro activo</span>
              </label>
            </div>
            @if (submitError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ submitError() }}</div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                {{ editingCenter() ? 'Guardar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class HealthCentersComponent implements OnInit {
  private readonly service = inject(HealthCenterService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly knownAliados = KNOWN_ALIADOS;
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showModal = signal(false);
  readonly editingCenter = signal<HealthCenter | null>(null);
  readonly centers = signal<HealthCenter[]>([]);

  showInactive = false;
  search = '';
  filterAliado = '';

  readonly activeCount = computed(() => this.centers().filter((c) => c.activo).length);
  readonly filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.centers().filter((c) => {
      const matchSearch = !q || c.nombre.toLowerCase().includes(q) || (c.ciudad ?? '').toLowerCase().includes(q);
      const matchAliado = !this.filterAliado || this.isAssociated(c, this.filterAliado);
      return matchSearch && matchAliado;
    });
  });

  readonly form = this.fb.group({
    nombre:    ['', Validators.required],
    ciudad:    [''],
    direccion: [''],
    telefono:  [''],
    activo:    [true],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getHealthCenters(this.showInactive).subscribe({
      next: (list) => { this.centers.set(list); this.loading.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loading.set(false); },
    });
  }

  isAssociated(center: HealthCenter, aliadoId: string): boolean {
    return (center.aliados ?? []).includes(aliadoId);
  }

  toggleAliado(center: HealthCenter, aliadoId: string): void {
    const associated = this.isAssociated(center, aliadoId);
    const obs = associated
      ? this.service.dissociateAliado(center.id, aliadoId)
      : this.service.associateAliado(center.id, aliadoId);

    obs.subscribe({
      next: () => {
        this.centers.update((list) =>
          list.map((c) => {
            if (c.id !== center.id) return c;
            const aliados = c.aliados ?? [];
            return {
              ...c,
              aliados: associated
                ? aliados.filter((a) => a !== aliadoId)
                : [...aliados, aliadoId],
            };
          })
        );
        this.notifications.success(
          associated ? 'Laboratorio desasociado' : 'Laboratorio asociado',
          `${aliadoId} — ${center.nombre}`
        );
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  toggleActive(center: HealthCenter): void {
    this.service.updateHealthCenter(center.id, { activo: !center.activo }).subscribe({
      next: () => {
        this.centers.update((list) =>
          list.map((c) => (c.id === center.id ? { ...c, activo: !c.activo } : c))
        );
        this.notifications.success(center.activo ? 'Centro desactivado' : 'Centro activado', center.nombre);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  openCreate(): void {
    this.editingCenter.set(null);
    this.form.reset({ nombre: '', ciudad: '', direccion: '', telefono: '', activo: true });
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEdit(center: HealthCenter): void {
    this.editingCenter.set(center);
    this.form.patchValue({ nombre: center.nombre, ciudad: center.ciudad ?? '', direccion: center.direccion ?? '', telefono: center.telefono ?? '', activo: center.activo });
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.submitError.set('');
    const v = this.form.value;
    const editing = this.editingCenter();

    const payload: CreateHealthCenterRequest = {
      nombre:    v.nombre!,
      ciudad:    v.ciudad || null,
      direccion: v.direccion || null,
      telefono:  v.telefono || null,
      activo:    v.activo ?? true,
    };

    const obs = editing
      ? this.service.updateHealthCenter(editing.id, payload)
      : this.service.createHealthCenter(payload);

    obs.subscribe({
      next: (res) => {
        if (!editing) {
          const created = res as { id: number; message: string };
          const newCenter: HealthCenter = {
            id:        created.id,
            nombre:    payload.nombre,
            ciudad:    payload.ciudad    ?? null,
            direccion: payload.direccion ?? null,
            telefono:  payload.telefono  ?? null,
            activo:    payload.activo    ?? true,
            aliados:   [],
          };
          this.centers.update((list) => [newCenter, ...list]);
        } else {
          this.centers.update((list) =>
            list.map((c) => (c.id === editing!.id ? { ...c, ...payload } : c))
          );
        }
        this.notifications.success(editing ? 'Centro actualizado' : 'Centro creado', payload.nombre);
        this.closeModal();
        this.submitting.set(false);
      },
      error: (err: Error) => { this.submitError.set(err.message); this.submitting.set(false); },
    });
  }
}
