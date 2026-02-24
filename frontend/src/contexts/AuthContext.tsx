import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, LoginCredentials, AuthResponse } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for testing purposes
export { AuthContext };

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          try {
            // Try to fetch the latest profile with the existing token
            const profile = await authService.getProfile();
            setUser(profile);
            setIsAuthenticated(true);
          } catch (profileError) {
            console.warn('Profile fetch failed, attempting fallback:', profileError);
            // Profile fetch failed, try to use cached user data from localStorage
            const cachedUser = authService.getUser();
            if (cachedUser) {
              // Use cached user data if available
              setUser(cachedUser);
              setIsAuthenticated(true);
              console.log('Using cached user data from localStorage');
            } else {
              // No cached user and fetch failed, clear authentication
              authService.clearToken();
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      const userData = response.data?.user || response.user;
      setUser(userData);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};