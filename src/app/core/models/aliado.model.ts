export interface Aliado {
  id: string;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  email: string | null;
  logoPath: string | null;
  activo: boolean;
}

export interface CreateAliadoRequest {
  id: string;
  nombre: string;
  nit?: string | null;
  direccion?: string | null;
  email?: string | null;
  activo?: boolean;
}

export interface UpdateAliadoRequest {
  nombre: string;
  nit?: string | null;
  direccion?: string | null;
  email?: string | null;
  activo?: boolean;
}

export interface UpdateAliadoResponse {
  message: string;
  aliado: Aliado;
}
