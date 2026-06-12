export type UserRole = 'admin' | 'lab_operator' | 'aliado_operator' | 'viewer';

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
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  aliados: string[];
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
  iss: string;
  iat: number;
  exp: number;
}

/** Fallback permissions derived from role when the API doesn't return them */
export function defaultPermissions(role: UserRole): UserPermissions {
  const write = role === 'admin' || role === 'lab_operator';
  const admin = role === 'admin';
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
    canStoreResult:        role !== 'viewer',
    canAttachPdf:          role !== 'viewer',
    canSendResultEmail:    role !== 'viewer',
    canEditExamCatalog:    admin,
  };
}
