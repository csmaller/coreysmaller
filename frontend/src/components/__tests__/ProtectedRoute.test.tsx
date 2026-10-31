import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types';

function renderAt(user: User | null, isLoading = false, isAuthenticated = Boolean(user)) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login: jest.fn(),
        logout: jest.fn(),
        error: null,
        clearError: jest.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('waits while authentication is loading', () => {
    const { container } = renderAt(null, true, false);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });

  it('sends anonymous visitors to login', () => {
    renderAt(null);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows the page to an admin', () => {
    renderAt({
      id: 1,
      email: 'corey@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(screen.getByText('Admin page')).toBeInTheDocument();
  });

  it('sends a guest away from an admin page', () => {
    renderAt({
      id: 2,
      email: 'guest@example.com',
      role: 'guest',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });
});
