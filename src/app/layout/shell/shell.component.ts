import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  divider?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-30"
        [class.w-64]="!collapsed()"
        [class.w-16]="collapsed()"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-bold">🧪</span>
          </div>
          @if (!collapsed()) {
            <div>
              <p class="font-bold text-gray-900 text-sm leading-tight">Clinical Lab</p>
              <p class="text-xs text-gray-400">Portal de Resultados</p>
            </div>
          }
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          @for (item of visibleNavItems(); track item.route) {
            @if (item.divider) {
              <div class="pt-3 pb-1 px-3">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {{ item.label }}
                </p>
              </div>
            } @else {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="sidebar-link"
                [class.justify-center]="collapsed()"
                [title]="collapsed() ? item.label : ''"
              >
                <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
                @if (!collapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          }
        </nav>

        <!-- User info -->
        <div class="border-t border-gray-100 p-3">
          @if (!collapsed()) {
            <div class="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-primary-700 text-sm font-semibold">
                  {{ userInitial() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ authService.currentUser()?.username }}
                </p>
                <p class="text-xs text-gray-400 truncate">
                  {{ roleLabel() }}
                </p>
              </div>
            </div>
          }
          <button
            (click)="authService.logout()"
            class="sidebar-link w-full mt-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            [class.justify-center]="collapsed()"
            title="Cerrar sesión"
          >
            <span class="text-lg">🚪</span>
            @if (!collapsed()) {
              <span>Cerrar sesión</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar -->
        <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            (click)="collapsed.set(!collapsed())"
            class="btn-ghost p-2 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <span class="text-gray-500">☰</span>
          </button>
          <div class="flex-1"></div>
          @if (authService.isLabOperator()) {
            <a routerLink="/dashboard/orders/create" class="btn-primary btn-sm">
              + Nueva orden
            </a>
          }
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400">
              {{ authService.currentUser()?.username }}
            </span>
            <div class="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-700 text-xs font-semibold">{{ userInitial() }}</span>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto scrollbar-thin p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  readonly authService = inject(AuthService);
  readonly collapsed = signal(false);

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard',    icon: '📊', route: '/dashboard' },
    { label: 'Órdenes',      icon: '📋', route: '/dashboard/orders' },
    { label: 'Resultados',   icon: '🔬', route: '/dashboard/results' },
    // Admin section
    { label: 'Administración', icon: '', route: '', roles: ['admin'], divider: true },
    { label: 'Usuarios',       icon: '👤', route: '/dashboard/admin/users',          roles: ['admin'] },
    { label: 'Laboratorios',   icon: '🏥', route: '/dashboard/admin/labs',            roles: ['admin'] },
    { label: 'Centros Salud',  icon: '🏨', route: '/dashboard/admin/health-centers',  roles: ['admin'] },
    { label: 'Pacientes',      icon: '👥', route: '/dashboard/admin/patients',        roles: ['admin', 'lab_operator'] },
    { label: 'Roles',          icon: '🔑', route: '/dashboard/admin/roles',           roles: ['admin'] },
    { label: 'Catálogo',       icon: '📚', route: '/dashboard/admin/exam-catalog',    roles: ['admin', 'lab_operator'] },
  ];

  visibleNavItems() {
    const role = this.authService.currentUser()?.role;
    return this.navItems.filter(
      (item) => !item.roles || item.roles.includes(role ?? '')
    );
  }

  userInitial(): string {
    return (this.authService.currentUser()?.username?.[0] ?? 'U').toUpperCase();
  }

  roleLabel(): string {
    const map: Record<string, string> = {
      admin: 'Administrador',
      lab_operator: 'Operador Lab',
      aliado_operator: 'Operador Aliado',
      viewer: 'Visualizador',
    };
    return map[this.authService.currentUser()?.role ?? ''] ?? '';
  }
}
