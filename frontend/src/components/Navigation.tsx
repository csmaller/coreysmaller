import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const links = [
  { to: '/audio', label: 'Sounds' },
  { to: '/video', label: 'Sights' },
  { to: '/blog', label: 'Words' },
  { to: '/contact', label: 'Contact' },
];

export const Navigation: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logout();
    close();
  };

  return (
    <header className="container site-header">
      <Link className="logo" to="/" onClick={close}>
        C. Smaller<span className="accent">.</span>
      </Link>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={isOpen}
        aria-controls="site-nav"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>
      <nav id="site-nav" className={`nav mono-label nav-panel${isOpen ? ' is-open' : ''}`} aria-label="Main">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActive(link.to) ? 'is-active' : undefined}
            onClick={close}
          >
            {link.label}
          </Link>
        ))}
        <a href="mailto:coreysmaller@gmail.com" onClick={close}>
          coreysmaller@gmail.com
        </a>
        {isAuthenticated && user?.role === 'admin' ? (
          <Link
            to="/admin"
            data-testid="dashboard-link"
            onClick={(event) => {
              event.preventDefault();
              close();
              navigate('/admin');
            }}
          >
            Dashboard
          </Link>
        ) : null}
        {isAuthenticated ? (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/login" onClick={close}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};
