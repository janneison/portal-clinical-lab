import { Routes } from '@angular/router';
import { adminGuard, labAdminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'labs',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./labs/labs.component').then((m) => m.LabsComponent),
      },
      {
        path: 'health-centers',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./health-centers/health-centers.component').then(
            (m) => m.HealthCentersComponent
          ),
      },
      {
        path: 'patients',
        canActivate: [labAdminGuard],
        loadComponent: () =>
          import('./patients/patients.component').then((m) => m.PatientsComponent),
      },
      {
        path: 'roles',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'exam-catalog',
        canActivate: [labAdminGuard],
        loadComponent: () =>
          import('./exam-catalog/exam-catalog.component').then(
            (m) => m.ExamCatalogComponent
          ),
      },
      {
        path: 'exam-catalog/:cups/parameters',
        canActivate: [labAdminGuard],
        loadComponent: () =>
          import('./exam-parameters/exam-parameters.component').then(
            (m) => m.ExamParametersComponent
          ),
      },
      {
        path: 'orders/create',
        canActivate: [labAdminGuard],
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
