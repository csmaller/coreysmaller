import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

// Lazy load components for code splitting
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(module => ({ default: module.BlogPostPage })));
const Music = lazy(() => import('./pages/Music').then(module => ({ default: module.Music })));
const AdminMusic = lazy(() => import('./pages/AdminMusic').then(module => ({ default: module.AdminMusic })));
const AdminBlog = lazy(() => import('./pages/AdminBlog').then(module => ({ default: module.AdminBlog })));
const Video = lazy(() => import('./pages/Video').then(module => ({ default: module.Video })));
const AdminVideo = lazy(() => import('./pages/AdminVideo').then(module => ({ default: module.AdminVideo })));
const Audio = lazy(() => import('./pages/Audio').then(module => ({ default: module.Audio })));
const AdminAudio = lazy(() => import('./pages/AdminAudio').then(module => ({ default: module.AdminAudio })));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics').then(module => ({ default: module.AdminAnalytics })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

function App() {
  // Monitor performance metrics
  usePerformanceMonitoring();

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/music" element={<Music />} />
              <Route path="/video" element={<Video />} />
              <Route path="/audio" element={<Audio />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog" 
                element={
                  <ProtectedRoute>
                    <AdminBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog/:id" 
                element={
                  <ProtectedRoute>
                    <AdminBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/music" 
                element={
                  <ProtectedRoute>
                    <AdminMusic />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/video" 
                element={
                  <ProtectedRoute>
                    <AdminVideo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/audio" 
                element={
                  <ProtectedRoute>
                    <AdminAudio />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute>
                    <AdminAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
