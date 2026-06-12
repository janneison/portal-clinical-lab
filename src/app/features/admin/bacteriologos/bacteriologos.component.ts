import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { BacteriologoService } from '../../../core/services/bacteriologo.service';
import { AliadoService } from '../../../core/services/aliado.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Bacteriologo, CreateBacteriologoRequest } from '../../../core/models/bacteriologo.model';
import { Aliado } from '../../../core/models/aliado.model';

@Component({
  selector: 'app-bacteriologos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Bacteriólogos</h1>
          <p class="text-gray-500 text-sm mt-1">
            Catálogo de bacteriólogos por laboratorio aliado
          </p>
        </div>
        <button (click)="openCreate()" class="btn-primary" [disabled]="!selectedAliado()">
          + Nuevo bacteriólogo
        </button>
      </div>

      <!-- Aliado selector -->
      <div class="card p-5">
        <div class="flex flex-col sm:flex-row gap-4 items-end">
          <div class="flex-1">
            <label class="label">Laboratorio aliado</label>
            <select [ngModel]="selectedAliadoId()" (ngModelChange)="selectedAliadoId.set($event); onAliadoChange()" class="input">
              <option value="">Selecciona un laboratorio</option>
              @for (a of aliados(); track a.id) {
                <option [value]="a.id">{{ a.nombre }} ({{ a.id }})</option>
              }
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-2">
            <input type="checkbox" [(ngModel)]="showInactive" (change)="loadBacteriologos()" class="rounded" />
            Mostrar inactivos
          </label>
        </div>
      </div>

      <!-- List -->
      @if (loading()) {
        <app-loading-spinner message="Cargando bacteriólogos..." />
      } @else if (!selectedAliado()) {
        <app-empty-state icon="🔬" title="Selecciona un laboratorio"
          description="Elige un laboratorio aliado para ver sus bacteriólogos" />
      } @else if (bacteriologos().length === 0) {
        <app-empty-state icon="👩‍🔬" title="Sin bacteriólogos registrados"
          description="Agrega el primer bacteriólogo para este laboratorio" />
      } @else {
        <div class="card overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p class="text-sm text-gray-600 font-medium">
              {{ bacteriologos().length }} bacteriólogo(s) — {{ selectedAliado()?.nombre }}
            </p>
          </div>
          <div class="divide-y divide-gray-100">
            @for (b of bacteriologos(); track b.id) {
              <div class="p-5 flex items-start gap-4" [class.opacity-50]="!b.activo">
                <!-- Firma / avatar -->
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                  @if (b.firmaPath) {
                    <img [src]="apiBase + b.firmaPath" alt="Firma" class="w-full h-full object-contain p-1" />
                  } @else {
                    <span class="text-2xl">✍️</span>
                  }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-semibold text-gray-900">{{ b.nombre }}</p>
                    <span class="badge text-xs"
                      [class]="b.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                      {{ b.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ b.tipoDocumento }}: {{ b.identificacion }}
                  </p>
                  @if (b.tarjetaProfesional) {
                    <p class="text-xs text-blue-600 mt-0.5">TP: {{ b.tarjetaProfesional }}</p>
                  }
                  @if (b.universidad) {
                    <p class="text-xs text-gray-400 mt-0.5">{{ b.universidad }}</p>
                  }
                  @if (!b.firmaPath) {
                    <p class="text-xs text-orange-500 mt-1">⚠️ Sin firma digital</p>
                  }
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-1 flex-shrink-0">
                  <button (click)="openEdit(b)" class="btn-ghost btn-sm text-xs" title="Editar">✏️ Editar</button>
                  <button (click)="openFirma(b)" class="btn-ghost btn-sm text-xs text-blue-600" title="Subir firma">
                    ✍️ {{ b.firmaPath ? 'Cambiar firma' : 'Subir firma' }}
                  </button>
                  @if (b.activo) {
                    <button (click)="deactivate(b)" class="btn-ghost btn-sm text-xs text-red-500" title="Desactivar">
                      🗑️ Desactivar
                    </button>
                  }
                </div>
              </div>
            }
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
              {{ editingBact() ? 'Editar bacteriólogo' : 'Nuevo bacteriólogo' }}
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ selectedAliado()?.nombre }}</p>
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
                <input type="text" formControlName="identificacion" class="input" placeholder="Número" />
                @if (f['identificacion'].invalid && f['identificacion'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              </div>
            </div>
            <div>
              <label class="label">Nombre completo *</label>
              <input type="text" formControlName="nombre" class="input" placeholder="Dra. María González" />
              @if (f['nombre'].invalid && f['nombre'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Tarjeta profesional</label>
              <input type="text" formControlName="tarjetaProfesional" class="input" placeholder="TP-12345" />
            </div>
            <div>
              <label class="label">Universidad de egreso</label>
              <input type="text" formControlName="universidad" class="input"
                placeholder="Universidad Nacional de Colombia" />
            </div>
            @if (editingBact()) {
              <div>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" formControlName="activo" class="rounded" />
                  <span class="font-medium text-gray-700">Bacteriólogo activo</span>
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
                {{ editingBact() ? 'Guardar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal subir firma -->
    @if (showFirmaModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeFirmaModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Firma digital</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ firmaTarget()?.nombre }}</p>
          </div>
          <div class="p-6 space-y-4">
            <!-- Preview -->
            @if (firmaPreview()) {
              <div class="border border-gray-200 rounded-xl p-3 bg-gray-50 text-center">
                <img [src]="firmaPreview()!" alt="Preview" class="max-h-32 mx-auto object-contain" />
              </div>
            }
            <div>
              <label class="label">Selecciona imagen (PNG o JPG, máx 2 MB)</label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                (change)="onFirmaSelected($event)"
                class="input text-sm"
              />
            </div>
            @if (firmaError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ firmaError() }}
              </div>
            }
            <div class="flex gap-3">
              <button (click)="closeFirmaModal()" class="btn-secondary flex-1">Cancelar</button>
              <button (click)="uploadFirma()" class="btn-primary flex-1"
                [disabled]="!firmaFile() || firmaUploading()">
                @if (firmaUploading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Subir firma
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class BacteriologosComponent implements OnInit {
  private readonly service = inject(BacteriologoService);
  private readonly aliadoService = inject(AliadoService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly apiBase = 'http://localhost:8080';

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showModal = signal(false);
  readonly editingBact = signal<Bacteriologo | null>(null);
  readonly bacteriologos = signal<Bacteriologo[]>([]);
  readonly aliados = signal<Aliado[]>([]);

  // Firma
  readonly showFirmaModal = signal(false);
  readonly firmaTarget = signal<Bacteriologo | null>(null);
  readonly firmaFile = signal<File | null>(null);
  readonly firmaPreview = signal<string | null>(null);
  readonly firmaUploading = signal(false);
  readonly firmaError = signal('');

  selectedAliadoId = signal('');
  showInactive = false;

  readonly selectedAliado = computed(() =>
    this.aliados().find((a) => a.id === this.selectedAliadoId()) ?? null
  );

  readonly form = this.fb.group({
    tipoDocumento:      ['', Validators.required],
    identificacion:     ['', Validators.required],
    nombre:             ['', Validators.required],
    tarjetaProfesional: [''],
    universidad:        [''],
    activo:             [true],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.aliadoService.getAll().subscribe({
      next: (list) => this.aliados.set(list),
      error: () => {
        // Fallback to known aliados
        this.aliados.set([
          { id: 'ALIADO-001', nombre: 'Laboratorio Clínico Norte', nit: null, direccion: null, email: null, logoPath: null, activo: true },
          { id: 'ALIADO-002', nombre: 'Laboratorio Clínico Sur',   nit: null, direccion: null, email: null, logoPath: null, activo: true },
        ]);
      },
    });
  }

  onAliadoChange(): void { this.loadBacteriologos(); }

  loadBacteriologos(): void {
    if (!this.selectedAliadoId()) { this.bacteriologos.set([]); return; }
    this.loading.set(true);
    this.service.getByAliado(this.selectedAliadoId(), this.showInactive).subscribe({
      next: (list) => { this.bacteriologos.set(list); this.loading.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.editingBact.set(null);
    this.form.reset({ tipoDocumento: '', identificacion: '', nombre: '', tarjetaProfesional: '', universidad: '', activo: true });
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEdit(b: Bacteriologo): void {
    this.editingBact.set(b);
    this.form.patchValue({
      tipoDocumento:      b.tipoDocumento,
      identificacion:     b.identificacion,
      nombre:             b.nombre,
      tarjetaProfesional: b.tarjetaProfesional ?? '',
      universidad:        b.universidad ?? '',
      activo:             b.activo,
    });
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  deactivate(b: Bacteriologo): void {
    this.service.delete(b.id).subscribe({
      next: () => {
        this.bacteriologos.update((list) =>
          list.map((x) => (x.id === b.id ? { ...x, activo: false } : x))
        );
        this.notifications.success('Bacteriólogo desactivado', b.nombre);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.submitError.set('');
    const v = this.form.getRawValue();
    const editing = this.editingBact();

    if (editing) {
      this.service.update(editing.id, {
        tipoDocumento:      v.tipoDocumento!,
        identificacion:     v.identificacion!,
        nombre:             v.nombre!,
        tarjetaProfesional: v.tarjetaProfesional || null,
        universidad:        v.universidad || null,
        activo:             v.activo ?? true,
      }).subscribe({
        next: () => {
          this.bacteriologos.update((list) =>
            list.map((x): Bacteriologo => x.id === editing.id
              ? {
                  ...x,
                  tipoDocumento:      v.tipoDocumento      ?? x.tipoDocumento,
                  identificacion:     v.identificacion     ?? x.identificacion,
                  nombre:             v.nombre             ?? x.nombre,
                  tarjetaProfesional: v.tarjetaProfesional || null,
                  universidad:        v.universidad        || null,
                  activo:             v.activo             ?? x.activo,
                }
              : x
            )
          );
          this.notifications.success('Bacteriólogo actualizado', v.nombre!);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (err: Error) => { this.submitError.set(err.message); this.submitting.set(false); },
      });
    } else {
      const payload: CreateBacteriologoRequest = {
        tipoDocumento:      v.tipoDocumento!,
        identificacion:     v.identificacion!,
        nombre:             v.nombre!,
        tarjetaProfesional: v.tarjetaProfesional || null,
        universidad:        v.universidad || null,
      };
      this.service.create(this.selectedAliadoId(), payload).subscribe({
        next: (created) => {
          this.bacteriologos.update((list) => [created, ...list]);
          this.notifications.success('Bacteriólogo creado', created.nombre);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (err: Error) => { this.submitError.set(err.message); this.submitting.set(false); },
      });
    }
  }

  // ─── Firma ────────────────────────────────────────────────────────────────

  openFirma(b: Bacteriologo): void {
    this.firmaTarget.set(b);
    this.firmaFile.set(null);
    this.firmaPreview.set(null);
    this.firmaError.set('');
    this.showFirmaModal.set(true);
  }

  closeFirmaModal(): void { this.showFirmaModal.set(false); }

  onFirmaSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.firmaError.set('El archivo supera el tamaño máximo de 2 MB');
      return;
    }
    this.firmaFile.set(file);
    this.firmaError.set('');
    const reader = new FileReader();
    reader.onload = (e) => this.firmaPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  uploadFirma(): void {
    const b = this.firmaTarget();
    const file = this.firmaFile();
    if (!b || !file) return;
    this.firmaUploading.set(true);
    this.service.uploadFirma(b.id, file).subscribe({
      next: (res) => {
        this.bacteriologos.update((list) =>
          list.map((x) => (x.id === b.id ? { ...x, firmaPath: res.firmaPath } : x))
        );
        this.notifications.success('Firma actualizada', b.nombre);
        this.closeFirmaModal();
        this.firmaUploading.set(false);
      },
      error: (err: Error) => {
        this.firmaError.set(err.message);
        this.firmaUploading.set(false);
      },
    });
  }
}
