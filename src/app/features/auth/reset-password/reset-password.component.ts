import { Component, inject, signal, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// ─── Validators ──────────────────────────────────────────────────────────────

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pass === confirm ? null : { mismatch: true };
}

/**
 * Política: mínimo 8 chars, mayúscula, minúscula, número y especial (!@#$%&*+-_)
 * Debe coincidir exactamente con la política del backend.
 */
function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  if (!v) return null;
  const ok =
    v.length >= 8 &&
    /[A-Z]/.test(v) &&
    /[a-z]/.test(v) &&
    /[0-9]/.test(v) &&
    /[!@#$%&*+\-_]/.test(v);
  return ok ? null : { weakPassword: true };
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reset-password',
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
          <p class="text-primary-200 text-sm mt-1">Nueva contraseña</p>
        </div>

        <div class="card p-8">

          <!-- Estado: contraseña cambiada -->
          @if (done()) {
            <div class="text-center space-y-4">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-2">
                <span class="text-3xl">✅</span>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">¡Contraseña actualizada!</h2>
              <p class="text-sm text-gray-600">
                Tu contraseña fue cambiada correctamente. Serás redirigido al login en unos segundos.
              </p>
              <a routerLink="/auth/login" class="btn-primary w-full btn-lg inline-flex items-center justify-center mt-2">
                Ir al login ahora →
              </a>
            </div>
          }

          <!-- Estado: formulario -->
          @if (!done()) {
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Nueva contraseña</h2>
            <p class="text-sm text-gray-500 mb-6">
              Pega el token que recibiste por correo y elige tu nueva contraseña.
            </p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

              <!-- Token -->
              <div>
                <label class="label" for="token">Token de recuperación</label>
                <input
                  id="token"
                  type="text"
                  formControlName="token"
                  class="input font-mono text-sm"
                  placeholder="Pega aquí el token del correo"
                  autocomplete="off"
                />
                @if (form.get('token')?.invalid && form.get('token')?.touched) {
                  <p class="text-xs text-red-600 mt-1">El token es requerido.</p>
                }
              </div>

              <!-- Nueva contraseña -->
              <div>
                <label class="label" for="password">Nueva contraseña</label>
                <div class="relative">
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    class="input pr-10"
                    autocomplete="new-password"
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
                @if (form.get('password')?.touched && form.get('password')?.errors?.['weakPassword']) {
                  <p class="text-xs text-red-600 mt-1">
                    Mínimo 8 caracteres, una mayúscula, una minúscula, un número
                    y un carácter especial (! &#64; # $ % &amp; * + - _).
                  </p>
                }
              </div>

              <!-- Confirmar contraseña -->
              <div>
                <label class="label" for="confirm">Confirmar contraseña</label>
                <input
                  id="confirm"
                  type="password"
                  formControlName="confirm"
                  class="input"
                  autocomplete="new-password"
                />
                @if (form.errors?.['mismatch'] && form.get('confirm')?.touched) {
                  <p class="text-xs text-red-600 mt-1">Las contraseñas no coinciden.</p>
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
                  Guardando...
                } @else {
                  Cambiar contraseña
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
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly year = new Date().getFullYear();
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.group(
    {
      token:    ['', [Validators.required]],
      password: ['', [Validators.required, strongPassword]],
      confirm:  ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    // Pre-fill token if it arrives as a query param (?token=XXX)
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.form.patchValue({ token: tokenParam });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { token, password } = this.form.value;

    this.authService.confirmPasswordReset(token!, password!).subscribe({
      next: () => {
        this.done.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
