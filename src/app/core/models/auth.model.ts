export type UserRole = 'admin' | 'lab_operator' | 'aliado_operator' | 'viewer' | 'medico';

export interface UserPermissions {
  canRegisterUsers:    boolean;
  canEditAliado:       boolean;
  canUploadAliadoLogo: boolean;
  canCreateBacteriologo: boolean;
  canEditBacteriologo:   boolean;
  canDeleteBacteriologo: boolean;
  canUploadFirma:      boolean;
  canCreateHealthCenter: boolean;
  canEditHealthCenter:   boolean;
  canViewPatients:     boolean;
  canCreatePatient:    boolean;
  canEditPatient:      boolean;
  canCreateOrder:      boolean;
  canSendOrder:        boolean;
  canMarkOrdersSent:   boolean;
  canStoreResult:      boolean;
  canAttachPdf:        boolean;
  canSendResultEmail:  boolean;
  canEditExamCatalog:  boolean;
  /** medico: can list orders filtered to their assigned health centers */
  canViewOrders:       boolean;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  aliados: string[];
  /** IDs of health centers assigned to this user (used by medico role) */
  health_centers?: number[];
  permissions?: UserPermissions;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
  aliados: string[];
  /** Health center IDs — present for medico role */
  health_centers: number[];
  iss: string;
  iat: number;
  exp: number;
}

/** Fallback permissions derived from role when the API doesn't return them */
export function defaultPermissions(role: UserRole): UserPermissions {
  const write  = role === 'admin' || role === 'lab_operator';
  const admin  = role === 'admin';
  const medico = role === 'medico';
  return {
    canRegisterUsers:      admin,
    canEditAliado:         admin,
    canUploadAliadoLogo:   admin,
    canCreateBacteriologo: admin,
    canEditBacteriologo:   admin,
    canDeleteBacteriologo: admin,
    canUploadFirma:        admin,
    canCreateHealthCenter: admin,
    canEditHealthCenter:   admin,
    canViewPatients:       write,
    canCreatePatient:      write,
    canEditPatient:        write,
    canCreateOrder:        write,
    canSendOrder:          write,
    canMarkOrdersSent:     write,
    canStoreResult:        role !== 'viewer' && !medico,
    canAttachPdf:          role !== 'viewer' && !medico,
    canSendResultEmail:    role !== 'viewer' && !medico,
    canEditExamCatalog:    admin,
    // medico can only view orders (filtered to their health centers)
    canViewOrders:         write || medico || role === 'aliado_operator' || role === 'viewer',
  };
}
