import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">{{ icon() }}</div>
      <h3 class="text-lg font-semibold text-gray-700">{{ title() }}</h3>
      @if (description()) {
        <p class="text-sm text-gray-500 mt-1 max-w-xs">{{ description() }}</p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input<string>('🔍');
  title = input<string>('Sin resultados');
  description = input<string>('');
}
