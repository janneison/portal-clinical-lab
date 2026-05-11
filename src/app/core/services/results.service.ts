import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiResultItem,
  CreateResultRequest,
  LabResult,
  OrderResultsResponse,
  extractResultado,
  isCriticalResult,
} from '../models/result.model';

export interface CreateResultResponse {
  idSolicitudKey: string;
  cups: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private readonly http = inject(HttpClient);
  private readonly ordersBase = `${environment.apiUrl}/orders`;
  private readonly resultsBase = `${environment.apiUrl}/results`;

  /**
   * GET /orders/{idSolicitudKey}/results
   * Returns the full valuesJson for each exam result.
   */
  getResultsByOrder(idSolicitudKey: string): Observable<OrderResultsResponse> {
    return this.http
      .get<OrderResultsResponse>(`${this.ordersBase}/${idSolicitudKey}/results`)
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al obtener los resultados'))
        )
      );
  }

  /**
   * POST /results — register a new result
   */
  createResult(result: CreateResultRequest): Observable<CreateResultResponse> {
    return this.http.post<CreateResultResponse>(this.resultsBase, result).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al registrar el resultado'))
      )
    );
  }

  /** Converts an ApiResultItem to a LabResult with critical flag */
  fromApiResult(api: ApiResultItem, nombreDelLaboratorio?: string): LabResult {
    const resultado = extractResultado(api.valuesJson);
    return {
      id:                  api.labResultId,
      idSolicitudKey:      '', // filled by caller
      cups:                api.cups,
      nombreDelLaboratorio,
      valuesJson:          api.valuesJson,
      values:              { resultado },   // flat fallback
      attachmentPath:      null,
      receivedAt:          api.receivedAt,
      isCritical:          isCriticalResult(resultado),
    };
  }

  /** Enriches a LabResult with the isCritical flag from flat values */
  enrichWithCritical(result: LabResult): LabResult {
    return {
      ...result,
      isCritical: isCriticalResult(result.values.resultado),
    };
  }

  /** Generates a shareable plain-text summary */
  generateShareText(result: LabResult, patientName: string): string {
    const lines = [
      `Resultado de Laboratorio`,
      `Paciente: ${patientName}`,
      `Orden: ${result.idSolicitudKey}`,
      `Examen (CUPS ${result.cups}): ${result.nombreDelLaboratorio ?? ''}`,
      `Fecha: ${result.receivedAt ? new Date(result.receivedAt).toLocaleDateString('es-CO') : 'N/A'}`,
    ];

    if (result.valuesJson) {
      lines.push('Valores:');
      for (const [key, entry] of Object.entries(result.valuesJson)) {
        if (typeof entry === 'string') {
          lines.push(`  ${key}: ${entry}`);
        } else {
          const unidad = entry.unidad ? ` ${entry.unidad}` : '';
          const ref    = entry.referencia ? ` (ref: ${entry.referencia})` : '';
          lines.push(`  ${key}: ${entry.valor}${unidad}${ref}`);
        }
      }
    } else {
      lines.push(`Resultado: ${result.values.resultado}`);
    }

    return lines.join('\n');
  }
}
