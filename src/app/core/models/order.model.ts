export type OrderStatus = 'pending' | 'sent' | 'completed';

export interface OrderDetail {
  cups: string;
  nombreDelLaboratorio: string;
  fechaTomaMuestra?: string | null;
  metodo?: string | null;
  reactivo?: string | null;
  invima?: string | null;
  estadoDelResultado?: string | null;
  fechaResultado?: string | null;
  tipoIdentificacionDelBacteriologo?: string | null;
  identificacionDelBacteriologo?: string | null;
}

export interface LabOrder {
  idSolicitudKey: string;
  idAdmision: string;
  idAtencion?: string;
  tipoDeDocumento: string;
  tipoDocumento?: string; // alias usado en el listado
  identificacion: string;
  nombreDelPaciente: string;
  sexo: 'M' | 'F';
  fechaDeNacimiento: string;
  centroDeSalud: string;
  fechaDeLaOrden: string;
  medicoQueOrdena: string;
  numeroDeAutorizacion?: string;
  idAliado?: string;
  porcEjecucion: number;
  estadoDeLaOrden: OrderStatus;
  fechaEnvio?: string | null;
  detalles: OrderDetail[];
}

// Shape returned by GET /orders (list item — no detalles array)
export interface OrderListItem {
  idSolicitudKey: string;
  idAdmision: string;
  nombreDelPaciente: string;
  identificacion: string;
  tipoDocumento: string;
  sexo: string;
  centroDeSalud: string;
  medicoQueOrdena: string;
  idAliado?: string;
  fechaDeLaOrden: string;
  fechaEnvio?: string | null;
  estadoDeLaOrden: OrderStatus;
  porcEjecucion: number;
}

export interface OrdersPage {
  data: OrderListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface OrderSummary {
  idSolicitudKey: string;
  estadoDeLaOrden: OrderStatus;
  porcEjecucion: number;
  detalles: number;
}

export interface CreateOrderRequest {
  idSolicitudKey: string;
  idAdmision: string;
  idAtencion?: string;
  tipoDeDocumento: string;
  identificacion: string;
  nombreDelPaciente: string;
  sexo: 'M' | 'F';
  fechaDeNacimiento: string;
  centroDeSalud: string;
  fechaDeLaOrden: string;
  medicoQueOrdena: string;
  numeroDeAutorizacion?: string;
  idAliado?: string;
  porcEjecucion?: string;
  detalles: OrderDetail[];
}

export interface OrderFilters {
  estado?: OrderStatus | '';
  fecha_desde?: string;
  fecha_hasta?: string;
  cups?: string;
  page?: number;
  limit?: number;
}
