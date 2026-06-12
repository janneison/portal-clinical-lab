import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PatientPortalService } from '../services/patient-portal.service';

export const patientAuthGuard: CanActivateFn = () => {
  const svc = inject(PatientPortalService);
  const router = inject(Router);
  return svc.isAuthenticated() ? true : router.createUrlTree(['/patient-portal/login']);
};

export const patientGuestGuard: CanActivateFn = () => {
  const svc = inject(PatientPortalService);
  const router = inject(Router);
  return svc.isAuthenticated() ? router.createUrlTree(['/patient-portal/results']) : true;
};
