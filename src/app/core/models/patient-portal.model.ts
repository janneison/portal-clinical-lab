export interface PatientPortalInfo {
  nombre: string;
  tipoDocumento: string;
  identificacion: string;
}

export interface PatientPortalOrder {
  idSolicitudKey: string;
  fechaDeLaOrden: string;
  estadoDeLaOrden: string;
  centroDeSalud: string;
  medicoQueOrdena: string;
}

export interface PatientPortalResultsResponse {
  patient: PatientPortalInfo;
  ordenes: PatientPortalOrder[];
  total: number;
}

export interface PatientPortalVerifyResponse {
  token: string;
  patient: PatientPortalInfo & { id: number };
  expiresIn: number;
}

export interface PatientJwtPayload {
  iss: string;
  sub: number;
  nombre: string;
  tipoDocumento: string;
  identificacion: string;
  iat: number;
  exp: number;
}
