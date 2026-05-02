import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-critical-alert',
  standalone: true,
  template: `
    <div class="alert bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 p-4 rounded-lg" role="alert">
      <span class="text-2xl animate-bounce">🚨</span>
      <div class="flex-1">
        <p class="font-bold text-sm">Resultado Crítico</p>
        <p class="text-sm mt-0.5">
          El resultado <strong>"{{ resultValue() }}"</strong> requiere atención inmediata.
        </p>
        @if (examName()) {
          <p class="text-xs mt-1 opacity-75">Examen: {{ examName() }}</p>
        }
      </div>
      @if (dismissable()) {
        <button
          (click)="dismissed.emit()"
          class="text-red-700 hover:text-red-900 transition-colors"
          aria-label="Cerrar alerta"
        >
          ✕
        </button>
      }
    </div>
  `,
})
export class CriticalAlertComponent {
  resultValue = input.required<string>();
  examName = input<string>('');
  dismissable = input<boolean>(false);
  dismissed = output<void>();
}
