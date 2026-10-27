import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

interface AdminNavigationProps {
  currentView?: string;
  onViewChange?: (view: AdminView) => void;
}

type AdminView = 'dashboard' | 'blog-list' | 'blog-editor' | 'blog-create';

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentView,
  onViewChange
}) => {
  const { user, logout } = useAuthContext();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    if (currentView && (path === '/admin' || path === '/admin/blog')) {
      return currentView === path || (path === '/admin' && currentView === 'dashboard') || (path === '/admin/blog' && currentView.startsWith('blog'));
    }
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const linkClass = (path: string) => {
    const baseClass = "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors";
    return isActive(path)
      ? `${baseClass} bg-blue-100 text-blue-700`
      : `${baseClass} text-gray-700 hover:text-gray-900 hover:bg-gray-100`;
  };

  const navigationItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      path: '/admin/blog',
      label: 'Blog Posts',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/admin/video',
      label: 'Videos',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      path: '/admin/audio',
      label: 'Audio',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Admin Navigation */}
          <div className="flex items-center space-x-1">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors mr-6"
            >
              Corey Smaller
            </Link>
            <span className="text-gray-400 mr-4">|</span>
            <span className="text-lg font-semibold text-gray-700 mr-6">Admin Panel</span>
            
            <nav className="flex space-x-1">
              {navigationItems.map((item) => (
                <div key={item.path}>
                  {onViewChange && item.path === '/admin' ? (
                    <button
                      onClick={() => onViewChange('dashboard' as AdminView)}
                      className={linkClass('/admin')}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ) : onViewChange && item.path === '/admin/blog' ? (
                    <button
                      onClick={() => onViewChange('blog-list' as AdminView)}
                      className={linkClass('/admin/blog')}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={linkClass(item.path)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{user?.email}</span>
            </div>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              View Site
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};