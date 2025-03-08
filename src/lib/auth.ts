
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API_URL from '@/config/apiConfig';
import { AuthResponse, LoginRequest, SignupRequest, UserProfile } from '@/types/api';
import { toast } from 'sonner';
import React from 'react';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data: AuthResponse = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          if (data.success && data.token) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(data.message || 'Login failed');
          }

          return data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          const responseData: AuthResponse = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || 'Signup failed');
          }

          if (responseData.success && responseData.token) {
            set({
              user: responseData.user,
              token: responseData.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(responseData.message || 'Signup failed');
          }

          return responseData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Signup failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const token = get().token;
          if (token) {
            await fetch(`${API_URL}/api/v1/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      validateToken: async () => {
        const token = get().token;
        
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }
        
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            set({ isAuthenticated: false, user: null, token: null });
            return false;
          }
          
          const data = await response.json();
          
          if (data.valid) {
            set({ user: data.user, isAuthenticated: true });
            return true;
          } else {
            set({ isAuthenticated: false, user: null, token: null });
            return false;
          }
        } catch (error) {
          console.error('Token validation error:', error);
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Auth helpers
export const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const isAuthenticated = () => {
  return useAuthStore.getState().isAuthenticated;
};

// Token validation middleware for route guards
export const withAuth = (Component: React.ComponentType) => {
  const AuthGuard = (props: any) => {
    const { isAuthenticated, validateToken } = useAuthStore();
    
    React.useEffect(() => {
      const checkAuth = async () => {
        const isValid = await validateToken();
        if (!isValid) {
          // Handle unauthenticated state
          console.log('Authentication required');
        }
      };
      
      checkAuth();
    }, [validateToken]);
    
    // Properly render the Component using JSX
    if (!isAuthenticated) {
      return null;
    }
    
    return React.createElement(Component, props);
  };
  
  return AuthGuard;
};
