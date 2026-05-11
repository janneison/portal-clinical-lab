export interface HealthCenter {
  id: number;
  nombre: string;
  ciudad: string | null;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
  aliados?: string[];
}

export interface CreateHealthCenterRequest {
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo?: boolean;
}

export type UpdateHealthCenterRequest = Partial<CreateHealthCenterRequest>;
