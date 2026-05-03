import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AdminUser, CreateUserRequest, ROLE_DEFINITIONS, getRoleDefinition } from '../../../core/models/admin.model';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de usuarios del sistema</p>
        </div>
        <button (click)="openModal()" class="btn-primary">
          + Nuevo usuario
        </button>
      </div>

      <!-- Users table -->
      <div class="card">
        @if (users().length === 0) {
          <app-empty-state
            icon="👤"
            title="Sin usuarios registrados"
            description="Crea el primer usuario del sistema"
          />
        } @else {
          <div class="table-container rounded-none border-0">
            <table class="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Laboratorios asignados</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span class="text-blue-700 text-sm font-semibold">
                            {{ user.username[0].toUpperCase() }}
                          </span>
                        </div>
                        <span class="font-medium text-gray-900">{{ user.username }}</span>
                      </div>
                    </td>
                    <td class="text-gray-500 text-sm">{{ user.email }}</td>
                    <td>
                      <span class="badge text-xs px-2 py-1 rounded-full font-medium"
                        [class]="getRoleDef(user.role).color">
                        {{ getRoleDef(user.role).label }}
                      </span>
                    </td>
                    <td>
                      @if (user.aliados.length > 0) {
                        <div class="flex flex-wrap gap-1">
                          @for (a of user.aliados; track a) {
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {{ a }}
                            </span>
                          }
                        </div>
                      } @else {
                        <span class="text-xs text-gray-400">Sin asignación</span>
                      }
                    </td>
                    <td>
                      <span class="badge text-xs"
                        [class]="user.activo !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                        {{ user.activo !== false ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal crear usuario -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-900">Nuevo usuario</h2>
            <p class="text-sm text-gray-500 mt-0.5">Completa los datos para crear el usuario</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <!-- Username -->
            <div>
              <label class="label">Usuario *</label>
              <input type="text" formControlName="username" class="input"
                placeholder="nombre_usuario" autocomplete="off" />
              @if (f['username'].invalid && f['username'].touched) {
                <p class="text-xs text-red-600 mt-1">El usuario es requerido</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label class="label">Email *</label>
              <input type="email" formControlName="email" class="input"
                placeholder="usuario@clinicallab.local" />
              @if (f['email'].invalid && f['email'].touched) {
                <p class="text-xs text-red-600 mt-1">Email válido requerido</p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="label">Contraseña *</label>
              <input type="password" formControlName="password" class="input"
                placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              @if (f['password'].invalid && f['password'].touched) {
                <p class="text-xs text-red-600 mt-1">Mínimo 8 caracteres</p>
              }
            </div>

            <!-- Role -->
            <div>
              <label class="label">Rol *</label>
              <select formControlName="role" class="input">
                <option value="">Selecciona un rol</option>
                @for (role of roles; track role.value) {
                  <option [value]="role.value">{{ role.label }}</option>
                }
              </select>
              @if (f['role'].invalid && f['role'].touched) {
                <p class="text-xs text-red-600 mt-1">El rol es requerido</p>
              }
              <!-- Role description -->
              @if (selectedRole()) {
                <p class="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded p-2">
                  {{ selectedRole()!.description }}
                </p>
              }
            </div>

            <!-- Aliados -->
            <div>
              <label class="label">Laboratorios asignados</label>
              <p class="text-xs text-gray-400 mb-2">
                Requerido para roles aliado_operator y viewer
              </p>
              <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                @for (lab of knownLabs; track lab) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      [value]="lab"
                      (change)="toggleAliado(lab, $event)"
                      class="rounded border-gray-300"
                    />
                    <span class="text-gray-700">{{ lab }}</span>
                  </label>
                }
              </div>
            </div>

            @if (submitError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {{ submitError() }}
              </div>
            }

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" class="btn-primary flex-1" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                Crear usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly roles = ROLE_DEFINITIONS;
  readonly getRoleDef = getRoleDefinition;

  // Known labs — in a real app these come from GET /aliados
  readonly knownLabs = ['ALIADO-001', 'ALIADO-002'];

  readonly users = signal<AdminUser[]>([]);
  readonly showModal = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');

  private selectedAliados: string[] = [];

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role:     ['', Validators.required],
  });

  get f() { return this.form.controls; }

  readonly selectedRole = computed(() => {
    const role = this.form.get('role')?.value as UserRole;
    return role ? getRoleDefinition(role) : null;
  });

  ngOnInit(): void {
    // Seed with known test users from API docs
    this.users.set([
      { id: 1, username: 'admin',         email: 'admin@clinicallab.local',         role: 'admin',           aliados: [],              activo: true },
      { id: 2, username: 'lab_op',        email: 'lab_op@clinicallab.local',        role: 'lab_operator',    aliados: [],              activo: true },
      { id: 3, username: 'aliado_norte',  email: 'aliado_norte@clinicallab.local',  role: 'aliado_operator', aliados: ['ALIADO-001'],   activo: true },
      { id: 4, username: 'aliado_sur',    email: 'aliado_sur@clinicallab.local',    role: 'aliado_operator', aliados: ['ALIADO-002'],   activo: true },
      { id: 5, username: 'viewer',        email: 'viewer@clinicallab.local',        role: 'viewer',          aliados: [],              activo: true },
    ]);
  }

  openModal(): void {
    this.form.reset();
    this.selectedAliados = [];
    this.submitError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  toggleAliado(lab: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedAliados = [...this.selectedAliados, lab];
    } else {
      this.selectedAliados = this.selectedAliados.filter((a) => a !== lab);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const v = this.form.value;
    const payload: CreateUserRequest = {
      username: v.username!,
      email:    v.email!,
      password: v.password!,
      role:     v.role as UserRole,
      aliados:  this.selectedAliados,
    };

    this.adminService.createUser(payload).subscribe({
      next: (res) => {
        const newUser: AdminUser = {
          id:       res.id,
          username: payload.username,
          email:    payload.email,
          role:     payload.role,
          aliados:  payload.aliados ?? [],
          activo:   true,
        };
        this.users.update((list) => [newUser, ...list]);
        this.notifications.success('Usuario creado', `${payload.username} fue creado exitosamente`);
        this.closeModal();
        this.submitting.set(false);
      },
      error: (err: Error) => {
        this.submitError.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
