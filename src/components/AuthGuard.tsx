import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, validateToken } = useAuthStore();
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await validateToken();
      setIsValidating(false);
      
      if (!isValid) {
        toast.error('Please log in to continue');
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [validateToken, navigate]);
  
  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
};

export const withAuthGuard = (Component: React.ComponentType) => {
  return function WithAuthGuard(props: any) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    );
  };
};