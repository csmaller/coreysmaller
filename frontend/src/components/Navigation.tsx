import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  const linkClass = (path: string) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    return isActive(path)
      ? `${baseClass} bg-blue-100 text-blue-700`
      : `${baseClass} text-gray-700 hover:text-gray-900 hover:bg-gray-100`;
  };

  const mobileLinkClass = (path: string) => {
    const baseClass = "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200";
    return isActive(path)
      ? `${baseClass} bg-blue-100 text-blue-700`
      : `${baseClass} text-gray-700 hover:text-gray-900 hover:bg-gray-100`;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors duration-200"
              onClick={closeMobileMenu}
            >
              Corey Smaller
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Main navigation */}
            <div className="flex space-x-1">
              <Link to="/" className={linkClass('/')}>
                Home
              </Link>
              <Link to="/blog" className={linkClass('/blog')}>
                Blog
              </Link>
              <Link to="/music" className={linkClass('/music')}>
                Music
              </Link>
              <Link to="/video" className={linkClass('/video')}>
                Video
              </Link>
              <Link to="/audio" className={linkClass('/audio')}>
                Audio
              </Link>
            </div>

            {/* Authentication section */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/admin" 
                    className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Admin
                  </Link>
                  <span className="text-gray-600 text-sm hidden lg:inline">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              aria-expanded="false"
              aria-label="Toggle navigation menu"
            >
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            {/* Main navigation */}
            <Link 
              to="/" 
              className={mobileLinkClass('/')}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              to="/blog" 
              className={mobileLinkClass('/blog')}
              onClick={closeMobileMenu}
            >
              Blog
            </Link>
            <Link 
              to="/music" 
              className={mobileLinkClass('/music')}
              onClick={closeMobileMenu}
            >
              Music
            </Link>
            <Link 
              to="/video" 
              className={mobileLinkClass('/video')}
              onClick={closeMobileMenu}
            >
              Video
            </Link>
            <Link 
              to="/audio" 
              className={mobileLinkClass('/audio')}
              onClick={closeMobileMenu}
            >
              Audio
            </Link>
            
            {/* Authentication section */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Signed in as: {user?.email}
                  </div>
                  <Link 
                    to="/admin" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};