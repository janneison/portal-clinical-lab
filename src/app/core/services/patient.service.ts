import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { Patient, PatientDetail, PatientsPage, CreatePatientRequest } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/patients`;

  getPatients(q = '', page = 1, limit = 20): Observable<PatientsPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<PatientsPage>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al obtener pacientes')))
    );
  }

  getPatient(id: number): Observable<PatientDetail> {
    return this.http.get<PatientDetail>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Paciente no encontrado')))
    );
  }

  createPatient(data: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.base, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al crear el paciente')))
    );
  }

  updatePatient(id: number, data: Partial<CreatePatientRequest>): Observable<Patient> {
    return this.http.put<Patient>(`${this.base}/${id}`, data).pipe(
      catchError((err) => throwError(() => new Error(err.error?.error ?? 'Error al actualizar el paciente')))
    );
  }
}
