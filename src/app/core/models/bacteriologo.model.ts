export interface Bacteriologo {
  id: number;
  aliadoId: string;
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  tarjetaProfesional: string | null;
  universidad: string | null;
  firmaPath: string | null;
  activo: boolean;
}

export interface CreateBacteriologoRequest {
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  tarjetaProfesional?: string | null;
  universidad?: string | null;
}

export interface UpdateBacteriologoRequest extends Partial<CreateBacteriologoRequest> {
  activo?: boolean;
}
