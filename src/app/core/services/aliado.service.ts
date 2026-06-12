import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { Aliado, CreateAliadoRequest, UpdateAliadoRequest, UpdateAliadoResponse } from '../models/aliado.model';

@Injectable({ providedIn: 'root' })
export class AliadoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/aliados`;

  /** GET /aliados */
  getAll(): Observable<Aliado[]> {
    return this.http.get<Aliado[]>(this.base).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener aliados')))
    );
  }

  /** GET /aliados/{id} */
  getById(id: string): Observable<Aliado> {
    return this.http.get<Aliado>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Aliado no encontrado')))
    );
  }

  /** POST /aliados */
  create(data: CreateAliadoRequest): Observable<Aliado> {
    return this.http.post<Aliado>(this.base, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el aliado')))
    );
  }

  /** PUT /aliados/{id} */
  update(id: string, data: UpdateAliadoRequest): Observable<UpdateAliadoResponse> {
    return this.http.put<UpdateAliadoResponse>(`${this.base}/${id}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar aliado')))
    );
  }

  /** POST /aliados/{id}/logo — multipart/form-data */
  uploadLogo(id: string, file: File): Observable<{ message: string; logoPath: string }> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<{ message: string; logoPath: string }>(`${this.base}/${id}/logo`, form).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al subir el logo')))
    );
  }
}
