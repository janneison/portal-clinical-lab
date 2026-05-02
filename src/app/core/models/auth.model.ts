export type UserRole = 'admin' | 'lab_operator' | 'aliado_operator' | 'viewer';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  aliados: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
  aliados: string[];
  iss: string;
  iat: number;
  exp: number;
}
