import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse, User, JwtPayload } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'clinical_lab_token';
  private readonly USER_KEY = 'clinical_lab_user';

  // Signals
  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(this.loadTokenFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !this.isTokenExpired());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isLabOperator = computed(() =>
    ['admin', 'lab_operator'].includes(this._currentUser()?.role ?? '')
  );
  readonly isAliadoOperator = computed(() =>
    this._currentUser()?.role === 'aliado_operator'
  );

  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.storeSession(response.token, response.user);
        }),
        catchError((err) => {
          const message = err.error?.error ?? 'Error al iniciar sesión';
          return throwError(() => new Error(message));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  }

  private storeSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._currentUser.set(user);
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    try {
      const payload = this.decodeToken(token);
      return Date.now() / 1000 > payload.exp;
    } catch {
      return true;
    }
  }

  decodeToken(token: string): JwtPayload {
    const base64 = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  }
}
