import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthContext } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export const Login: React.FC = () => {
  const { login, isLoading, error, isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/admin';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
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