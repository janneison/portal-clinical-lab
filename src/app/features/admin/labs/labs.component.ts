import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AliadoService } from '../../../core/services/aliado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Aliado, CreateAliadoRequest, UpdateAliadoRequest } from '../../../core/models/aliado.model';

@Component({
  selector: 'app-labs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EmptyStateComponent, LoadingSpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Laboratorios Clínicos</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de laboratorios aliados y su perfil</p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nuevo laboratorio</button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ labs().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ activeLabs() }}</p>
          <p class="text-xs text-gray-500 mt-1">Activos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-400">{{ inactiveLabs() }}</p>
          <p class="text-xs text-gray-500 mt-1">Inactivos</p>
        </div>
      </div>

      <!-- Labs grid -->
      @if (loading()) {
        <app-loading-spinner message="Cargando laboratorios..." />
      } @else if (labs().length === 0) {
        <app-empty-state icon="🏥" title="Sin laboratorios registrados"
          description="Agrega el primer laboratorio aliado" />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (lab of labs(); track lab.id) {
            <div class="card p-5 flex flex-col gap-3" [class.opacity-60]="!lab.activo">
              <!-- Logo + header -->
              <div class="flex items-start gap-3">
                <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                  @if (lab.logoPath) {
                    <img [src]="apiBase + lab.logoPath" alt="Logo" class="w-full h-full object-contain p-1" />
                  } @else {
                    <span class="text-2xl">🏥</span>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 truncate">{{ lab.nombre }}</p>
                  <p class="text-xs font-mono text-blue-600">{{ lab.id }}</p>
                  <span class="badge text-xs mt-1"
                    [class]="lab.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ lab.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>

              <!-- Profile info -->
              <div class="space-y-1 text-xs text-gray-500">
                @if (lab.nit) {
                  <p>🪪 NIT: <span class="font-medium text-gray-700">{{ lab.nit }}</span></p>
                }
                @if (lab.email) {
                  <p>📧 <span class="font-medium text-gray-700">{{ lab.email }}</span></p>
                }
                @if (lab.direccion) {
                  <p>📍 {{ lab.direccion }}</p>
                }
                @if (!lab.logoPath) {
                  <p class="text-orange-500">⚠️ Sin logo</p>
                }
              </div>

              <!-- Actions -->
              <div class="flex gap-2 mt-auto pt-2 border-t border-gray-100 flex-wrap">
                <button (click)="openEdit(lab)" class="btn-ghost btn-sm text-xs flex-1">✏️ Editar</button>
                <button (click)="openLogo(lab)" class="btn-ghost btn-sm text-xs flex-1 text-blue-600">
                  🖼️ {{ lab.logoPath ? 'Cambiar logo' : 'Subir logo' }}
                </button>
                <button (click)="toggleActive(lab)" class="btn-ghost btn-sm text-xs w-full"
                  [class.text-red-600]="lab.activo" [class.text-green-600]="!lab.activo">
                  {{ lab.activo ? '⏸ Desactivar' : '▶ Activar' }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal crear (solo ID + nombre) -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeCreateModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Nuevo laboratorio</h2>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="p-6 space-y-4">
            <div>
              <label class="label">ID del laboratorio *</label>
              <input type="text" formControlName="id" class="input" placeholder="Ej: ALIADO-003" autocomplete="off" />
              <p class="text-xs text-gray-400 mt-1">Identificador único. Ej: ALIADO-001, LAB-NORTE</p>
              @if (cf['id'].invalid && cf['id'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Nombre *</label>
              <input type="text" formControlName="nombre" class="input" placeholder="Laboratorio Clínico Norte" />
              @if (cf['nombre'].invalid && cf['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">NIT</label>
                <input type="text" formControlName="nit" class="input" placeholder="900123456-7" />
              </div>
              <div>
                <label class="label">Email</label>
                <input type="email" formControlName="email" class="input" placeholder="contacto@lab.com" />
              </div>
            </div>
            <div>
              <label class="label">Dirección</label>
              <input type="text" formControlName="direccion" class="input" placeholder="Calle 100 # 15-20, Bogotá" />
            </div>
            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="activo" class="rounded" />
                <span class="font-medium text-gray-700">Laboratorio activo</span>
              </label>
            </div>
            @if (createError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ createError() }}</div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeCreateModal()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="creating()">
                @if (creating()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal editar perfil -->
    @if (showEditModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeEditModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Editar perfil</h2>
            <p class="text-sm text-gray-500 mt-0.5 font-mono">{{ editingLab()?.id }}</p>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="p-6 space-y-4">
            <div>
              <label class="label">Nombre *</label>
              <input type="text" formControlName="nombre" class="input" />
              @if (ef['nombre'].invalid && ef['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">NIT</label>
                <input type="text" formControlName="nit" class="input" placeholder="900123456-7" />
              </div>
              <div>
                <label class="label">Email</label>
                <input type="email" formControlName="email" class="input" placeholder="contacto@lab.com" />
              </div>
            </div>
            <div>
              <label class="label">Dirección</label>
              <input type="text" formControlName="direccion" class="input" placeholder="Calle 100 # 15-20, Bogotá" />
            </div>
            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="activo" class="rounded" />
                <span class="font-medium text-gray-700">Laboratorio activo</span>
              </label>
            </div>
            @if (editError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ editError() }}</div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeEditModal()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="editing()">
                @if (editing()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal subir logo -->
    @if (showLogoModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeLogoModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Logo del laboratorio</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ logoTarget()?.nombre }}</p>
          </div>
          <div class="p-6 space-y-4">
            @if (logoPreview()) {
              <div class="border border-gray-200 rounded-xl p-3 bg-gray-50 text-center">
                <img [src]="logoPreview()!" alt="Preview" class="max-h-24 mx-auto object-contain" />
              </div>
            }
            <div>
              <label class="label">Selecciona imagen (PNG o JPG, máx 2 MB)</label>
              <input type="file" accept="image/png,image/jpeg" (change)="onLogoSelected($event)" class="input text-sm" />
            </div>
            @if (logoError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ logoError() }}</div>
            }
            <div class="flex gap-3">
              <button (click)="closeLogoModal()" class="btn-secondary flex-1">Cancelar</button>
              <button (click)="uploadLogo()" class="btn-primary flex-1"
                [disabled]="!logoFile() || logoUploading()">
                @if (logoUploading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Subir logo
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LabsComponent implements OnInit {
  private readonly aliadoService = inject(AliadoService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly apiBase = 'http://localhost:8080';

  readonly loading = signal(false);
  readonly labs = signal<Aliado[]>([]);

  readonly activeLabs = computed(() => this.labs().filter((l) => l.activo).length);
  readonly inactiveLabs = computed(() => this.labs().filter((l) => !l.activo).length);

  // Create
  readonly showCreateModal = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly createForm = this.fb.group({
    id:        ['', Validators.required],
    nombre:    ['', Validators.required],
    nit:       [''],
    direccion: [''],
    email:     [''],
    activo:    [true],
  });
  get cf() { return this.createForm.controls; }

  // Edit
  readonly showEditModal = signal(false);
  readonly editing = signal(false);
  readonly editError = signal('');
  readonly editingLab = signal<Aliado | null>(null);
  readonly editForm = this.fb.group({
    nombre:    ['', Validators.required],
    nit:       [''],
    email:     [''],
    direccion: [''],
    activo:    [true],
  });
  get ef() { return this.editForm.controls; }

  // Logo
  readonly showLogoModal = signal(false);
  readonly logoTarget = signal<Aliado | null>(null);
  readonly logoFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly logoUploading = signal(false);
  readonly logoError = signal('');

  ngOnInit(): void { this.loadLabs(); }

  loadLabs(): void {
    this.loading.set(true);
    this.aliadoService.getAll().subscribe({
      next: (list) => { this.labs.set(list); this.loading.set(false); },
      error: () => {
        // Fallback to known aliados if endpoint not available
        this.labs.set([
          { id: 'ALIADO-001', nombre: 'Laboratorio Clínico Norte', nit: null, direccion: null, email: null, logoPath: null, activo: true },
          { id: 'ALIADO-002', nombre: 'Laboratorio Clínico Sur',   nit: null, direccion: null, email: null, logoPath: null, activo: true },
        ]);
        this.loading.set(false);
      },
    });
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  openCreate(): void {
    this.createForm.reset({ id: '', nombre: '', nit: '', email: '', direccion: '', activo: true });
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    this.createError.set('');
    const v = this.createForm.value;

    const payload: CreateAliadoRequest = {
      id:        v.id!,
      nombre:    v.nombre!,
      nit:       v.nit       || null,
      direccion: v.direccion || null,
      email:     v.email     || null,
      activo:    v.activo    ?? true,
    };

    this.aliadoService.create(payload).subscribe({
      next: (created) => {
        this.labs.update((list) => [created, ...list]);
        this.notifications.success('Laboratorio creado', created.nombre);
        this.closeCreateModal();
        this.creating.set(false);
      },
      error: (err: Error) => {
        this.createError.set(err.message);
        this.creating.set(false);
      },
    });
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────

  openEdit(lab: Aliado): void {
    this.editingLab.set(lab);
    this.editForm.patchValue({ nombre: lab.nombre, nit: lab.nit ?? '', email: lab.email ?? '', direccion: lab.direccion ?? '', activo: lab.activo });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void { this.showEditModal.set(false); }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const lab = this.editingLab();
    if (!lab) return;
    this.editing.set(true);
    this.editError.set('');
    const v = this.editForm.value;
    const payload: UpdateAliadoRequest = {
      nombre:    v.nombre!,
      nit:       v.nit || null,
      email:     v.email || null,
      direccion: v.direccion || null,
      activo:    v.activo ?? true,
    };
    this.aliadoService.update(lab.id, payload).subscribe({
      next: (res) => {
        this.labs.update((list) => list.map((l) => l.id === lab.id ? res.aliado : l));
        this.notifications.success('Laboratorio actualizado', res.aliado.nombre);
        this.closeEditModal();
        this.editing.set(false);
      },
      error: (err: Error) => { this.editError.set(err.message); this.editing.set(false); },
    });
  }

  toggleActive(lab: Aliado): void {
    this.aliadoService.update(lab.id, { nombre: lab.nombre, activo: !lab.activo }).subscribe({
      next: (res) => {
        this.labs.update((list) => list.map((l) => l.id === lab.id ? res.aliado : l));
        this.notifications.success(lab.activo ? 'Laboratorio desactivado' : 'Laboratorio activado', lab.nombre);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  // ─── Logo ─────────────────────────────────────────────────────────────────

  openLogo(lab: Aliado): void {
    this.logoTarget.set(lab);
    this.logoFile.set(null);
    this.logoPreview.set(null);
    this.logoError.set('');
    this.showLogoModal.set(true);
  }

  closeLogoModal(): void { this.showLogoModal.set(false); }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.logoError.set('El archivo supera el tamaño máximo de 2 MB'); return; }
    this.logoFile.set(file);
    this.logoError.set('');
    const reader = new FileReader();
    reader.onload = (e) => this.logoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    const lab = this.logoTarget();
    const file = this.logoFile();
    if (!lab || !file) return;
    this.logoUploading.set(true);
    this.aliadoService.uploadLogo(lab.id, file).subscribe({
      next: (res) => {
        this.labs.update((list) => list.map((l) => l.id === lab.id ? { ...l, logoPath: res.logoPath } : l));
        this.notifications.success('Logo actualizado', lab.nombre);
        this.closeLogoModal();
        this.logoUploading.set(false);
      },
      error: (err: Error) => { this.logoError.set(err.message); this.logoUploading.set(false); },
    });
  }
}
