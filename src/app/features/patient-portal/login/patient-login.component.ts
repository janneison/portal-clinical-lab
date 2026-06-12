import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientPortalService } from '../../../core/services/patient-portal.service';

type Step = 'document' | 'otp';

@Component({
  selector: 'app-patient-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span class="text-3xl">🧪</span>
          </div>
          <h1 class="text-2xl font-bold text-white">Portal de Pacientes</h1>
          <p class="text-blue-200 text-sm mt-1">Consulta tus resultados de laboratorio</p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">

          <!-- Step indicator -->
          <div class="flex border-b border-gray-100">
            <div class="flex-1 py-3 text-center text-xs font-semibold"
              [class.text-blue-700]="step() === 'document'"
              [class.text-gray-400]="step() !== 'document'">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1"
                [class.bg-blue-600]="step() === 'document'"
                [class.text-white]="step() === 'document'"
                [class.bg-gray-200]="step() !== 'document'">1</span>
              Identificación
            </div>
            <div class="flex-1 py-3 text-center text-xs font-semibold"
              [class.text-blue-700]="step() === 'otp'"
              [class.text-gray-400]="step() !== 'otp'">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1"
                [class.bg-blue-600]="step() === 'otp'"
                [class.text-white]="step() === 'otp'"
                [class.bg-gray-200]="step() !== 'otp'">2</span>
              Código de acceso
            </div>
          </div>

          <!-- Step 1: Document -->
          @if (step() === 'document') {
            <div class="p-8">
              <h2 class="text-lg font-semibold text-gray-900 mb-1">Ingresa tu documento</h2>
              <p class="text-sm text-gray-500 mb-6">
                Te enviaremos un código de acceso a tu correo registrado
              </p>

              <form [formGroup]="docForm" (ngSubmit)="requestAccess()" class="space-y-4">
                <div>
                  <label class="label">Tipo de documento</label>
                  <select formControlName="tipoDocumento" class="input">
                    <option value="">Selecciona</option>
                    <option value="CC">CC — Cédula de Ciudadanía</option>
                    <option value="TI">TI — Tarjeta de Identidad</option>
                    <option value="PA">PA — Pasaporte</option>
                    <option value="CE">CE — Cédula de Extranjería</option>
                    <option value="RC">RC — Registro Civil</option>
                  </select>
                  @if (df['tipoDocumento'].invalid && df['tipoDocumento'].touched) {
                    <p class="text-xs text-red-600 mt-1">Requerido</p>
                  }
                </div>

                <div>
                  <label class="label">Número de documento</label>
                  <input
                    type="text"
                    formControlName="identificacion"
                    class="input"
                    placeholder="Ej: 1020304050"
                    autocomplete="off"
                  />
                  @if (df['identificacion'].invalid && df['identificacion'].touched) {
                    <p class="text-xs text-red-600 mt-1">Requerido</p>
                  }
                </div>

                @if (docError()) {
                  <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    {{ docError() }}
                  </div>
                }

                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="docLoading()">
                  @if (docLoading()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Enviando código...
                  } @else {
                    Enviar código de acceso →
                  }
                </button>
              </form>
            </div>
          }

          <!-- Step 2: OTP -->
          @if (step() === 'otp') {
            <div class="p-8">
              <h2 class="text-lg font-semibold text-gray-900 mb-1">Ingresa el código</h2>
              <p class="text-sm text-gray-500 mb-2">
                Enviamos un código de 6 dígitos al correo registrado para
                <strong>{{ docForm.value.tipoDocumento }}: {{ docForm.value.identificacion }}</strong>
              </p>
              <p class="text-xs text-gray-400 mb-6">El código expira en 15 minutos.</p>

              <form [formGroup]="otpForm" (ngSubmit)="verify()" class="space-y-4">
                <div>
                  <label class="label">Código de acceso</label>
                  <input
                    type="text"
                    formControlName="codigo"
                    class="input text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxlength="6"
                    autocomplete="one-time-code"
                    inputmode="numeric"
                  />
                  @if (otpForm.get('codigo')?.invalid && otpForm.get('codigo')?.touched) {
                    <p class="text-xs text-red-600 mt-1">Ingresa el código de 6 dígitos</p>
                  }
                </div>

                @if (otpError()) {
                  <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    {{ otpError() }}
                  </div>
                }

                <button type="submit" class="btn-primary w-full btn-lg" [disabled]="otpLoading()">
                  @if (otpLoading()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verificando...
                  } @else {
                    Ingresar al portal
                  }
                </button>

                <div class="text-center">
                  <button
                    type="button"
                    (click)="backToDocument()"
                    class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ← Cambiar documento
                  </button>
                  <span class="text-gray-300 mx-2">|</span>
                  <button
                    type="button"
                    (click)="resendCode()"
                    class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    [disabled]="resendCooldown() > 0"
                  >
                    @if (resendCooldown() > 0) {
                      Reenviar en {{ resendCooldown() }}s
                    } @else {
                      Reenviar código
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>

        <p class="text-center text-blue-300 text-xs mt-6">
          © {{ year }} Clinical Lab — Portal de Pacientes
        </p>
      </div>
    </div>
  `,
})
export class PatientLoginComponent {
  private readonly svc = inject(PatientPortalService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly year = new Date().getFullYear();
  readonly step = signal<Step>('document');

  // Step 1
  readonly docLoading = signal(false);
  readonly docError = signal('');
  readonly docForm = this.fb.group({
    tipoDocumento: ['', Validators.required],
    identificacion: ['', Validators.required],
  });
  get df() { return this.docForm.controls; }

  // Step 2
  readonly otpLoading = signal(false);
  readonly otpError = signal('');
  readonly resendCooldown = signal(0);
  readonly otpForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  requestAccess(): void {
    if (this.docForm.invalid) { this.docForm.markAllAsTouched(); return; }
    this.docLoading.set(true);
    this.docError.set('');
    const { tipoDocumento, identificacion } = this.docForm.value;

    this.svc.requestAccess(tipoDocumento!, identificacion!).subscribe({
      next: () => {
        this.docLoading.set(false);
        this.step.set('otp');
        this.startResendCooldown();
      },
      error: (err: Error) => {
        this.docError.set(err.message);
        this.docLoading.set(false);
      },
    });
  }

  verify(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.otpLoading.set(true);
    this.otpError.set('');
    const { tipoDocumento, identificacion } = this.docForm.value;
    const { codigo } = this.otpForm.value;

    this.svc.verify(tipoDocumento!, identificacion!, codigo!).subscribe({
      next: () => {
        this.router.navigate(['/patient-portal/results']);
      },
      error: (err: Error) => {
        this.otpError.set(err.message);
        this.otpLoading.set(false);
      },
    });
  }

  backToDocument(): void {
    this.step.set('document');
    this.otpForm.reset();
    this.otpError.set('');
  }

  resendCode(): void {
    if (this.resendCooldown() > 0) return;
    const { tipoDocumento, identificacion } = this.docForm.value;
    this.svc.requestAccess(tipoDocumento!, identificacion!).subscribe({
      next: () => this.startResendCooldown(),
      error: () => {},
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    const interval = setInterval(() => {
      this.resendCooldown.update((v) => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  }
}
