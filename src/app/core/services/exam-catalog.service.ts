import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ExamType,
  ExamParameter,
  ParameterRange,
  CreateExamTypeRequest,
  UpdateExamTypeRequest,
  CreateParameterRequest,
  UpdateParameterRequest,
  CreateRangeRequest,
  UpdateRangeRequest,
} from '../models/exam-catalog.model';

@Injectable({ providedIn: 'root' })
export class ExamCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/exam-types`;

  // ─── Exam Types ─────────────────────────────────────────────────────────────

  getExamTypes(includeInactive = false): Observable<ExamType[]> {
    const params = includeInactive ? new HttpParams().set('activo', '0') : new HttpParams();
    return this.http.get<ExamType[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener el catálogo')))
    );
  }

  createExamType(data: CreateExamTypeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.base, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el tipo de examen')))
    );
  }

  updateExamType(cups: string, data: UpdateExamTypeRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${cups}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el tipo de examen')))
    );
  }

  // ─── Parameters ─────────────────────────────────────────────────────────────

  getParameters(cups: string): Observable<ExamParameter[]> {
    return this.http.get<ExamParameter[]>(`${this.base}/${cups}/parameters`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener los parámetros')))
    );
  }

  createParameter(cups: string, data: CreateParameterRequest): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.base}/${cups}/parameters`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el parámetro')))
    );
  }

  updateParameter(cups: string, id: number, data: UpdateParameterRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${cups}/parameters/${id}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el parámetro')))
    );
  }

  deleteParameter(cups: string, id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${cups}/parameters/${id}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al desactivar el parámetro')))
    );
  }

  // ─── Parameter Ranges ───────────────────────────────────────────────────────

  getRanges(cups: string, parameterId: number): Observable<ParameterRange[]> {
    return this.http.get<ParameterRange[]>(`${this.base}/${cups}/parameters/${parameterId}/ranges`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener los rangos')))
    );
  }

  createRange(cups: string, parameterId: number, data: CreateRangeRequest): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.base}/${cups}/parameters/${parameterId}/ranges`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el rango')))
    );
  }

  updateRange(cups: string, parameterId: number, rangeId: number, data: UpdateRangeRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${cups}/parameters/${parameterId}/ranges/${rangeId}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el rango')))
    );
  }

  deleteRange(cups: string, parameterId: number, rangeId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${cups}/parameters/${parameterId}/ranges/${rangeId}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al desactivar el rango')))
    );
  }
}
