import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthContext } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export const Login: React.FC = () => {
  const { login, isLoading, error, isAuthenticated } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Watch for authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Authentication detected, redirecting...');
      const from = (location.state as any)?.from?.pathname || '/admin';
      console.log('Redirect target:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/admin';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoginForm 
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
    </Layout>
  );
};