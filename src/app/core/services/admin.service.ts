import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminUser, Aliado, CreateAliadoRequest, CreateUserRequest } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ─── Users ────────────────────────────────────────────────────────────────

  createUser(user: CreateUserRequest): Observable<{ id: number; message: string }> {
    return this.http
      .post<{ id: number; message: string }>(`${this.base}/auth/register`, user)
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al crear el usuario'))
        )
      );
  }

  // ─── Aliados ──────────────────────────────────────────────────────────────
  // NOTE: The current API does not expose CRUD endpoints for aliados yet.
  // These methods are ready for when the backend adds them.

  getAliados(): Observable<Aliado[]> {
    return this.http.get<Aliado[]>(`${this.base}/aliados`).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al obtener los laboratorios'))
      )
    );
  }

  createAliado(aliado: CreateAliadoRequest): Observable<Aliado> {
    return this.http.post<Aliado>(`${this.base}/aliados`, aliado).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al crear el laboratorio'))
      )
    );
  }

  updateAliado(id: string, aliado: Partial<CreateAliadoRequest>): Observable<Aliado> {
    return this.http.put<Aliado>(`${this.base}/aliados/${id}`, aliado).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.error ?? 'Error al actualizar el laboratorio'))
      )
    );
  }
}
