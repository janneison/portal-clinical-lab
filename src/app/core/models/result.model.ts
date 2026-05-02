export interface ResultValues {
  resultado: string;
  [key: string]: string;
}

export interface LabResult {
  id?: number;
  idSolicitudKey: string;
  cups: string;
  nombreDelLaboratorio?: string;
  values: ResultValues;
  attachmentPath?: string | null;
  receivedAt?: string;
  isCritical?: boolean;
}

export interface CreateResultRequest {
  idSolicitudKey: string;
  cups: string;
  values: ResultValues;
  attachmentPath?: string | null;
}

// Critical result keywords to flag automatically
export const CRITICAL_KEYWORDS = [
  'positivo',
  'crítico',
  'critico',
  'anormal',
  'alto',
  'bajo',
  'peligroso',
  'urgente',
  'alerta',
];

export function isCriticalResult(result: string): boolean {
  const lower = result.toLowerCase();
  return CRITICAL_KEYWORDS.some((kw) => lower.includes(kw));
}
