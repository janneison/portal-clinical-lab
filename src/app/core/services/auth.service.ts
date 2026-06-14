import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LoginRequest,
  LoginResponse,
  User,
  JwtPayload,
  UserPermissions,
  defaultPermissions,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'clinical_lab_token';
  private readonly USER_KEY  = 'clinical_lab_user';

  // ─── Signals ──────────────────────────────────────────────────────────────

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  private _token       = signal<string | null>(this.loadTokenFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token       = this._token.asReadonly();

  readonly isAuthenticated = computed(() => !!this._token() && !this.isTokenExpired());

  // ─── Permission signals (read directly from user.permissions) ─────────────

  private readonly _perms = computed<UserPermissions>(() => {
    const user = this._currentUser();
    if (!user) return defaultPermissions('viewer');
    return user.permissions ?? defaultPermissions(user.role);
  });

  // Convenience computed signals — no role names hardcoded in templates
  readonly canRegisterUsers    = computed(() => this._perms().canRegisterUsers);
  readonly canEditAliado       = computed(() => this._perms().canEditAliado);
  readonly canUploadAliadoLogo = computed(() => this._perms().canUploadAliadoLogo);
  readonly canCreateBacteriologo = computed(() => this._perms().canCreateBacteriologo);
  readonly canEditBacteriologo   = computed(() => this._perms().canEditBacteriologo);
  readonly canDeleteBacteriologo = computed(() => this._perms().canDeleteBacteriologo);
  readonly canUploadFirma      = computed(() => this._perms().canUploadFirma);
  readonly canCreateHealthCenter = computed(() => this._perms().canCreateHealthCenter);
  readonly canEditHealthCenter   = computed(() => this._perms().canEditHealthCenter);
  readonly canViewPatients     = computed(() => this._perms().canViewPatients);
  readonly canCreateOrder      = computed(() => this._perms().canCreateOrder);
  readonly canSendOrder        = computed(() => this._perms().canSendOrder);
  readonly canMarkOrdersSent   = computed(() => this._perms().canMarkOrdersSent);
  readonly canStoreResult      = computed(() => this._perms().canStoreResult);
  readonly canAttachPdf        = computed(() => this._perms().canAttachPdf);
  readonly canSendResultEmail  = computed(() => this._perms().canSendResultEmail);
  readonly canEditExamCatalog  = computed(() => this._perms().canEditExamCatalog);
  readonly canViewOrders       = computed(() => this._perms().canViewOrders);

  // Legacy role-based helpers (kept for guards that still need them)
  readonly isAdmin       = computed(() => this._currentUser()?.role === 'admin');
  readonly isLabOperator = computed(() =>
    ['admin', 'lab_operator'].includes(this._currentUser()?.role ?? '')
  );
  readonly isAliadoOperator = computed(() =>
    this._currentUser()?.role === 'aliado_operator'
  );
  readonly isMedico = computed(() => this._currentUser()?.role === 'medico');

  // ─── Auth methods ─────────────────────────────────────────────────────────

  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => this.storeSession(response.token, response.user)),
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Error al iniciar sesión'))
        )
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  requestPasswordReset(email: string) {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/password-reset/request`, { email })
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'No se pudo conectar con el servidor'))
        )
      );
  }

  confirmPasswordReset(token: string, password: string) {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/password-reset/confirm`, { token, password })
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.error ?? 'Token inválido o expirado'))
        )
      );
  }

  getMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        // Refresh permissions and health_centers if the API returns updated ones
        const stored = this._currentUser();
        if (stored) {
          const updated: User = {
            ...stored,
            permissions:    user.permissions    ?? stored.permissions,
            health_centers: user.health_centers ?? stored.health_centers,
          };
          this.storeSession(this._token()!, updated);
        }
      })
    );
  }

  // ─── Storage ──────────────────────────────────────────────────────────────

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
    try { return JSON.parse(raw) as User; }
    catch { return null; }
  }

  private isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    try {
      const payload = this.decodeToken(token);
      return Date.now() / 1000 > payload.exp;
    } catch { return true; }
  }

  decodeToken(token: string): JwtPayload {
    const base64  = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  }
}
