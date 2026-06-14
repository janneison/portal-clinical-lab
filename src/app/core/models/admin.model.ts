import { UserRole } from './auth.model';

// ─── Laboratorio Aliado ───────────────────────────────────────────────────────

export interface Aliado {
  id: string;
  nombre: string;
  activo: boolean;
  created_at?: string;
}

export interface CreateAliadoRequest {
  id: string;
  nombre: string;
  activo?: boolean;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  aliados: string[];
  /** IDs of health centers assigned to this user (used by medico role) */
  health_centers?: number[];
  activo?: boolean;
  created_at?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  aliados?: string[];
  /** Required for medico role — IDs of health centers the doctor can access */
  health_centers?: number[];
}

// ─── Roles (catálogo local) ───────────────────────────────────────────────────

export interface RoleDefinition {
  value: UserRole;
  label: string;
  description: string;
  color: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema. Gestiona usuarios, aliados y todas las órdenes.',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'lab_operator',
    label: 'Operador de Laboratorio',
    description: 'Crea y envía órdenes, registra resultados, lista todas las órdenes.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'aliado_operator',
    label: 'Operador Aliado',
    description: 'Consulta y lista órdenes de sus aliados asignados. Registra resultados.',
    color: 'bg-green-100 text-green-700',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Solo lectura. Lista y consulta órdenes de sus aliados asignados.',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    value: 'medico',
    label: 'Médico',
    description: 'Solo puede ver órdenes de los centros de salud que tiene asignados.',
    color: 'bg-teal-100 text-teal-700',
  },
];

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS.find((r) => r.value === role) ?? ROLE_DEFINITIONS[3];
}
