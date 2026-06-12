import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '@environments/environment';
import {
  PatientPortalInfo,
  PatientPortalResultsResponse,
  PatientPortalVerifyResponse,
  PatientJwtPayload,
} from '../models/patient-portal.model';

@Injectable({ providedIn: 'root' })
export class PatientPortalService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/patient-portal`;

  private readonly TOKEN_KEY = 'patient_portal_token';
  private readonly PATIENT_KEY = 'patient_portal_info';

  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  private _patient = signal<PatientPortalInfo | null>(this.loadPatient());

  readonly token = this._token.asReadonly();
  readonly patient = this._patient.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !this.isExpired());

  // ─── Auth ──────────────────────────────────────────────────────────────────

  requestAccess(tipoDocumento: string, identificacion: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.base}/request-access`, { tipoDocumento, identificacion })
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al solicitar acceso'))
        )
      );
  }

  verify(tipoDocumento: string, identificacion: string, codigo: string): Observable<PatientPortalVerifyResponse> {
    return this.http
      .post<PatientPortalVerifyResponse>(`${this.base}/verify`, { tipoDocumento, identificacion, codigo })
      .pipe(
        tap((res) => this.storeSession(res.token, res.patient)),
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Código inválido o expirado'))
        )
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.PATIENT_KEY);
    this._token.set(null);
    this._patient.set(null);
    this.router.navigate(['/patient-portal/login']);
  }

  // ─── Results ───────────────────────────────────────────────────────────────

  getResults(): Observable<PatientPortalResultsResponse> {
    // Always read from localStorage — signal may not reflect latest value on hard refresh
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout();
      return throwError(() => new Error('Sesión expirada. Por favor ingresa nuevamente.'));
    }
    return this.http
      .get<PatientPortalResultsResponse>(`${this.base}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError((err) => {
          if (err.status === 401) this.logout();
          return throwError(() => new Error(err.error?.error ?? 'Error al obtener resultados'));
        })
      );
  }

  downloadPdf(idSolicitudKey: string): Observable<Blob> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.logout();
      return throwError(() => new Error('Sesión expirada'));
    }
    return this.http
      .get(`${this.base}/results/${idSolicitudKey}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al descargar el PDF'))
        )
      );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private storeSession(token: string, patient: PatientPortalInfo & { id: number }): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.PATIENT_KEY, JSON.stringify(patient));
    this._token.set(token);
    this._patient.set(patient);
  }

  private loadPatient(): PatientPortalInfo | null {
    try {
      const raw = localStorage.getItem(this.PATIENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private isExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as PatientJwtPayload;
      return Date.now() / 1000 > payload.exp;
    } catch { return true; }
  }
}
