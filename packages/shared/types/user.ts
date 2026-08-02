// ============================================
// Shared User Types
// ============================================
// Used by: Frontend, Backend, VS Code Extension

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}
