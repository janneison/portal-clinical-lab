import { OrderStatus } from './order.model';

export interface Patient {
  id: number;
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  sexo: 'M' | 'F';
  fechaNacimiento: string;
  email: string | null;
  telefono: string | null;
}

export interface CreatePatientRequest {
  tipoDocumento: string;
  identificacion: string;
  nombre: string;
  sexo: 'M' | 'F';
  fechaNacimiento: string;
  email?: string | null;
  telefono?: string | null;
}

export interface PatientDetail extends Patient {
  totalOrdenes: number;
  ordenes: PatientOrder[];
}

export interface PatientOrder {
  idSolicitudKey: string;
  fechaDeLaOrden: string;
  estadoDeLaOrden: OrderStatus;
  idAliado: string | null;
  centroDeSalud: string;
}

export interface PatientsPage {
  data: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
