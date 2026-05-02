import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div
        class="rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin"
        [class]="sizeClass()"
      ></div>
      @if (message()) {
        <p class="text-sm text-gray-500">{{ message() }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  message = input<string>('Cargando...');
  size = input<'sm' | 'md' | 'lg'>('md');

  sizeClass(): string {
    const map = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14' };
    return map[this.size()];
  }
}
