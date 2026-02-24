import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';
import { AuthContext } from '../contexts/AuthContext';

// Mock API responses
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockFetch.mockClear();
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication workflow', async () => {
      const user = userEvent.setup();

      // Mock successful login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          user: { id: '1', email: 'admin@test.com', role: 'admin' }
        }),
      });

      // Mock profile fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          email: 'admin@test.com',
          role: 'admin'
        }),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show login form initially
      expect(screen.getByText(/login/i)).toBeInTheDocument();

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'testpassword123');
      await user.click(loginButton);

      // Should redirect to admin dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Verify API calls
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'testpassword123',
          }),
        })
      );
    });

    it('should handle authentication errors', async () => {
      const user = userEvent.setup();

      // Mock failed login response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid credentials',
        }),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Fill in login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Should remain on login page
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });

  describe('Blog Management Integration', () => {
    const mockAuthContext = {
      user: { id: '1', email: 'admin@test.com', role: 'admin' } as any,
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    };

    it('should complete blog post creation workflow', async () => {
      const user = userEvent.setup();

      // Mock blog posts fetch (empty initially)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

      // Mock successful blog post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: 'Test Blog Post',
          content: 'This is test content',
          status: 'published',
          createdAt: new Date().toISOString(),
        }),
      });

      // Mock updated blog posts fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: '1',
            title: 'Test Blog Post',
            content: 'This is test content',
            status: 'published',
            createdAt: new Date().toISOString(),
          }
        ]),
      });

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <TestWrapper>
            <App />
          </TestWrapper>
        </AuthContext.Provider>
      );

      // Navigate to admin blog section
      const adminLink = screen.getByText(/admin/i);
      await user.click(adminLink);

      await waitFor(() => {
        expect(screen.getByText(/blog management/i)).toBeInTheDocument();
      });

      // Click create new post button
      const createButton = screen.getByText(/create new post/i);
      await user.click(createButton);

      // Fill in blog post form
      const titleInput = screen.getByLabelText(/title/i);
      const contentTextarea = screen.getByLabelText(/content/i);
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(titleInput, 'Test Blog Post');
      await user.type(contentTextarea, 'This is test content');
      await user.click(saveButton);

      // Should show success message and redirect
      await waitFor(() => {
        expect(screen.getByText(/post created successfully/i)).toBeInTheDocument();
      });

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/blog'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({
            title: 'Test Blog Post',
            content: 'This is test content',
            status: 'published',
          }),
        })
      );
    });

    it('should handle blog post validation errors', async () => {
      const user = userEvent.setup();

      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation failed',
          errors: ['Title is required', 'Content is required'],
        }),
      });

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <TestWrapper>
            <App />
          </TestWrapper>
        </AuthContext.Provider>
      );

      // Navigate to blog creation
      const adminLink = screen.getByText(/admin/i);
      await user.click(adminLink);

      const createButton = screen.getByText(/create new post/i);
      await user.click(createButton);

      // Try to save without filling required fields
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate between all major sections', async () => {
      const user = userEvent.setup();

      // Mock API responses for each section
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Blog posts
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Music tracks
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Videos
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }); // Audio

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Test navigation to each section
      const blogLink = screen.getByText(/blog/i);
      await user.click(blogLink);
      await waitFor(() => {
        expect(screen.getByText(/blog posts/i)).toBeInTheDocument();
      });

      const musicLink = screen.getByText(/music/i);
      await user.click(musicLink);
      await waitFor(() => {
        expect(screen.getByText(/music tracks/i)).toBeInTheDocument();
      });

      const videoLink = screen.getByText(/video/i);
      await user.click(videoLink);
      await waitFor(() => {
        expect(screen.getByText(/videos/i)).toBeInTheDocument();
      });

      const audioLink = screen.getByText(/audio/i);
      await user.click(audioLink);
      await waitFor(() => {
        expect(screen.getByText(/audio content/i)).toBeInTheDocument();
      });

      // Navigate back to home
      const homeLink = screen.getByText(/home/i);
      await user.click(homeLink);
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });
    });
  });

  describe('Content Display Integration', () => {
    it('should display content from all sections on home page', async () => {
      // Mock content aggregation API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recentPosts: [
            {
              id: '1',
              title: 'Recent Blog Post',
              excerpt: 'This is a recent blog post',
              createdAt: new Date().toISOString(),
            }
          ],
          featuredMusic: [
            {
              id: '1',
              title: 'Featured Song',
              genre: 'Rock',
              createdAt: new Date().toISOString(),
            }
          ],
          latestVideos: [
            {
              id: '1',
              title: 'Latest Video',
              youtubeId: 'test123',
              createdAt: new Date().toISOString(),
            }
          ],
        }),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should display content from all sections
      await waitFor(() => {
        expect(screen.getByText(/recent blog post/i)).toBeInTheDocument();
        expect(screen.getByText(/featured song/i)).toBeInTheDocument();
        expect(screen.getByText(/latest video/i)).toBeInTheDocument();
      });

      // Verify API call for content aggregation
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/content/recent'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors with proper error messages', async () => {
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Internal server error',
        }),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt layout for different screen sizes', () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;

      try {
        // Test mobile viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 667,
        });

        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        // Should show mobile navigation
        expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();

        // Test desktop viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 1080,
        });

        // Trigger resize event
        fireEvent(window, new Event('resize'));

        // Should show desktop navigation
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();

      } finally {
        // Restore original values
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: originalInnerWidth,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: originalInnerHeight,
        });
      }
    });
  });
});