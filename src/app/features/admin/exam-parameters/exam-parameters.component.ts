import { Component, inject, signal, computed, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExamCatalogService } from '../../../core/services/exam-catalog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import {
  ExamParameter,
  ParameterRange,
  CreateParameterRequest,
  CreateRangeRequest,
  ParameterSexo,
  TipoResultado,
  TIPO_RESULTADO_LABELS,
  ETIQUETA_BOOLEANO_LABELS,
} from '../../../core/models/exam-catalog.model';

@Component({
  selector: 'app-exam-parameters',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 max-w-5xl">
      <!-- Back -->
      <a routerLink="/dashboard/admin/exam-catalog" class="btn-ghost btn-sm inline-flex">
        ← Volver al catálogo
      </a>

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
              {{ cups() }}
            </span>
            <h1 class="text-2xl font-bold text-gray-900">Parámetros de referencia</h1>
          </div>
          <p class="text-gray-500 text-sm mt-1">
            Configura los rangos de referencia para la interpretación automática de resultados
          </p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nuevo parámetro</button>
      </div>

      <!-- Info box -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p class="font-semibold mb-1">ℹ️ ¿Cómo funcionan los parámetros?</p>
        <p class="text-xs leading-relaxed">
          Cada parámetro define el rango normal para un valor del resultado (ej: hemoglobina 13.5–17.5 g/dL).
          Al registrar un resultado, el sistema calcula automáticamente el <strong>flag</strong>:
          <span class="inline-flex gap-1 ml-1">
            <span class="bg-green-100 text-green-700 px-1.5 rounded text-xs">normal</span>
            <span class="bg-yellow-100 text-yellow-700 px-1.5 rounded text-xs">alto</span>
            <span class="bg-blue-100 text-blue-700 px-1.5 rounded text-xs">bajo</span>
            <span class="bg-red-100 text-red-700 px-1.5 rounded text-xs">crítico</span>
          </span>
        </p>
      </div>

      <!-- Parameters table -->
      @if (loading()) {
        <app-loading-spinner message="Cargando parámetros..." />
      } @else if (parameters().length === 0) {
        <app-empty-state
          icon="📐"
          title="Sin parámetros configurados"
          description="Este examen no tiene parámetros de referencia. Los resultados se guardarán como JSON libre."
        />
      } @else {
        <div class="card overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <p class="text-sm text-gray-600 font-medium">
              {{ parameters().length }} parámetro(s) —
              {{ obligatoryCount() }} obligatorio(s)
            </p>
            <p class="text-xs text-gray-400">Ordenados por posición</p>
          </div>
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-8">#</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Unidad</th>
                  <th class="text-center">Rango normal</th>
                  <th class="text-center">Sexo</th>
                  <th class="text-center">Edad</th>
                  <th class="text-center">Obligatorio</th>
                  <th class="text-center">Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (param of parameters(); track param.id) {
                  <tr [class.opacity-50]="!param.activo">
                    <td class="text-gray-400 text-xs">{{ param.orden }}</td>
                    <td>
                      <span class="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {{ param.codigo }}
                      </span>
                    </td>
                    <td class="font-medium text-gray-900">{{ param.nombre }}</td>
                    <td>
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        [class]="param.tipoResultado === 'numerico' ? 'bg-blue-100 text-blue-700' :
                                 param.tipoResultado === 'booleano' ? 'bg-purple-100 text-purple-700' :
                                 'bg-gray-100 text-gray-600'">
                        {{ tipoResultadoLabels[param.tipoResultado] ?? param.tipoResultado }}
                      </span>
                    </td>
                    <td class="text-gray-500 text-sm">{{ param.unidad || '—' }}</td>
                    <td class="text-center">
                      @if (param.tipoResultado === 'booleano') {
                        <span class="text-xs text-purple-600">{{ etiquetaLabels[param.etiquetaBooleano!] ?? '—' }}</span>
                      } @else if (param.valorMinRef !== null || param.valorMaxRef !== null) {
                        <span class="text-sm font-mono text-gray-700">
                          {{ param.valorMinRef ?? '?' }} – {{ param.valorMaxRef ?? '?' }}
                        </span>
                      } @else {
                        <span class="text-gray-400 text-xs">Sin rango</span>
                      }
                    </td>
                    <td class="text-center">
                      <span class="text-xs font-medium"
                        [class.text-blue-600]="param.sexo === 'M'"
                        [class.text-pink-600]="param.sexo === 'F'"
                        [class.text-gray-500]="param.sexo === '*'"
                      >
                        {{ param.sexo === '*' ? 'Ambos' : param.sexo === 'M' ? 'Masculino' : 'Femenino' }}
                      </span>
                    </td>
                    <td class="text-center text-xs text-gray-500">
                      @if (param.edadMin !== null || param.edadMax !== null) {
                        {{ param.edadMin ?? 0 }}–{{ param.edadMax ?? '∞' }} años
                      } @else {
                        <span class="text-gray-400">Todas</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (param.obligatorio) {
                        <span class="badge bg-orange-100 text-orange-700 text-xs">Sí</span>
                      } @else {
                        <span class="text-gray-400 text-xs">No</span>
                      }
                    </td>
                    <td class="text-center">
                      <span class="badge text-xs"
                        [class]="param.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                        {{ param.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex justify-end gap-1">
                        <button (click)="openEdit(param)" class="btn-ghost btn-sm text-xs" title="Editar">
                          ✏️
                        </button>
                        @if (param.tipoResultado === 'numerico') {
                          <button (click)="openRanges(param)" class="btn-ghost btn-sm text-xs text-blue-500" title="Rangos por reactivo">
                            📐
                          </button>
                        }
                        <button
                          (click)="deleteParam(param)"
                          class="btn-ghost btn-sm text-xs text-red-500 hover:text-red-700"
                          title="Desactivar"
                          [disabled]="!param.activo"
                        >
                          🗑️
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

    <!-- Modal crear / editar parámetro -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">
              {{ editingParam() ? 'Editar parámetro' : 'Nuevo parámetro' }}
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">Examen CUPS: {{ cups() }}</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <!-- Código y nombre -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Código *</label>
                <input type="text" formControlName="codigo" class="input"
                  placeholder="Ej: wbc, hb, plt" autocomplete="off" />
                <p class="text-xs text-gray-400 mt-1">Clave en el JSON de valores</p>
                @if (f['codigo'].invalid && f['codigo'].touched) {
                  <p class="text-xs text-red-600">Requerido</p>
                }
              </div>
              <div>
                <label class="label">Nombre *</label>
                <input type="text" formControlName="nombre" class="input"
                  placeholder="Ej: Leucocitos" />
                @if (f['nombre'].invalid && f['nombre'].touched) {
                  <p class="text-xs text-red-600">Requerido</p>
                }
              </div>
            </div>

            <!-- Unidad y orden -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Unidad</label>
                <input type="text" formControlName="unidad" class="input"
                  placeholder="Ej: g/dL, %, 10³/µL" />
              </div>
              <div>
                <label class="label">Orden de presentación</label>
                <input type="number" formControlName="orden" class="input" min="0" />
              </div>
            </div>

            <!-- Tipo de resultado -->
            <div>
              <label class="label">Tipo de resultado</label>
              <select formControlName="tipoResultado" class="input">
                @for (opt of tipoResultadoOptions; track opt) {
                  <option [value]="opt">{{ tipoResultadoLabels[opt] }}</option>
                }
              </select>
            </div>

            <!-- Etiqueta booleano (solo si tipoResultado = booleano) -->
            @if (form.get('tipoResultado')?.value === 'booleano') {
              <div>
                <label class="label">Etiqueta booleano *</label>
                <select formControlName="etiquetaBooleano" class="input">
                  <option value="">Selecciona una etiqueta</option>
                  @for (opt of etiquetaOptions; track opt[0]) {
                    <option [value]="opt[0]">{{ opt[1] }}</option>
                  }
                </select>
                <p class="text-xs text-gray-400 mt-1">Requerido para parámetros booleanos</p>
              </div>
            }

            <!-- Rango de referencia (solo numérico) -->
            @if (form.get('tipoResultado')?.value !== 'booleano') {
              <div>
                <label class="label">Rango de referencia normal</label>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <input type="number" formControlName="valorMinRef" class="input"
                      placeholder="Mínimo" step="0.01" />
                    <p class="text-xs text-gray-400 mt-1">Valor mínimo normal</p>
                  </div>
                  <div>
                    <input type="number" formControlName="valorMaxRef" class="input"
                      placeholder="Máximo" step="0.01" />
                    <p class="text-xs text-gray-400 mt-1">Valor máximo normal</p>
                  </div>
                </div>
              </div>
            }

            <!-- Sexo -->
            <div>
              <label class="label">Aplica para</label>
              <select formControlName="sexo" class="input">
                <option value="*">Ambos sexos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <!-- Rango de edad -->
            <div>
              <label class="label">Rango de edad (años)</label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <input type="number" formControlName="edadMin" class="input"
                    placeholder="Edad mínima" min="0" />
                  <p class="text-xs text-gray-400 mt-1">Vacío = sin límite</p>
                </div>
                <div>
                  <input type="number" formControlName="edadMax" class="input"
                    placeholder="Edad máxima" min="0" />
                  <p class="text-xs text-gray-400 mt-1">Vacío = sin límite</p>
                </div>
              </div>
            </div>

            <!-- Obligatorio -->
            <div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" formControlName="obligatorio" class="rounded" />
                <span class="font-medium text-gray-700">Parámetro obligatorio</span>
              </label>
              <p class="text-xs text-gray-400 mt-1 ml-6">
                Si está marcado, el sistema rechazará resultados que no incluyan este valor
              </p>
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
                {{ editingParam() ? 'Guardar cambios' : 'Crear parámetro' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Confirm delete dialog -->
    @if (confirmDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="confirmDelete.set(null)"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <p class="text-3xl mb-3">⚠️</p>
            <h3 class="font-bold text-gray-900">¿Desactivar parámetro?</h3>
            <p class="text-sm text-gray-500 mt-1">
              Se desactivará <strong>{{ confirmDelete()!.nombre }}</strong> ({{ confirmDelete()!.codigo }}).
              No se elimina físicamente.
            </p>
          </div>
          <div class="flex gap-3">
            <button (click)="confirmDelete.set(null)" class="btn-secondary flex-1">Cancelar</button>
            <button (click)="confirmDeleteAction()" class="btn-danger flex-1" [disabled]="submitting()">
              @if (submitting()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              }
              Desactivar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Ranges side panel -->
    @if (showRanges()) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" (click)="closeRanges()"></div>
        <div class="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-900">Rangos por reactivo</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Parámetro: <span class="font-mono font-semibold">{{ showRanges()!.codigo }}</span>
                — {{ showRanges()!.nombre }}
              </p>
            </div>
            <div class="flex gap-2">
              <button (click)="openCreateRange()" class="btn-primary btn-sm">+ Nuevo rango</button>
              <button (click)="closeRanges()" class="btn-ghost btn-sm">✕</button>
            </div>
          </div>

          <div class="p-6 flex-1">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 mb-4">
              Los rangos por reactivo sobreescriben el rango general del parámetro cuando el resultado
              incluye el campo <code class="font-mono bg-blue-100 px-1 rounded">reactivo</code>.
            </div>

            @if (loadingRanges()) {
              <app-loading-spinner message="Cargando rangos..." size="sm" />
            } @else if (ranges().length === 0) {
              <app-empty-state icon="📐" title="Sin rangos configurados"
                description="Agrega rangos específicos por reactivo" />
            } @else {
              <div class="space-y-3">
                @for (range of ranges(); track range.id) {
                  <div class="border rounded-xl p-4" [class.opacity-50]="!range.activo"
                    [class.border-gray-200]="range.activo" [class.border-gray-100]="!range.activo">
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-semibold text-gray-900 text-sm">{{ range.reactivo }}</p>
                        <p class="text-xs text-gray-500 mt-1">
                          Rango: <span class="font-mono">{{ range.valorMinRef ?? '?' }} – {{ range.valorMaxRef ?? '?' }}</span>
                          · Sexo: {{ range.sexo === '*' ? 'Ambos' : range.sexo }}
                          @if (range.edadMin !== null || range.edadMax !== null) {
                            · Edad: {{ range.edadMin ?? 0 }}–{{ range.edadMax ?? '∞' }} años
                          }
                        </p>
                      </div>
                      <div class="flex gap-1">
                        <span class="badge text-xs"
                          [class]="range.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                          {{ range.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                        <button (click)="openEditRange(range)" class="btn-ghost btn-sm text-xs" title="Editar">✏️</button>
                        <button (click)="deleteRange(range)" class="btn-ghost btn-sm text-xs text-red-500"
                          title="Desactivar" [disabled]="!range.activo">🗑️</button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Range modal -->
    @if (showRangeModal()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="closeRangeModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">
              {{ editingRange() ? 'Editar rango' : 'Nuevo rango por reactivo' }}
            </h2>
          </div>
          <form [formGroup]="rangeForm" (ngSubmit)="submitRange()" class="p-6 space-y-4">
            <div>
              <label class="label">Reactivo *</label>
              <input type="text" formControlName="reactivo" class="input"
                placeholder="Ej: Sysmex XN-1000" autocomplete="off" />
              @if (rf['reactivo'].invalid && rf['reactivo'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Valor mínimo</label>
                <input type="number" formControlName="valorMinRef" class="input" step="0.01" placeholder="Mínimo" />
              </div>
              <div>
                <label class="label">Valor máximo</label>
                <input type="number" formControlName="valorMaxRef" class="input" step="0.01" placeholder="Máximo" />
              </div>
            </div>
            <div>
              <label class="label">Aplica para</label>
              <select formControlName="sexo" class="input">
                <option value="*">Ambos sexos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Edad mínima</label>
                <input type="number" formControlName="edadMin" class="input" min="0" placeholder="Sin límite" />
              </div>
              <div>
                <label class="label">Edad máxima</label>
                <input type="number" formControlName="edadMax" class="input" min="0" placeholder="Sin límite" />
              </div>
            </div>
            @if (rangeError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ rangeError() }}</div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeRangeModal()" class="btn-secondary flex-1">Cancelar</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="rangeSubmitting()">
                @if (rangeSubmitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                {{ editingRange() ? 'Guardar' : 'Crear rango' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class ExamParametersComponent implements OnInit {
  readonly cups = input.required<string>();

  private readonly service = inject(ExamCatalogService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly showModal = signal(false);
  readonly editingParam = signal<ExamParameter | null>(null);
  readonly confirmDelete = signal<ExamParameter | null>(null);
  readonly parameters = signal<ExamParameter[]>([]);

  readonly obligatoryCount = computed(() =>
    this.parameters().filter((p) => p.obligatorio).length
  );

  readonly tipoResultadoLabels = TIPO_RESULTADO_LABELS;
  readonly etiquetaLabels = ETIQUETA_BOOLEANO_LABELS;
  readonly tipoResultadoOptions: TipoResultado[] = ['numerico', 'texto', 'booleano'];
  readonly etiquetaOptions = Object.entries(ETIQUETA_BOOLEANO_LABELS) as [string, string][];

  // Ranges panel
  readonly showRanges = signal<ExamParameter | null>(null);
  readonly ranges = signal<ParameterRange[]>([]);
  readonly loadingRanges = signal(false);
  readonly showRangeModal = signal(false);
  readonly editingRange = signal<ParameterRange | null>(null);
  readonly rangeSubmitting = signal(false);
  readonly rangeError = signal('');

  readonly rangeForm = this.fb.group({
    reactivo:    ['', Validators.required],
    valorMinRef: [null as number | null],
    valorMaxRef: [null as number | null],
    sexo:        ['*'],
    edadMin:     [null as number | null],
    edadMax:     [null as number | null],
  });

  get rf() { return this.rangeForm.controls; }

  readonly form = this.fb.group({
    codigo:           ['', Validators.required],
    nombre:           ['', Validators.required],
    unidad:           [''],
    valorMinRef:      [null as number | null],
    valorMaxRef:      [null as number | null],
    sexo:             ['*'],
    edadMin:          [null as number | null],
    edadMax:          [null as number | null],
    obligatorio:      [false],
    orden:            [0],
    tipoResultado:    ['numerico'],
    etiquetaBooleano: [null as string | null],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getParameters(this.cups()).subscribe({
      next: (list) => {
        this.parameters.set([...list].sort((a, b) => a.orden - b.orden));
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.notifications.error('Error', err.message);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingParam.set(null);
    this.form.reset({ codigo: '', nombre: '', unidad: '', valorMinRef: null, valorMaxRef: null, sexo: '*', edadMin: null, edadMax: null, obligatorio: false, orden: this.parameters().length });
    this.form.get('codigo')?.enable();
    this.submitError.set('');
    this.showModal.set(true);
  }

  openEdit(param: ExamParameter): void {
    this.editingParam.set(param);
    this.form.patchValue({
      codigo:           param.codigo,
      nombre:           param.nombre,
      unidad:           param.unidad ?? '',
      valorMinRef:      param.valorMinRef,
      valorMaxRef:      param.valorMaxRef,
      sexo:             param.sexo,
      edadMin:          param.edadMin,
      edadMax:          param.edadMax,
      obligatorio:      param.obligatorio,
      orden:            param.orden,
      tipoResultado:    param.tipoResultado ?? 'numerico',
      etiquetaBooleano: param.etiquetaBooleano ?? null,
    });
    this.form.get('codigo')?.disable();
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  deleteParam(param: ExamParameter): void {
    this.confirmDelete.set(param);
  }

  confirmDeleteAction(): void {
    const param = this.confirmDelete();
    if (!param) return;
    this.submitting.set(true);
    this.service.deleteParameter(this.cups(), param.id).subscribe({
      next: () => {
        this.parameters.update((list) =>
          list.map((p) => (p.id === param.id ? { ...p, activo: false } : p))
        );
        this.notifications.success('Parámetro desactivado', param.nombre);
        this.confirmDelete.set(null);
        this.submitting.set(false);
      },
      error: (err: Error) => {
        this.notifications.error('Error', err.message);
        this.submitting.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    this.submitError.set('');
    const v = this.form.getRawValue();
    const editing = this.editingParam();

    const payload: CreateParameterRequest = {
      codigo:           v.codigo!,
      nombre:           v.nombre!,
      unidad:           v.unidad || null,
      valorMinRef:      v.valorMinRef ?? null,
      valorMaxRef:      v.valorMaxRef ?? null,
      sexo:             (v.sexo as ParameterSexo) ?? '*',
      edadMin:          v.edadMin ?? null,
      edadMax:          v.edadMax ?? null,
      obligatorio:      v.obligatorio ?? false,
      orden:            v.orden ?? 0,
      tipoResultado:    (v.tipoResultado as TipoResultado) ?? 'numerico',
      etiquetaBooleano: (v.etiquetaBooleano as any) ?? null,
    };

    const obs = editing
      ? this.service.updateParameter(this.cups(), editing.id, payload)
      : this.service.createParameter(this.cups(), payload);

    obs.subscribe({
      next: () => {
        this.notifications.success(editing ? 'Parámetro actualizado' : 'Parámetro creado');
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

  // ─── Ranges ────────────────────────────────────────────────────────────────

  openRanges(param: ExamParameter): void {
    this.showRanges.set(param);
    this.loadingRanges.set(true);
    this.ranges.set([]);
    this.service.getRanges(this.cups(), param.id).subscribe({
      next: (list) => { this.ranges.set(list); this.loadingRanges.set(false); },
      error: (err: Error) => { this.notifications.error('Error', err.message); this.loadingRanges.set(false); },
    });
  }

  closeRanges(): void { this.showRanges.set(null); }

  openCreateRange(): void {
    this.editingRange.set(null);
    this.rangeForm.reset({ reactivo: '', valorMinRef: null, valorMaxRef: null, sexo: '*', edadMin: null, edadMax: null });
    this.rangeError.set('');
    this.showRangeModal.set(true);
  }

  openEditRange(range: ParameterRange): void {
    this.editingRange.set(range);
    this.rangeForm.patchValue({
      reactivo:    range.reactivo,
      valorMinRef: range.valorMinRef,
      valorMaxRef: range.valorMaxRef,
      sexo:        range.sexo,
      edadMin:     range.edadMin,
      edadMax:     range.edadMax,
    });
    this.rangeError.set('');
    this.showRangeModal.set(true);
  }

  closeRangeModal(): void { this.showRangeModal.set(false); }

  deleteRange(range: ParameterRange): void {
    const param = this.showRanges();
    if (!param) return;
    this.service.deleteRange(this.cups(), param.id, range.id).subscribe({
      next: () => {
        this.ranges.update((list) => list.map((r) => r.id === range.id ? { ...r, activo: false } : r));
        this.notifications.success('Rango desactivado', range.reactivo);
      },
      error: (err: Error) => this.notifications.error('Error', err.message),
    });
  }

  submitRange(): void {
    if (this.rangeForm.invalid) { this.rangeForm.markAllAsTouched(); return; }
    const param = this.showRanges();
    if (!param) return;

    this.rangeSubmitting.set(true);
    this.rangeError.set('');
    const v = this.rangeForm.value;
    const editing = this.editingRange();

    const payload: CreateRangeRequest = {
      reactivo:    v.reactivo!,
      valorMinRef: v.valorMinRef ?? null,
      valorMaxRef: v.valorMaxRef ?? null,
      sexo:        (v.sexo as ParameterSexo) ?? '*',
      edadMin:     v.edadMin ?? null,
      edadMax:     v.edadMax ?? null,
    };

    const obs = editing
      ? this.service.updateRange(this.cups(), param.id, editing.id, payload)
      : this.service.createRange(this.cups(), param.id, payload);

    obs.subscribe({
      next: () => {
        this.notifications.success(editing ? 'Rango actualizado' : 'Rango creado');
        this.closeRangeModal();
        this.openRanges(param);
        this.rangeSubmitting.set(false);
      },
      error: (err: Error) => {
        this.rangeError.set(err.message);
        this.rangeSubmitting.set(false);
      },
    });
  }
}
