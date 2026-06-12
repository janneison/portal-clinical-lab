import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Bacteriologo,
  CreateBacteriologoRequest,
  UpdateBacteriologoRequest,
} from '../models/bacteriologo.model';

@Injectable({ providedIn: 'root' })
export class BacteriologoService {
  private readonly http = inject(HttpClient);
  private readonly aliadosBase = `${environment.apiUrl}/aliados`;
  private readonly base = `${environment.apiUrl}/bacteriologos`;

  /** GET /aliados/{aliadoId}/bacteriologos */
  getByAliado(aliadoId: string, includeInactive = false): Observable<Bacteriologo[]> {
    const params = includeInactive ? new HttpParams().set('activo', '0') : new HttpParams();
    return this.http
      .get<Bacteriologo[]>(`${this.aliadosBase}/${aliadoId}/bacteriologos`, { params })
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener bacteriólogos'))));
  }

  /** POST /aliados/{aliadoId}/bacteriologos */
  create(aliadoId: string, data: CreateBacteriologoRequest): Observable<Bacteriologo> {
    return this.http
      .post<Bacteriologo>(`${this.aliadosBase}/${aliadoId}/bacteriologos`, data)
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear bacteriólogo'))));
  }

  /** GET /bacteriologos/{id} */
  getById(id: number): Observable<Bacteriologo> {
    return this.http
      .get<Bacteriologo>(`${this.base}/${id}`)
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Bacteriólogo no encontrado'))));
  }

  /** PUT /bacteriologos/{id} */
  update(id: number, data: UpdateBacteriologoRequest): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.base}/${id}`, data)
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar bacteriólogo'))));
  }

  /** DELETE /bacteriologos/{id} */
  delete(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.base}/${id}`)
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al desactivar bacteriólogo'))));
  }

  /** POST /bacteriologos/{id}/firma — multipart/form-data */
  uploadFirma(id: number, file: File): Observable<{ message: string; firmaPath: string }> {
    const form = new FormData();
    form.append('firma', file);
    return this.http
      .post<{ message: string; firmaPath: string }>(`${this.base}/${id}/firma`, form)
      .pipe(catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al subir la firma'))));
  }
}
