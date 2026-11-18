import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthContext } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function loginDestination(role: string | undefined, from?: string): string {
  if (role === 'admin') {
    return from && from.startsWith('/admin') ? from : '/admin';
  }
  return '/blog';
}

export const Login: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, user } = useAuthContext();
  const location = useLocation();

  useEffect(() => {
    const node = document.getElementById('login');
    if (!node || typeof node.scrollIntoView !== 'function') return;
    const reduce = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [location.hash]);

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={loginDestination(user?.role, from)} replace />;
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
      <div id="login" className="container section first">
        <LoginForm
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
    </Layout>
  );
};
