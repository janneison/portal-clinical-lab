import { Routes } from '@angular/router';
import { patientAuthGuard, patientGuestGuard } from '../../core/guards/patient-portal.guard';

export const patientPortalRoutes: Routes = [
  {
    path: 'login',
    canActivate: [patientGuestGuard],
    loadComponent: () =>
      import('./login/patient-login.component').then((m) => m.PatientLoginComponent),
  },
  {
    path: 'results',
    canActivate: [patientAuthGuard],
    loadComponent: () =>
      import('./results/patient-results.component').then((m) => m.PatientResultsComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
