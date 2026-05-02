import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { CreateResultRequest, LabResult, isCriticalResult } from '../models/result.model';

export interface CreateResultResponse {
  idSolicitudKey: string;
  cups: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/results`;

  createResult(result: CreateResultRequest): Observable<CreateResultResponse> {
    return this.http.post<CreateResultResponse>(this.base, result).pipe(
      catchError((err) => {
        const message = err.error?.error ?? 'Error al registrar el resultado';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Enriches a result with critical flag based on the resultado value.
   */
  enrichWithCritical(result: LabResult): LabResult {
    return {
      ...result,
      isCritical: isCriticalResult(result.values.resultado),
    };
  }

  /**
   * Generates a shareable text summary of a result.
   */
  generateShareText(result: LabResult, patientName: string): string {
    const lines = [
      `Resultado de Laboratorio`,
      `Paciente: ${patientName}`,
      `Orden: ${result.idSolicitudKey}`,
      `Examen (CUPS ${result.cups}): ${result.nombreDelLaboratorio ?? ''}`,
      `Resultado: ${result.values.resultado}`,
      `Fecha: ${result.receivedAt ? new Date(result.receivedAt).toLocaleDateString('es-CO') : 'N/A'}`,
    ];

    const extras = Object.entries(result.values)
      .filter(([k]) => k !== 'resultado')
      .map(([k, v]) => `  ${k}: ${v}`);

    if (extras.length) {
      lines.push('Detalles:', ...extras);
    }

    return lines.join('\n');
  }
}
