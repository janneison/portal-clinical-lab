import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo card -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span class="text-3xl">🧪</span>
          </div>
          <h1 class="text-2xl font-bold text-white">Clinical Lab Portal</h1>
          <p class="text-primary-200 text-sm mt-1">Plataforma de resultados de laboratorio</p>
        </div>

        <!-- Form card -->
        <div class="card p-8">
          @if (sessionExpired()) {
            <div class="alert-warning mb-6 text-sm">
              <span>⚠️</span>
              <span>Tu sesión expiró. Por favor inicia sesión nuevamente.</span>
            </div>
          }

          <h2 class="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="label" for="username">Usuario</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                class="input"
                placeholder="Ingresa tu usuario"
                autocomplete="username"
              />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-xs text-red-600 mt-1">El usuario es requerido</p>
              }
            </div>

            <div>
              <label class="label" for="password">Contraseña</label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="input pr-10"
                  placeholder="Ingresa tu contraseña"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs text-red-600 mt-1">La contraseña es requerida</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="alert-critical text-sm">
                <span>❌</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn-primary w-full btn-lg"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Ingresando...
              } @else {
                Ingresar
              }
            </button>
          </form>
        </div>

        <p class="text-center text-primary-300 text-xs mt-6">
          © {{ year }} Clinical Lab — Todos los derechos reservados
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  readonly year = new Date().getFullYear();
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly sessionExpired = signal(
    this.route.snapshot.queryParamMap.get('reason') === 'session_expired'
  );

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.form.value;

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.notifications.success('Bienvenido', `Hola, ${username}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
