import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'labs',
        loadComponent: () =>
          import('./labs/labs.component').then((m) => m.LabsComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'orders/create',
        loadComponent: () =>
          import('./orders-create/orders-create.component').then(
            (m) => m.OrdersCreateComponent
          ),
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
];
