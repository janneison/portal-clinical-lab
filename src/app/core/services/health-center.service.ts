import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  HealthCenter,
  CreateHealthCenterRequest,
  UpdateHealthCenterRequest,
} from '../models/health-center.model';

@Injectable({ providedIn: 'root' })
export class HealthCenterService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/health-centers`;

  getHealthCenters(includeInactive = false, aliadoId?: string): Observable<HealthCenter[]> {
    let params = new HttpParams();
    if (includeInactive) params = params.set('activo', '0');
    if (aliadoId)        params = params.set('aliado_id', aliadoId);
    return this.http.get<HealthCenter[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener centros de salud')))
    );
  }

  createHealthCenter(data: CreateHealthCenterRequest): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(this.base, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el centro de salud')))
    );
  }

  updateHealthCenter(id: number, data: UpdateHealthCenterRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el centro de salud')))
    );
  }

  associateAliado(id: number, aliadoId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${id}/aliados/${aliadoId}`, {}).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al asociar aliado')))
    );
  }

  dissociateAliado(id: number, aliadoId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}/aliados/${aliadoId}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al desasociar aliado')))
    );
  }
}
