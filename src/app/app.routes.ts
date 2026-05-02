import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders-list/orders-list.component').then(
            (m) => m.OrdersListComponent
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent
          ),
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./features/results/results-list/results-list.component').then(
            (m) => m.ResultsListComponent
          ),
      },
      {
        path: 'results/:orderId/:cups',
        loadComponent: () =>
          import('./features/results/result-detail/result-detail.component').then(
            (m) => m.ResultDetailComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
