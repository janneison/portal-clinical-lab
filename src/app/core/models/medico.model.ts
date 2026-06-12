export interface Medico {
  id: number;
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  especialidad: string | null;
  registroMedico: string | null;
  userId: number | null;
  activo: boolean;
}

export interface CreateMedicoRequest {
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  especialidad?: string | null;
  registroMedico?: string | null;
  userId?: number | null;
}

export type UpdateMedicoRequest = Partial<CreateMedicoRequest> & { activo?: boolean };
