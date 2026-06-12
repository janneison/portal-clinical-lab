// ─── Antibiograma ─────────────────────────────────────────────────────────────

export type Sensibilidad = 'S' | 'I' | 'R';
export type GramTipo = 'positivo' | 'negativo' | 'n/a';

export interface AntibiogramaItem {
  antibiotico: string;
  cim: string;
  sensibilidad: Sensibilidad;
  metodo: string;
}

export interface Antibiograma {
  id?: number;
  bacteriaAislada: string;
  esNegativo?: boolean;
  gram: GramTipo;
  tiempoIncubacion: string | null;
  gramOrina: string | null;
  observaciones: string | null;
  items: AntibiogramaItem[];
}

/** CUPS codes that correspond to culture exams */
export const CULTURE_CUPS = [
  '901236', // Urocultivo
  '901237', // Hemocultivo
  '901238', // Coprocultivo
  '901239', // Cultivo de secreción
  '901240', // Cultivo de esputo
  '901241', // Cultivo de LCR
];

export function isCultureExam(cups: string): boolean {
  return CULTURE_CUPS.includes(cups.trim());
}

export const SENSIBILIDAD_CONFIG: Record<Sensibilidad, { label: string; class: string }> = {
  S: { label: 'Sensible',     class: 'bg-green-100 text-green-700' },
  I: { label: 'Intermedio',   class: 'bg-yellow-100 text-yellow-700' },
  R: { label: 'Resistente',   class: 'bg-red-100 text-red-700' },
};

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

/** Bacteriólogo embebido en el resultado */
export interface ResultBacteriologo {
  id: number;
  nombre: string;
  tipoDocumento: string;
  identificacion: string;
  tarjetaProfesional: string | null;
  universidad: string | null;
  firmaPath: string | null;
}

export interface ApiResultItem {
  labResultId: number;
  cups: string;
  bacteriologo: ResultBacteriologo | null;
  valuesJson: Record<string, ResultValueDetail | string>;
  valoresEstructurados: ValorEstructurado[];
  antibiogramas?: Antibiograma[];
  receivedAt: string;
}

export interface ValorEstructurado {
  codigo: string;
  nombre: string;
  tipoResultado: string;
  valorNumerico: number | null;
  valorTexto: string | null;
  valorBooleano: boolean | null;
  reactivo: string | null;
  unidad: string | null;
  valorMinRef: number | null;
  valorMaxRef: number | null;
  etiquetaBooleano: string | null;
  flag: string;
  comentario?: string | null;
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
  valuesJson?: Record<string, ResultValueDetail | string>;
  valoresEstructurados?: ValorEstructurado[];
  values: ResultValues;
  attachmentPath?: string | null;
  receivedAt?: string;
  isCritical?: boolean;
  bacteriologo?: ResultBacteriologo | null;
  antibiogramas?: Antibiograma[];
}

export interface CreateResultRequest {
  idSolicitudKey: string;
  cups: string;
  values: ResultValues;
  attachmentPath?: string | null;
  bacteriologoId?: number | null;
  antibiogramas?: Antibiograma[];
}

// ─── Display row ──────────────────────────────────────────────────────────────

export interface ResultValueRow {
  parametro: string;
  valor: string;
  unidad: string;
  referencia: string;
  isMain: boolean;
  comentario?: string;
}

export function valuesToRows(
  valuesJson: Record<string, ResultValueDetail | string>,
  estructurados?: ValorEstructurado[]
): ResultValueRow[] {
  // If structured values available, use them (they include comentario)
  if (estructurados && estructurados.length > 0) {
    return estructurados.map((v) => ({
      parametro:  v.nombre,
      valor:      v.valorNumerico !== null
                    ? String(v.valorNumerico)
                    : v.valorTexto ?? (v.valorBooleano !== null ? String(v.valorBooleano) : '—'),
      unidad:     v.unidad     ?? '',
      referencia: v.valorMinRef !== null && v.valorMaxRef !== null
                    ? `${v.valorMinRef} – ${v.valorMaxRef}`
                    : '',
      isMain:     false,
      comentario: v.comentario ?? undefined,
    }));
  }

  // Fallback: parse valuesJson
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

export function isCriticalResult(result: unknown): boolean {
  const str = result == null ? '' : String(result);
  return CRITICAL_KEYWORDS.some((kw) => str.toLowerCase().includes(kw));
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
    return typeof v === 'string' ? v : String(v.valor ?? '');
  }
  const first = Object.values(valuesJson)[0];
  if (!first) return '';
  return typeof first === 'string' ? first : String(first.valor ?? '');
}
