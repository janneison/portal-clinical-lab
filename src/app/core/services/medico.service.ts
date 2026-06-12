import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { Medico, CreateMedicoRequest, UpdateMedicoRequest } from '../models/medico.model';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/medicos`;

  getAll(q = '', includeInactive = false): Observable<Medico[]> {
    let params = new HttpParams();
    if (q.trim())        params = params.set('q', q.trim());
    if (includeInactive) params = params.set('activo', '0');
    return this.http.get<Medico[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener médicos')))
    );
  }

  getById(id: number): Observable<Medico> {
    return this.http.get<Medico>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Médico no encontrado')))
    );
  }

  create(data: CreateMedicoRequest): Observable<Medico> {
    return this.http.post<Medico>(this.base, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el médico')))
    );
  }

  update(id: number, data: UpdateMedicoRequest): Observable<Medico> {
    return this.http.put<Medico>(`${this.base}/${id}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el médico')))
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al desactivar el médico')))
    );
  }
}
