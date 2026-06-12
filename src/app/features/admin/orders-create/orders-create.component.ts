import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { OrdersService } from '../../../core/services/orders.service';
import { MedicoService } from '../../../core/services/medico.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CreateOrderRequest, OrderDetail } from '../../../core/models/order.model';
import { Medico } from '../../../core/models/medico.model';

@Component({
  selector: 'app-orders-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-4xl">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/dashboard/orders" class="btn-ghost btn-sm">← Volver</a>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Nueva Orden de Laboratorio</h1>
          <p class="text-gray-500 text-sm mt-0.5">Completa todos los campos requeridos</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">

        <!-- Identificación de la orden -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">📋 Identificación de la orden</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">ID Solicitud *</label>
              <input type="text" formControlName="idSolicitudKey" class="input"
                placeholder="SOL-2025-0099" />
              @if (f['idSolicitudKey'].invalid && f['idSolicitudKey'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">ID Admisión *</label>
              <input type="text" formControlName="idAdmision" class="input"
                placeholder="ADM-10099" />
              @if (f['idAdmision'].invalid && f['idAdmision'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">ID Atención</label>
              <input type="text" formControlName="idAtencion" class="input"
                placeholder="Opcional" />
            </div>
            <div>
              <label class="label">Laboratorio aliado</label>
              <select formControlName="idAliado" class="input">
                <option value="">Sin aliado (interno)</option>
                @for (lab of knownLabs; track lab.id) {
                  <option [value]="lab.id">{{ lab.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">Número de autorización</label>
              <input type="text" formControlName="numeroDeAutorizacion" class="input"
                placeholder="Opcional" />
            </div>
            <div>
              <label class="label">Fecha de la orden *</label>
              <input type="datetime-local" formControlName="fechaDeLaOrden" class="input" />
              @if (f['fechaDeLaOrden'].invalid && f['fechaDeLaOrden'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
          </div>
        </div>

        <!-- Datos del paciente -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">👤 Datos del paciente</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="label">Nombre completo *</label>
              <input type="text" formControlName="nombreDelPaciente" class="input"
                placeholder="Nombre completo del paciente" />
              @if (f['nombreDelPaciente'].invalid && f['nombreDelPaciente'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Tipo de documento *</label>
              <select formControlName="tipoDeDocumento" class="input">
                <option value="">Selecciona</option>
                <option value="CC">CC — Cédula de Ciudadanía</option>
                <option value="TI">TI — Tarjeta de Identidad</option>
                <option value="PA">PA — Pasaporte</option>
                <option value="CE">CE — Cédula de Extranjería</option>
                <option value="RC">RC — Registro Civil</option>
                <option value="MS">MS — Menor sin identificación</option>
              </select>
              @if (f['tipoDeDocumento'].invalid && f['tipoDeDocumento'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
            <div>
              <label class="label">Número de documento *</label>
              <input type="text" formControlName="identificacion" class="input"
                placeholder="Número de documento" />
              @if (f['identificacion'].invalid && f['identificacion'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
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
              <input type="date" formControlName="fechaDeNacimiento" class="input" />
              @if (f['fechaDeNacimiento'].invalid && f['fechaDeNacimiento'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>
          </div>
        </div>

        <!-- Datos clínicos -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 mb-4">🏥 Datos clínicos</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">Centro de salud *</label>
              <input type="text" formControlName="centroDeSalud" class="input"
                placeholder="Nombre del centro de salud" />
              @if (f['centroDeSalud'].invalid && f['centroDeSalud'].touched) {
                <p class="text-xs text-red-600 mt-1">Requerido</p>
              }
            </div>

            <!-- Médico: selector del catálogo o texto libre -->
            <div class="sm:col-span-2">
              <label class="label">Médico que ordena *</label>
              <div class="flex gap-2 mb-2">
                <button type="button"
                  (click)="medicoMode.set('catalogo')"
                  class="btn-sm text-xs"
                  [class.btn-primary]="medicoMode() === 'catalogo'"
                  [class.btn-secondary]="medicoMode() !== 'catalogo'">
                  Del catálogo
                </button>
                <button type="button"
                  (click)="medicoMode.set('libre')"
                  class="btn-sm text-xs"
                  [class.btn-primary]="medicoMode() === 'libre'"
                  [class.btn-secondary]="medicoMode() !== 'libre'">
                  Texto libre
                </button>
              </div>

              @if (medicoMode() === 'catalogo') {
                <select formControlName="medicoId" class="input">
                  <option [value]="null">— Selecciona un médico —</option>
                  @for (m of medicos(); track m.id) {
                    <option [value]="m.id">
                      {{ m.nombre }}
                      @if (m.especialidad) { — {{ m.especialidad }} }
                      ({{ m.tipoDocumento }}: {{ m.identificacion }})
                    </option>
                  }
                </select>
                @if (medicos().length === 0) {
                  <p class="text-xs text-gray-400 mt-1">
                    No hay médicos en el catálogo.
                    <a routerLink="/dashboard/admin/medicos" class="text-blue-600 hover:underline">Agregar médico →</a>
                  </p>
                }
              } @else {
                <input type="text" formControlName="medicoQueOrdena" class="input"
                  placeholder="Dr. Nombre Apellido" />
                @if (f['medicoQueOrdena'].invalid && f['medicoQueOrdena'].touched) {
                  <p class="text-xs text-red-600 mt-1">Requerido</p>
                }
              }
            </div>
          </div>
        </div>

        <!-- Exámenes -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">🔬 Exámenes</h2>
            <button type="button" (click)="addExam()" class="btn-secondary btn-sm">
              + Agregar examen
            </button>
          </div>

          @if (detalles.length === 0) {
            <div class="text-center py-8 text-gray-400">
              <p class="text-2xl mb-2">🔬</p>
              <p class="text-sm">Agrega al menos un examen</p>
            </div>
          }

          <div class="space-y-4" formArrayName="detalles">
            @for (exam of detalles.controls; track $index) {
              <div [formGroupName]="$index"
                class="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">

                <button
                  type="button"
                  (click)="removeExam($index)"
                  class="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                  [disabled]="detalles.length === 1"
                  title="Eliminar examen"
                >
                  ✕
                </button>

                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Examen {{ $index + 1 }}
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="label">Código CUPS *</label>
                    <input type="text" formControlName="cups" class="input"
                      placeholder="Ej: 903820" />
                    @if (getExamControl($index, 'cups').invalid && getExamControl($index, 'cups').touched) {
                      <p class="text-xs text-red-600 mt-1">Requerido</p>
                    }
                  </div>
                  <div>
                    <label class="label">Nombre del examen *</label>
                    <input type="text" formControlName="nombreDelLaboratorio" class="input"
                      placeholder="Ej: Hemograma Completo" />
                    @if (getExamControl($index, 'nombreDelLaboratorio').invalid && getExamControl($index, 'nombreDelLaboratorio').touched) {
                      <p class="text-xs text-red-600 mt-1">Requerido</p>
                    }
                  </div>
                  <div>
                    <label class="label">Fecha toma de muestra</label>
                    <input type="datetime-local" formControlName="fechaTomaMuestra" class="input" />
                  </div>
                  <div>
                    <label class="label">Método</label>
                    <input type="text" formControlName="metodo" class="input"
                      placeholder="Opcional" />
                  </div>
                </div>
              </div>
            }
          </div>

          @if (detalles.length === 0 || (form.get('detalles')?.invalid && submitted())) {
            <p class="text-xs text-red-600 mt-2">Se requiere al menos un examen</p>
          }
        </div>

        <!-- Error global -->
        @if (submitError()) {
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {{ submitError() }}
          </div>
        }

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <a routerLink="/dashboard/orders" class="btn-secondary">
            Cancelar
          </a>
          <button type="submit" class="btn-primary btn-lg" [disabled]="submitting()">
            @if (submitting()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            Crear orden
          </button>
        </div>
      </form>
    </div>
  `,
})
export class OrdersCreateComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly medicoService = inject(MedicoService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly submitted = signal(false);
  readonly medicos = signal<Medico[]>([]);
  readonly medicoMode = signal<'catalogo' | 'libre'>('catalogo');

  readonly knownLabs = [
    { id: 'ALIADO-001', nombre: 'Laboratorio Clínico Norte' },
    { id: 'ALIADO-002', nombre: 'Laboratorio Clínico Sur' },
  ];

  readonly form = this.fb.group({
    idSolicitudKey:       ['', Validators.required],
    idAdmision:           ['', Validators.required],
    idAtencion:           [''],
    tipoDeDocumento:      ['', Validators.required],
    identificacion:       ['', Validators.required],
    nombreDelPaciente:    ['', Validators.required],
    sexo:                 ['', Validators.required],
    fechaDeNacimiento:    ['', Validators.required],
    centroDeSalud:        ['', Validators.required],
    fechaDeLaOrden:       ['', Validators.required],
    medicoQueOrdena:      [''],
    medicoId:             [null as number | null],
    numeroDeAutorizacion: [''],
    idAliado:             [''],
    detalles: this.fb.array([this.buildExamGroup()]),
  });

  ngOnInit(): void {
    this.medicoService.getAll().subscribe({
      next: (list) => this.medicos.set(list.filter((m) => m.activo)),
      error: () => this.medicoMode.set('libre'),
    });
  }

  get f() { return this.form.controls; }
  get detalles(): FormArray { return this.form.get('detalles') as FormArray; }

  buildExamGroup() {
    return this.fb.group({
      cups:                 ['', Validators.required],
      nombreDelLaboratorio: ['', Validators.required],
      fechaTomaMuestra:     [''],
      metodo:               [''],
    });
  }

  addExam(): void {
    this.detalles.push(this.buildExamGroup());
  }

  removeExam(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
    }
  }

  getExamControl(index: number, field: string): AbstractControl {
    return this.detalles.at(index).get(field)!;
  }

  submit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const v = this.form.value;

    // Format datetime-local to YYYY-MM-DD HH:MM:SS
    const formatDate = (dt: string) =>
      dt ? dt.replace('T', ' ') + ':00' : '';

    // Resolve medico: catalog ID takes priority over free text
    const medicoId = this.medicoMode() === 'catalogo' && v.medicoId
      ? Number(v.medicoId)
      : null;

    // For free-text mode, use the typed name; for catalog mode, find the name
    let medicoQueOrdena = v.medicoQueOrdena ?? '';
    if (this.medicoMode() === 'catalogo' && medicoId) {
      const found = this.medicos().find((m) => m.id === medicoId);
      medicoQueOrdena = found?.nombre ?? '';
    }

    const payload: CreateOrderRequest = {
      idSolicitudKey:       v.idSolicitudKey!,
      idAdmision:           v.idAdmision!,
      idAtencion:           v.idAtencion || undefined,
      tipoDeDocumento:      v.tipoDeDocumento!,
      identificacion:       v.identificacion!,
      nombreDelPaciente:    v.nombreDelPaciente!,
      sexo:                 v.sexo as 'M' | 'F',
      fechaDeNacimiento:    v.fechaDeNacimiento!,
      centroDeSalud:        v.centroDeSalud!,
      fechaDeLaOrden:       formatDate(v.fechaDeLaOrden!),
      medicoQueOrdena,
      medicoId:             medicoId ?? undefined,
      numeroDeAutorizacion: v.numeroDeAutorizacion || undefined,
      idAliado:             v.idAliado || undefined,
      detalles: (v.detalles as any[]).map((d) => ({
        cups:                 d.cups,
        nombreDelLaboratorio: d.nombreDelLaboratorio,
        fechaTomaMuestra:     d.fechaTomaMuestra ? formatDate(d.fechaTomaMuestra) : null,
        metodo:               d.metodo || null,
      } as OrderDetail)),
    };

    this.ordersService.createOrder(payload).subscribe({
      next: (res) => {
        this.notifications.success(
          'Orden creada',
          `${res.idSolicitudKey} — ${res.detalles} examen(es)`
        );
        this.router.navigate(['/dashboard/orders', res.idSolicitudKey]);
      },
      error: (err: Error) => {
        this.submitError.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
