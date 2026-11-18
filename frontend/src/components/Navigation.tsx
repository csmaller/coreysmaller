import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const links = [
  { to: '/audio', label: 'Sounds' },
  { to: '/video', label: 'Sights' },
  { to: '/blog', label: 'Words' },
  { to: '/#epk', label: 'EPK' },
  { to: '/contact', label: 'Contact' },
];

export const Navigation: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.slice(1);
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const scrollToHash = (path: string) => {
    if (!path.startsWith('/#') || location.pathname !== '/') return;
    const node = document.getElementById(path.slice(2));
    if (!node || typeof node.scrollIntoView !== 'function') return;
    const reduce = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

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
            onClick={(event) => {
              close();
              if (!link.to.startsWith('/#') || location.pathname !== '/') return;
              event.preventDefault();
              scrollToHash(link.to);
              if (location.hash !== link.to.slice(1)) {
                navigate(link.to);
              }
            }}
          >
            {link.label}
          </Link>
        ))}
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
        ) : null}
      </nav>
    </header>
  );
};
