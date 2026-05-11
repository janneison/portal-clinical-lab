// ─── Raw API shapes ───────────────────────────────────────────────────────────

/** Single parameter value as returned by the API in valuesJson */
export interface ResultValueDetail {
  valor: string;
  unidad?: string;
  referencia?: string;
}

/** Shape returned by GET /orders/{id}/results */
export interface OrderResultsResponse {
  idSolicitudKey: string;
  resultados: ApiResultItem[];
}

export interface ApiResultItem {
  labResultId: number;
  cups: string;
  valuesJson: Record<string, ResultValueDetail | string>;
  valoresEstructurados: any[];
  receivedAt: string;
}

// ─── Internal model ───────────────────────────────────────────────────────────

/** Simplified values map used internally (key → display string) */
export interface ResultValues {
  resultado: string;
  [key: string]: string;
}

export interface LabResult {
  id?: number;
  idSolicitudKey: string;
  cups: string;
  nombreDelLaboratorio?: string;
  /** Raw valuesJson from the API — preferred for display */
  valuesJson?: Record<string, ResultValueDetail | string>;
  /** Fallback flat values map */
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

// ─── Display row ──────────────────────────────────────────────────────────────

export interface ResultValueRow {
  parametro: string;
  valor: string;
  unidad: string;
  referencia: string;
  isMain: boolean;
}

/**
 * Converts a valuesJson object into display rows.
 * Handles both structured { valor, unidad, referencia } and plain string values.
 */
export function valuesToRows(
  valuesJson: Record<string, ResultValueDetail | string>
): ResultValueRow[] {
  return Object.entries(valuesJson).map(([key, entry]) => {
    const isMain = key === 'resultado';
    const label  = isMain ? 'Resultado clínico' : key;

    if (typeof entry === 'string') {
      return { parametro: label, valor: entry, unidad: '', referencia: '', isMain };
    }
    return {
      parametro:  label,
      valor:      entry.valor      ?? '—',
      unidad:     entry.unidad     ?? '',
      referencia: entry.referencia ?? '',
      isMain,
    };
  });
}

// ─── Critical detection ───────────────────────────────────────────────────────

export const CRITICAL_KEYWORDS = [
  'positivo', 'crítico', 'critico', 'anormal',
  'alto', 'bajo', 'peligroso', 'urgente', 'alerta',
];

export function isCriticalResult(result: string): boolean {
  return CRITICAL_KEYWORDS.some((kw) => result.toLowerCase().includes(kw));
}

/**
 * Derives a representative resultado string from valuesJson
 * for critical-flag detection.
 */
export function extractResultado(
  valuesJson: Record<string, ResultValueDetail | string>
): string {
  if ('resultado' in valuesJson) {
    const v = valuesJson['resultado'];
    return typeof v === 'string' ? v : v.valor;
  }
  const first = Object.values(valuesJson)[0];
  if (!first) return '';
  return typeof first === 'string' ? first : first.valor;
}
