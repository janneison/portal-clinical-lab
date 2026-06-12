import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span class="text-3xl">🧪</span>
          </div>
          <h1 class="text-2xl font-bold text-white">Clinical Lab Portal</h1>
          <p class="text-primary-200 text-sm mt-1">Recuperación de contraseña</p>
        </div>

        <div class="card p-8">

          <!-- Estado: email enviado -->
          @if (sent()) {
            <div class="text-center space-y-4">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-2">
                <span class="text-3xl">✉️</span>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Revisa tu correo</h2>
              <p class="text-sm text-gray-600">
                Si el correo está registrado, recibirás las instrucciones en los próximos minutos.
                Revisa también tu carpeta de spam.
              </p>
              <a
                routerLink="/auth/reset-password"
                class="btn-primary w-full btn-lg inline-flex items-center justify-center mt-2"
              >
                Ya tengo el token →
              </a>
              <a routerLink="/auth/login" class="block text-sm text-primary-600 hover:text-primary-800 transition-colors">
                ← Volver al login
              </a>
            </div>
          }

          <!-- Estado: formulario -->
          @if (!sent()) {
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Recuperar contraseña</h2>
            <p class="text-sm text-gray-500 mb-6">
              Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
              <div>
                <label class="label" for="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="input"
                  placeholder="usuario@ejemplo.com"
                  autocomplete="email"
                />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <p class="text-xs text-red-600 mt-1">Ingresa un correo válido.</p>
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
                  Enviando...
                } @else {
                  Enviar instrucciones
                }
              </button>
            </form>

            <div class="mt-5 text-center">
              <a routerLink="/auth/login" class="text-sm text-primary-600 hover:text-primary-800 transition-colors">
                ← Volver al login
              </a>
            </div>
          }

        </div>

        <p class="text-center text-primary-300 text-xs mt-6">
          © {{ year }} Clinical Lab — Todos los derechos reservados
        </p>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly year = new Date().getFullYear();
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.requestPasswordReset(this.form.value.email!).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        // Solo se activa si hay error de red; la API siempre responde 200
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
