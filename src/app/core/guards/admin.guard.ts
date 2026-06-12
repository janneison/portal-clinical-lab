import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Use permission-based check — no role name hardcoded
  if (auth.canRegisterUsers()) return true;
  return router.createUrlTree(['/dashboard']);
};

/** Allows anyone who can create or view orders (admin + lab_operator) */
export const labAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.canCreateOrder() || auth.canViewPatients() || auth.canEditExamCatalog()) return true;
  return router.createUrlTree(['/dashboard']);
};
