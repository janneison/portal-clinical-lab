// ─── Exam Types ───────────────────────────────────────────────────────────────

export interface ExamType {
  cups: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CreateExamTypeRequest {
  cups: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface UpdateExamTypeRequest {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}

// ─── Exam Parameters ──────────────────────────────────────────────────────────

export type ParameterFlag = 'normal' | 'alto' | 'bajo' | 'critico' | 'indeterminado';
export type ParameterSexo = 'M' | 'F' | '*';
export type TipoResultado = 'numerico' | 'texto' | 'booleano';
export type EtiquetaBooleano = 'normal_alto' | 'positivo_negativo' | 'reactivo_no_reactivo';

export interface ExamParameter {
  id: number;
  codigo: string;
  nombre: string;
  unidad: string | null;
  valorMinRef: number | null;
  valorMaxRef: number | null;
  sexo: ParameterSexo;
  edadMin: number | null;
  edadMax: number | null;
  obligatorio: boolean;
  orden: number;
  activo: boolean;
  tipoResultado: TipoResultado;
  etiquetaBooleano: EtiquetaBooleano | null;
  comentario: string | null;
}

export interface CreateParameterRequest {
  codigo: string;
  nombre: string;
  unidad?: string | null;
  valorMinRef?: number | null;
  valorMaxRef?: number | null;
  sexo?: ParameterSexo;
  edadMin?: number | null;
  edadMax?: number | null;
  obligatorio?: boolean;
  orden?: number;
  tipoResultado?: TipoResultado;
  etiquetaBooleano?: EtiquetaBooleano | null;
  comentario?: string | null;
}

export type UpdateParameterRequest = Partial<CreateParameterRequest>;

// ─── Parameter Ranges ─────────────────────────────────────────────────────────

export interface ParameterRange {
  id: number;
  reactivo: string;
  valorMinRef: number | null;
  valorMaxRef: number | null;
  sexo: ParameterSexo;
  edadMin: number | null;
  edadMax: number | null;
  activo: boolean;
}

export interface CreateRangeRequest {
  reactivo: string;
  valorMinRef?: number | null;
  valorMaxRef?: number | null;
  sexo?: ParameterSexo;
  edadMin?: number | null;
  edadMax?: number | null;
}

export type UpdateRangeRequest = Partial<CreateRangeRequest>;

// ─── Flag helpers ─────────────────────────────────────────────────────────────

export const FLAG_CONFIG: Record<ParameterFlag, { label: string; class: string }> = {
  normal:        { label: 'Normal',        class: 'bg-green-100 text-green-700' },
  alto:          { label: 'Alto',          class: 'bg-yellow-100 text-yellow-700' },
  bajo:          { label: 'Bajo',          class: 'bg-blue-100 text-blue-700' },
  critico:       { label: 'Crítico',       class: 'bg-red-100 text-red-700' },
  indeterminado: { label: 'Indeterminado', class: 'bg-gray-100 text-gray-500' },
};

export const TIPO_RESULTADO_LABELS: Record<TipoResultado, string> = {
  numerico: 'Numérico',
  texto:    'Texto',
  booleano: 'Booleano',
};

export const ETIQUETA_BOOLEANO_LABELS: Record<EtiquetaBooleano, string> = {
  normal_alto:          'Normal / Alto',
  positivo_negativo:    'Positivo / Negativo',
  reactivo_no_reactivo: 'Reactivo / No reactivo',
};
