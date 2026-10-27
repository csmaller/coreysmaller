import React, { useState } from 'react';
import type { LoginCredentials } from '../types';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin, 
  isLoading = false, 
  error 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onLogin({ email, password });
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Login form error:', error);
    }
  };

  return (
    <div className="login-panel">
      <h2 className="display section-title">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mono-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="Enter your email"
            disabled={isLoading}
            autoComplete="email"
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mono-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="Enter your password"
            disabled={isLoading}
            autoComplete="current-password"
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-block"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};