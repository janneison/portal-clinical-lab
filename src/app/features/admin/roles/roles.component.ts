import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ROLE_DEFINITIONS } from '../../../core/models/admin.model';

interface Permission {
  endpoint: string;
  admin: boolean;
  lab_operator: boolean;
  aliado_operator: boolean;
  viewer: boolean;
  note?: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
        <p class="text-gray-500 text-sm mt-1">
          Referencia de accesos por rol en el sistema
        </p>
      </div>

      <!-- Role cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (role of roles; track role.value) {
          <div class="card p-5">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">{{ roleIcon(role.value) }}</span>
              <div>
                <p class="font-semibold text-gray-900 text-sm">{{ role.label }}</p>
                <span class="badge text-xs mt-0.5" [class]="role.color">
                  {{ role.value }}
                </span>
              </div>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">{{ role.description }}</p>
          </div>
        }
      </div>

      <!-- Permissions matrix -->
      <div class="card">
        <div class="p-5 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">Matriz de permisos por endpoint</h2>
        </div>
        <div class="table-container rounded-none border-0">
          <table class="table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th class="text-center">Admin</th>
                <th class="text-center">Lab Operator</th>
                <th class="text-center">Aliado Operator</th>
                <th class="text-center">Viewer</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              @for (perm of permissions; track perm.endpoint) {
                <tr>
                  <td class="font-mono text-xs text-gray-700">{{ perm.endpoint }}</td>
                  <td class="text-center">{{ perm.admin ? '✅' : '❌' }}</td>
                  <td class="text-center">{{ perm.lab_operator ? '✅' : '❌' }}</td>
                  <td class="text-center">{{ perm.aliado_operator ? '✅' : '❌' }}</td>
                  <td class="text-center">{{ perm.viewer ? '✅' : '❌' }}</td>
                  <td class="text-xs text-gray-400">{{ perm.note ?? '' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Info box -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p class="font-semibold mb-1">ℹ️ Sobre la gestión de roles</p>
        <p class="text-xs leading-relaxed">
          Los roles son fijos en el sistema y se asignan al crear o editar un usuario.
          <strong>aliado_operator</strong> y <strong>viewer</strong> solo acceden a las órdenes
          de los laboratorios que tienen asignados. <strong>admin</strong> y
          <strong>lab_operator</strong> ven todas las órdenes sin restricción.
        </p>
      </div>
    </div>
  `,
})
export class RolesComponent {
  readonly roles = ROLE_DEFINITIONS;

  readonly permissions: Permission[] = [
    { endpoint: 'POST /auth/login',       admin: true,  lab_operator: true,  aliado_operator: true,  viewer: true,  note: 'Pública' },
    { endpoint: 'GET /auth/me',           admin: true,  lab_operator: true,  aliado_operator: true,  viewer: true  },
    { endpoint: 'POST /auth/register',    admin: true,  lab_operator: false, aliado_operator: false, viewer: false, note: 'Solo admin' },
    { endpoint: 'GET /orders',            admin: true,  lab_operator: true,  aliado_operator: true,  viewer: true,  note: 'Aliado/Viewer: solo sus labs' },
    { endpoint: 'POST /orders',           admin: true,  lab_operator: true,  aliado_operator: false, viewer: false },
    { endpoint: 'GET /orders/{id}',       admin: true,  lab_operator: true,  aliado_operator: true,  viewer: true  },
    { endpoint: 'POST /orders/{id}/send', admin: true,  lab_operator: true,  aliado_operator: false, viewer: false },
    { endpoint: 'POST /results',          admin: true,  lab_operator: true,  aliado_operator: true,  viewer: false },
  ];

  roleIcon(role: string): string {
    const map: Record<string, string> = {
      admin:           '👑',
      lab_operator:    '🔬',
      aliado_operator: '🏥',
      viewer:          '👁️',
    };
    return map[role] ?? '👤';
  }
}
