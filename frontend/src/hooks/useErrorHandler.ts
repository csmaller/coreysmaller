import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
}

interface UseErrorHandlerReturn {
  error: ErrorState | null;
  setError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  clearError: () => void;
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorState | null>(null);

  const setError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setErrorState({
      message,
      type,
      timestamp: new Date(),
    });

    // Log error to console for debugging
    console.error(`[${type.toUpperCase()}] ${message}`);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      errorMessage?: string
    ): Promise<T | null> => {
      try {
        clearError();
        return await asyncFn();
      } catch (err) {
        const message = errorMessage || getErrorMessage(err);
        setError(message);
        return null;
      }
    },
    [setError, clearError]
  );

  return {
    error,
    setError,
    clearError,
    handleAsyncError,
  };
};

// Helper function to extract meaningful error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'An unexpected error occurred';
}