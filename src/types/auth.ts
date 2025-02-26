
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

export interface AuthState {
  token: string | null;
  user: {
    email: string;
    name: string;
    displayName: string;
  } | null;
  isAuthenticated: boolean;
}
